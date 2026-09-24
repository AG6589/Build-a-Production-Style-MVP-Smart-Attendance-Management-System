const Department = require('../models/Department');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { logAudit } = require('../utils/auditLogger');

// ------------------- DEPARTMENTS -------------------
const getDepartments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    const departments = await Department.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Code and Name are required' });
    }

    const dept = await Department.create({ code: code.toUpperCase(), name, description });

    await logAudit(req, {
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: dept._id,
      newValue: dept.toObject(),
      reason: 'Admin created department'
    });

    res.status(201).json({ success: true, message: 'Department created successfully', data: dept });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const prev = dept.toObject();
    if (name) dept.name = name;
    if (description !== undefined) dept.description = description;
    if (status) dept.status = status;

    await dept.save();

    await logAudit(req, {
      action: 'DEPARTMENT_UPDATED',
      entity: 'Department',
      entityId: dept._id,
      previousValue: prev,
      newValue: dept.toObject(),
      reason: 'Admin updated department'
    });

    res.status(200).json({ success: true, message: 'Department updated successfully', data: dept });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Edge case check: cascade dependency check
    const classesCount = await Class.countDocuments({ department: id });
    const subjectsCount = await Subject.countDocuments({ department: id });
    const studentsCount = await Student.countDocuments({ department: id });
    const facultyCount = await Faculty.countDocuments({ department: id });

    if (classesCount > 0 || subjectsCount > 0 || studentsCount > 0 || facultyCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: It is actively linked to ${classesCount} classes, ${subjectsCount} subjects, ${studentsCount} students, and ${facultyCount} faculty.`
      });
    }

    const dept = await Department.findByIdAndDelete(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await logAudit(req, {
      action: 'DEPARTMENT_DELETED',
      entity: 'Department',
      entityId: id,
      previousValue: dept.toObject(),
      reason: 'Admin deleted department'
    });

    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ------------------- CLASSES -------------------
const getClasses = async (req, res, next) => {
  try {
    const { department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;

    const classes = await Class.find(filter).populate('department').sort({ name: 1 });
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    next(error);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, code, department, durationYears, totalSemesters } = req.body;
    if (!name || !code || !department) {
      return res.status(400).json({ success: false, message: 'Name, code, and department are required' });
    }

    const cls = await Class.create({
      name,
      code: code.toUpperCase(),
      department,
      durationYears: durationYears || 4,
      totalSemesters: totalSemesters || 8
    });

    await logAudit(req, {
      action: 'CLASS_CREATED',
      entity: 'Class',
      entityId: cls._id,
      newValue: cls.toObject(),
      reason: 'Admin created class'
    });

    res.status(201).json({ success: true, message: 'Class created successfully', data: cls });
  } catch (error) {
    next(error);
  }
};

// ------------------- SECTIONS -------------------
const getSections = async (req, res, next) => {
  try {
    const { classId, department, semester, status } = req.query;
    const filter = {};
    if (classId) filter.class = classId;
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (status) filter.status = status;

    const sections = await Section.find(filter)
      .populate('class')
      .populate('department')
      .sort({ semester: 1, name: 1 });

    res.status(200).json({ success: true, count: sections.length, data: sections });
  } catch (error) {
    next(error);
  }
};

const createSection = async (req, res, next) => {
  try {
    const { name, class: classId, department, semester, academicYear } = req.body;
    if (!name || !classId || !department || !semester) {
      return res.status(400).json({ success: false, message: 'Name, class, department, and semester are required' });
    }

    const section = await Section.create({
      name,
      class: classId,
      department,
      semester,
      academicYear: academicYear || '2025-2026'
    });

    await logAudit(req, {
      action: 'SECTION_CREATED',
      entity: 'Section',
      entityId: section._id,
      newValue: section.toObject(),
      reason: 'Admin created section'
    });

    res.status(201).json({ success: true, message: 'Section created successfully', data: section });
  } catch (error) {
    next(error);
  }
};

// ------------------- SUBJECTS -------------------
const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, facultyId, sectionId, status, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (facultyId) filter.assignedFaculty = facultyId;
    if (sectionId) filter.section = sectionId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('department')
      .populate('class')
      .populate('assignedFaculty')
      .populate('section')
      .sort({ code: 1 });

    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { code, name, department, class: classId, semester, assignedFaculty, section } = req.body;
    if (!code || !name || !department || !classId || !semester) {
      return res.status(400).json({ success: false, message: 'Code, name, department, class, and semester are required' });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      department,
      class: classId,
      semester,
      assignedFaculty: assignedFaculty || null,
      section: section || null
    });

    await logAudit(req, {
      action: 'SUBJECT_CREATED',
      entity: 'Subject',
      entityId: subject._id,
      newValue: subject.toObject(),
      reason: 'Admin created subject'
    });

    res.status(201).json({ success: true, message: 'Subject created successfully', data: subject });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, assignedFaculty, section, status } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const prev = subject.toObject();
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (assignedFaculty !== undefined) subject.assignedFaculty = assignedFaculty || null;
    if (section !== undefined) subject.section = section || null;
    if (status) subject.status = status;

    await subject.save();

    await logAudit(req, {
      action: 'SUBJECT_UPDATED',
      entity: 'Subject',
      entityId: subject._id,
      previousValue: prev,
      newValue: subject.toObject(),
      reason: 'Admin updated subject'
    });

    res.status(200).json({ success: true, message: 'Subject updated successfully', data: subject });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getClasses,
  createClass,
  getSections,
  createSection,
  getSubjects,
  createSubject,
  updateSubject
};
