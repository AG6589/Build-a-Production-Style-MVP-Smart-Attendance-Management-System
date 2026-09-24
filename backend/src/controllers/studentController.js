const Student = require('../models/Student');
const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord');
const { getAttendanceThreshold } = require('../utils/threshold');
const { logAudit } = require('../utils/auditLogger');

const getStudents = async (req, res, next) => {
  try {
    const { department, classId, sectionId, semester, status, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (classId) filter.class = classId;
    if (sectionId) filter.section = sectionId;
    if (semester) filter.semester = Number(semester);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(filter);

    const students = await Student.find(filter)
      .populate('department', 'name code')
      .populate('class', 'name code')
      .populate('section', 'name semester')
      .sort({ studentId: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .populate('department')
      .populate('class')
      .populate('section')
      .populate('user', 'email role status');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role security check: student cannot view another student's profile unless Admin/Faculty/Reviewer
    if (req.user.role === 'student') {
      const selfStudent = await Student.findOne({ user: req.user._id });
      if (!selfStudent || selfStudent._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are only permitted to view your own attendance profile'
        });
      }
    }

    // Calculate overall attendance stats
    const totalRecords = await AttendanceRecord.countDocuments({ student: student._id });
    const presentRecords = await AttendanceRecord.countDocuments({
      student: student._id,
      status: { $in: ['PRESENT', 'LATE'] }
    });

    const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 10) / 10 : 0;
    const threshold = await getAttendanceThreshold();

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        attendanceSummary: {
          totalClasses: totalRecords,
          presentClasses: presentRecords,
          absentClasses: totalRecords - presentRecords,
          percentage,
          threshold,
          isLowAttendance: totalRecords > 0 && percentage < threshold
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { studentId, name, email, phone, department, class: classId, section, semester, rollNumber, password } = req.body;

    if (!studentId || !name || !email || !department || !classId || !section || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Name, Email, Department, Class, Section, and Semester are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const existingStudent = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student with this Student ID already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Student@123',
      role: 'student',
      status: 'active'
    });

    const student = await Student.create({
      studentId: studentId.toUpperCase(),
      user: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      class: classId,
      section,
      semester: Number(semester),
      rollNumber
    });

    await logAudit(req, {
      action: 'STUDENT_CREATED',
      entity: 'Student',
      entityId: student._id,
      newValue: student.toObject(),
      reason: 'Admin added new student'
    });

    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, department, class: classId, section, semester, rollNumber, status } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const prev = student.toObject();
    if (name) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (department) student.department = department;
    if (classId) student.class = classId;
    if (section) student.section = section;
    if (semester) student.semester = Number(semester);
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (status) student.status = status;

    await student.save();

    if (name || status) {
      await User.findByIdAndUpdate(student.user, {
        ...(name && { name }),
        ...(status && { status })
      });
    }

    await logAudit(req, {
      action: 'STUDENT_UPDATED',
      entity: 'Student',
      entityId: student._id,
      previousValue: prev,
      newValue: student.toObject(),
      reason: 'Admin updated student profile'
    });

    res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent
};
