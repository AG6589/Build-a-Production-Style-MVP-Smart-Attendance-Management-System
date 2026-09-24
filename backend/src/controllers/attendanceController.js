const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Subject = require('../models/Subject');
const Section = require('../models/Section');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');
const { getAttendanceThreshold } = require('../utils/threshold');
const { logAudit } = require('../utils/auditLogger');

// 1. Create or retrieve attendance session
const createOrGetSession = async (req, res, next) => {
  try {
    const { subjectId, sectionId, date, startTime, endTime, remarks } = req.body;

    if (!subjectId || !sectionId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Subject, Section, Date, and Start Time are required'
      });
    }

    const subject = await Subject.findById(subjectId).populate('department');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    // Determine faculty
    let facultyId = null;
    if (req.user.role === 'faculty') {
      const fac = await Faculty.findOne({ user: req.user._id });
      if (!fac) {
        return res.status(403).json({ success: false, message: 'Faculty profile not found' });
      }
      // Check if faculty is assigned to this subject (or allow if unassigned admin/reviewer override)
      if (subject.assignedFaculty && subject.assignedFaculty.toString() !== fac._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to conduct attendance for this subject'
        });
      }
      facultyId = fac._id;
    } else if (req.user.role === 'admin' || req.user.role === 'reviewer') {
      facultyId = subject.assignedFaculty || (await Faculty.findOne())?._id;
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    // Look for existing session for same subject, section, date, startTime
    let session = await AttendanceSession.findOne({
      subject: subjectId,
      section: sectionId,
      date: sessionDate,
      startTime
    });

    // Fetch students of this section
    const students = await Student.find({ section: sectionId, status: 'active' }).sort({ studentId: 1 });

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found in this section. Cannot mark attendance.'
      });
    }

    if (!session) {
      session = await AttendanceSession.create({
        subject: subjectId,
        section: sectionId,
        faculty: facultyId,
        department: subject.department._id,
        date: sessionDate,
        startTime,
        endTime: endTime || '',
        status: 'DRAFT',
        totalStudents: students.length,
        presentCount: students.length,
        absentCount: 0,
        remarks: remarks || ''
      });

      // Initialize draft records with PRESENT default
      const initialRecords = students.map((stu) => ({
        session: session._id,
        student: stu._id,
        subject: subjectId,
        section: sectionId,
        date: sessionDate,
        status: 'PRESENT',
        markedBy: req.user._id
      }));

      await AttendanceRecord.insertMany(initialRecords);

      await logAudit(req, {
        action: 'ATTENDANCE_SESSION_CREATED',
        entity: 'AttendanceSession',
        entityId: session._id,
        newValue: { subject: subject.code, section: section.name, date: sessionDate },
        reason: 'Faculty created attendance session draft'
      });
    }

    // Fetch records populated with student data
    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'studentId name rollNumber email phone')
      .sort({ 'student.studentId': 1 });

    res.status(200).json({
      success: true,
      data: {
        session,
        records
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get session details and student roster
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await AttendanceSession.findById(id)
      .populate('subject')
      .populate('section')
      .populate('faculty')
      .populate('department');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    const records = await AttendanceRecord.find({ session: session._id })
      .populate('student', 'studentId name rollNumber email phone')
      .sort({ 'student.studentId': 1 });

    res.status(200).json({
      success: true,
      data: {
        session,
        records
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Save draft attendance (editable, not locked)
const saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { records, remarks } = req.body;

    const session = await AttendanceSession.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'This attendance session has already been submitted and locked. You must raise a correction request.'
      });
    }

    // Role check: Faculty can only edit their sessions
    if (req.user.role === 'faculty') {
      const fac = await Faculty.findOne({ user: req.user._id });
      if (session.faculty.toString() !== fac._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You did not create this session' });
      }
    }

    let present = 0;
    let absent = 0;

    if (Array.isArray(records)) {
      for (const rec of records) {
        if (!rec.studentId || !rec.status) continue;
        const validStatus = ['PRESENT', 'ABSENT', 'LATE'].includes(rec.status) ? rec.status : 'PRESENT';
        if (validStatus === 'PRESENT' || validStatus === 'LATE') present++;
        else absent++;

        await AttendanceRecord.findOneAndUpdate(
          { session: session._id, student: rec.studentId },
          {
            status: validStatus,
            remarks: rec.remarks || '',
            markedBy: req.user._id
          },
          { upsert: true, new: true }
        );
      }
    }

    session.totalStudents = present + absent;
    session.presentCount = present;
    session.absentCount = absent;
    if (remarks !== undefined) session.remarks = remarks;

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Attendance draft saved successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// 4. Submit attendance (locks the session)
const submitAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { records, remarks } = req.body;

    const session = await AttendanceSession.findById(id)
      .populate('subject')
      .populate('section');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Attendance session is already submitted and locked.'
      });
    }

    // Role check
    if (req.user.role === 'faculty') {
      const fac = await Faculty.findOne({ user: req.user._id });
      if (session.faculty.toString() !== fac._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You did not create this session' });
      }
    }

    let present = 0;
    let absent = 0;

    if (Array.isArray(records)) {
      for (const rec of records) {
        if (!rec.studentId || !rec.status) continue;
        const validStatus = ['PRESENT', 'ABSENT', 'LATE'].includes(rec.status) ? rec.status : 'PRESENT';
        if (validStatus === 'PRESENT' || validStatus === 'LATE') present++;
        else absent++;

        await AttendanceRecord.findOneAndUpdate(
          { session: session._id, student: rec.studentId },
          {
            status: validStatus,
            remarks: rec.remarks || '',
            markedBy: req.user._id
          },
          { upsert: true, new: true }
        );
      }
    }

    session.totalStudents = present + absent;
    session.presentCount = present;
    session.absentCount = absent;
    session.status = 'SUBMITTED';
    session.submittedAt = new Date();
    if (remarks !== undefined) session.remarks = remarks;

    await session.save();

    await logAudit(req, {
      action: 'ATTENDANCE_SUBMITTED',
      entity: 'AttendanceSession',
      entityId: session._id,
      newValue: {
        totalStudents: session.totalStudents,
        presentCount: session.presentCount,
        absentCount: session.absentCount,
        status: 'SUBMITTED'
      },
      reason: 'Faculty submitted and locked attendance session'
    });

    // Check low attendance triggers for students in this subject
    const threshold = await getAttendanceThreshold();
    const studentRecords = await AttendanceRecord.find({ session: session._id }).populate('student');

    for (const rec of studentRecords) {
      if (!rec.student) continue;
      const totalSubjectSessions = await AttendanceRecord.countDocuments({
        student: rec.student._id,
        subject: session.subject._id
      });
      const attendedSubjectSessions = await AttendanceRecord.countDocuments({
        student: rec.student._id,
        subject: session.subject._id,
        status: { $in: ['PRESENT', 'LATE'] }
      });

      if (totalSubjectSessions >= 3) {
        const pct = Math.round((attendedSubjectSessions / totalSubjectSessions) * 100);
        if (pct < threshold) {
          // Send notification to student
          await Notification.create({
            recipient: rec.student.user,
            title: 'Low Attendance Warning',
            message: `Your attendance in ${session.subject.name} (${session.subject.code}) is ${pct}%, which is below the required ${threshold}%.`,
            type: 'WARNING',
            link: '/dashboard'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance submitted and locked successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// 5. Query attendance sessions / history
const getSessionsHistory = async (req, res, next) => {
  try {
    const { subjectId, sectionId, facultyId, startDate, endDate, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (subjectId) filter.subject = subjectId;
    if (sectionId) filter.section = sectionId;
    if (facultyId) filter.faculty = facultyId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Role-based scoping
    if (req.user.role === 'faculty') {
      const fac = await Faculty.findOne({ user: req.user._id });
      if (fac) filter.faculty = fac._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AttendanceSession.countDocuments(filter);

    const sessions = await AttendanceSession.find(filter)
      .populate('subject', 'name code semester')
      .populate('section', 'name')
      .populate('faculty', 'name facultyId')
      .populate('department', 'name code')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

// 6. Student's personal attendance summary
const getStudentAttendance = async (req, res, next) => {
  try {
    let studentId = req.params.studentId;

    if (req.user.role === 'student') {
      const self = await Student.findOne({ user: req.user._id });
      if (!self) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      studentId = self._id;
    } else if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID parameter is required' });
    }

    const student = await Student.findById(studentId)
      .populate('department')
      .populate('class')
      .populate('section');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Find all subjects for this section or semester
    const subjects = await Subject.find({
      $or: [{ section: student.section._id }, { semester: student.semester, department: student.department._id }]
    }).populate('assignedFaculty', 'name');

    const threshold = await getAttendanceThreshold();

    // Calculate metrics per subject
    const subjectWise = await Promise.all(
      subjects.map(async (subj) => {
        const total = await AttendanceRecord.countDocuments({
          student: student._id,
          subject: subj._id
        });

        const present = await AttendanceRecord.countDocuments({
          student: student._id,
          subject: subj._id,
          status: { $in: ['PRESENT', 'LATE'] }
        });

        const absent = total - present;
        // Avoid division by zero
        const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

        return {
          subject: {
            _id: subj._id,
            name: subj.name,
            code: subj.code,
            faculty: subj.assignedFaculty ? subj.assignedFaculty.name : 'Unassigned'
          },
          totalClasses: total,
          presentClasses: present,
          absentClasses: absent,
          percentage,
          isLowAttendance: total > 0 && percentage < threshold
        };
      })
    );

    // Calculate institution overall metrics
    const totalAll = subjectWise.reduce((acc, curr) => acc + curr.totalClasses, 0);
    const presentAll = subjectWise.reduce((acc, curr) => acc + curr.presentClasses, 0);
    const overallPercentage = totalAll > 0 ? Math.round((presentAll / totalAll) * 100 * 10) / 10 : 0;

    // Fetch recent 10 records
    const recentRecords = await AttendanceRecord.find({ student: student._id })
      .populate('subject', 'name code')
      .populate('session', 'date startTime status')
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          department: student.department?.name,
          class: student.class?.name,
          section: student.section?.name,
          semester: student.semester
        },
        threshold,
        overall: {
          totalClasses: totalAll,
          presentClasses: presentAll,
          absentClasses: totalAll - presentAll,
          percentage: overallPercentage,
          isLowAttendance: totalAll > 0 && overallPercentage < threshold
        },
        subjectWise,
        recentRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrGetSession,
  getSessionById,
  saveDraft,
  submitAttendance,
  getSessionsHistory,
  getStudentAttendance
};
