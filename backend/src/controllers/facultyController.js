const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { logAudit } = require('../utils/auditLogger');

const getFacultyList = async (req, res, next) => {
  try {
    const { department, status, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(filter)
      .populate('department')
      .populate('user', 'email role status')
      .sort({ name: 1 });

    // Attach assigned subjects count
    const facultyWithSubjects = await Promise.all(
      faculty.map(async (fac) => {
        const subjects = await Subject.find({ assignedFaculty: fac._id }).select('code name section');
        return {
          ...fac.toObject(),
          assignedSubjects: subjects
        };
      })
    );

    res.status(200).json({ success: true, count: facultyWithSubjects.length, data: facultyWithSubjects });
  } catch (error) {
    next(error);
  }
};

const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id)
      .populate('department')
      .populate('user', 'email role status');

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const assignedSubjects = await Subject.find({ assignedFaculty: faculty._id })
      .populate('section')
      .populate('class');

    res.status(200).json({
      success: true,
      data: {
        ...faculty.toObject(),
        assignedSubjects
      }
    });
  } catch (error) {
    next(error);
  }
};

const createFaculty = async (req, res, next) => {
  try {
    const { facultyId, name, email, department, designation, password } = req.body;

    if (!facultyId || !name || !email || !department) {
      return res.status(400).json({ success: false, message: 'Faculty ID, name, email, and department are required' });
    }

    // Check duplicate email or facultyId
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const existingFaculty = await Faculty.findOne({ facultyId: facultyId.toUpperCase() });
    if (existingFaculty) {
      return res.status(400).json({ success: false, message: 'Faculty with this Faculty ID already exists' });
    }

    // Create User record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Faculty@123',
      role: 'faculty',
      status: 'active'
    });

    // Create Faculty profile
    const faculty = await Faculty.create({
      facultyId: facultyId.toUpperCase(),
      user: user._id,
      name,
      email: email.toLowerCase(),
      department,
      designation: designation || 'Assistant Professor'
    });

    await logAudit(req, {
      action: 'FACULTY_CREATED',
      entity: 'Faculty',
      entityId: faculty._id,
      newValue: faculty.toObject(),
      reason: 'Admin added new faculty'
    });

    res.status(201).json({ success: true, message: 'Faculty created successfully', data: faculty });
  } catch (error) {
    next(error);
  }
};

const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, department, designation, status } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const prev = faculty.toObject();
    if (name) faculty.name = name;
    if (department) faculty.department = department;
    if (designation) faculty.designation = designation;
    if (status) faculty.status = status;

    await faculty.save();

    if (name || status) {
      await User.findByIdAndUpdate(faculty.user, {
        ...(name && { name }),
        ...(status && { status })
      });
    }

    await logAudit(req, {
      action: 'FACULTY_UPDATED',
      entity: 'Faculty',
      entityId: faculty._id,
      previousValue: prev,
      newValue: faculty.toObject(),
      reason: 'Admin updated faculty profile'
    });

    res.status(200).json({ success: true, message: 'Faculty updated successfully', data: faculty });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty
};
