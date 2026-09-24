const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const CorrectionRequest = require('../models/CorrectionRequest');
const { getAttendanceThreshold } = require('../utils/threshold');

const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const threshold = await getAttendanceThreshold();

    if (role === 'admin') {
      const totalStudents = await Student.countDocuments({ status: 'active' });
      const totalFaculty = await Faculty.countDocuments({ status: 'active' });
      const totalDepartments = await Department.countDocuments({ status: 'active' });
      const totalSubjects = await Subject.countDocuments({ status: 'active' });

      // Sessions today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todaySessions = await AttendanceSession.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd }
      });

      const pendingCorrections = await CorrectionRequest.countDocuments({ status: 'PENDING' });

      // Overall average attendance
      const totalRecords = await AttendanceRecord.countDocuments();
      const presentRecords = await AttendanceRecord.countDocuments({ status: { $in: ['PRESENT', 'LATE'] } });
      const overallAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10 : 0;

      // Students below threshold count
      const allStudents = await Student.find({ status: 'active' });
      let lowAttendanceCount = 0;
      for (const s of allStudents) {
        const sTotal = await AttendanceRecord.countDocuments({ student: s._id });
        if (sTotal > 0) {
          const sPresent = await AttendanceRecord.countDocuments({
            student: s._id,
            status: { $in: ['PRESENT', 'LATE'] }
          });
          if ((sPresent / sTotal) * 100 < threshold) {
            lowAttendanceCount++;
          }
        }
      }

      // Department-wise attendance breakdown
      const departments = await Department.find({ status: 'active' });
      const departmentStats = await Promise.all(
        departments.map(async (dept) => {
          const deptStudents = await Student.find({ department: dept._id });
          const studentIds = deptStudents.map((s) => s._id);
          const deptTotal = await AttendanceRecord.countDocuments({ student: { $in: studentIds } });
          const deptPresent = await AttendanceRecord.countDocuments({
            student: { $in: studentIds },
            status: { $in: ['PRESENT', 'LATE'] }
          });
          const avg = deptTotal > 0 ? Math.round((deptPresent / deptTotal) * 100) : 0;

          return {
            name: dept.code,
            fullName: dept.name,
            averageAttendance: avg,
            totalStudents: deptStudents.length
          };
        })
      );

      // Recent 7 days trend
      const trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const recs = await AttendanceRecord.find({ date: { $gte: dayStart, $lte: dayEnd } });
        const present = recs.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const pct = recs.length > 0 ? Math.round((present / recs.length) * 100) : 0;

        trend.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          attendance: pct,
          sessions: await AttendanceSession.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } })
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalStudents,
            totalFaculty,
            totalDepartments,
            totalSubjects,
            todaySessions,
            pendingCorrections,
            overallAttendance,
            lowAttendanceCount,
            threshold
          },
          charts: {
            departmentStats,
            trend
          }
        }
      });
    }

    if (role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' });

      const assignedSubjects = await Subject.find({ assignedFaculty: faculty._id }).populate('section');
      const subjectIds = assignedSubjects.map((s) => s._id);

      const totalConducted = await AttendanceSession.countDocuments({
        faculty: faculty._id,
        status: 'SUBMITTED'
      });

      // Today sessions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todaySessions = await AttendanceSession.find({
        faculty: faculty._id,
        date: { $gte: todayStart, $lte: todayEnd }
      }).populate('subject section');

      // Pending corrections for faculty's subjects
      const pendingCorrections = await CorrectionRequest.countDocuments({
        subject: { $in: subjectIds },
        status: 'PENDING'
      });

      // Faculty average attendance
      const records = await AttendanceRecord.find({ subject: { $in: subjectIds } });
      const presentRecs = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      const avgAttendance = records.length > 0 ? Math.round((presentRecs / records.length) * 100 * 10) / 10 : 0;

      // Low attendance students for faculty's subjects
      const lowAttendanceList = [];
      for (const subj of assignedSubjects) {
        if (!subj.section) continue;
        const students = await Student.find({ section: subj.section._id });
        for (const stu of students) {
          const tot = await AttendanceRecord.countDocuments({ student: stu._id, subject: subj._id });
          if (tot > 0) {
            const pres = await AttendanceRecord.countDocuments({
              student: stu._id,
              subject: subj._id,
              status: { $in: ['PRESENT', 'LATE'] }
            });
            const pct = Math.round((pres / tot) * 100);
            if (pct < threshold) {
              lowAttendanceList.push({
                studentId: stu.studentId,
                name: stu.name,
                subject: subj.code,
                section: subj.section.name,
                percentage: pct,
                classesAttended: `${pres}/${tot}`
              });
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            assignedSubjectsCount: assignedSubjects.length,
            totalConductedSessions: totalConducted,
            pendingCorrections,
            averageAttendance: avgAttendance,
            threshold,
            lowAttendanceCount: lowAttendanceList.length
          },
          todaySessions,
          assignedSubjects,
          lowAttendanceList: lowAttendanceList.slice(0, 10)
        }
      });
    }

    if (role === 'student') {
      const student = await Student.findOne({ user: req.user._id })
        .populate('department')
        .populate('class')
        .populate('section');

      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      // Find subjects
      const subjects = await Subject.find({
        $or: [{ section: student.section._id }, { semester: student.semester, department: student.department._id }]
      }).populate('assignedFaculty', 'name');

      const subjectStats = await Promise.all(
        subjects.map(async (subj) => {
          const total = await AttendanceRecord.countDocuments({ student: student._id, subject: subj._id });
          const present = await AttendanceRecord.countDocuments({
            student: student._id,
            subject: subj._id,
            status: { $in: ['PRESENT', 'LATE'] }
          });
          const pct = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;
          return {
            subjectId: subj._id,
            subjectCode: subj.code,
            subjectName: subj.name,
            faculty: subj.assignedFaculty?.name || 'Unassigned',
            totalClasses: total,
            presentClasses: present,
            absentClasses: total - present,
            percentage: pct,
            isLowAttendance: total > 0 && pct < threshold
          };
        })
      );

      const totalAll = subjectStats.reduce((acc, c) => acc + c.totalClasses, 0);
      const presentAll = subjectStats.reduce((acc, c) => acc + c.presentClasses, 0);
      const overall = totalAll > 0 ? Math.round((presentAll / totalAll) * 100 * 10) / 10 : 0;

      const recentRecords = await AttendanceRecord.find({ student: student._id })
        .populate('subject', 'name code')
        .populate('session', 'date startTime status')
        .sort({ date: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        data: {
          student: {
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            section: student.section?.name,
            department: student.department?.name
          },
          metrics: {
            overallPercentage: overall,
            totalClasses: totalAll,
            presentClasses: presentAll,
            absentClasses: totalAll - presentAll,
            threshold,
            isLowAttendance: totalAll > 0 && overall < threshold
          },
          subjects: subjectStats,
          recentRecords
        }
      });
    }

    if (role === 'reviewer') {
      const pendingCount = await CorrectionRequest.countDocuments({ status: 'PENDING' });
      const approvedCount = await CorrectionRequest.countDocuments({ status: 'APPROVED' });
      const rejectedCount = await CorrectionRequest.countDocuments({ status: 'REJECTED' });

      const pendingRequests = await CorrectionRequest.find({ status: 'PENDING' })
        .populate('student', 'name studentId')
        .populate('subject', 'name code')
        .populate('session', 'date')
        .populate('requestedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            pendingCount,
            approvedCount,
            rejectedCount,
            totalProcessed: approvedCount + rejectedCount,
            threshold
          },
          pendingRequests
        }
      });
    }

    res.status(200).json({ success: true, message: 'Welcome to the Smart Attendance System' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
