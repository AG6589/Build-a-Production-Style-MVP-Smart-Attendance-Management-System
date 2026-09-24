const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const jwtConfig = require('../config/jwt');
const { logAudit } = require('../utils/auditLogger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }

    const token = generateToken(user);

    // Fetch related profile if faculty or student
    let profile = null;
    if (user.role === 'faculty') {
      profile = await Faculty.findOne({ user: user._id }).populate('department');
    } else if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id })
        .populate('department')
        .populate('class')
        .populate('section');
    }

    await logAudit({ user, ip: req.ip }, {
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      newValue: { email: user.email, role: user.role },
      reason: 'User logged in successfully'
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = null;
    if (user.role === 'faculty') {
      profile = await Faculty.findOne({ user: user._id }).populate('department');
    } else if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id })
        .populate('department')
        .populate('class')
        .populate('section');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    const prev = { name: user.name, phone: user.phone };
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    if (user.role === 'faculty') {
      await Faculty.updateOne({ user: user._id }, { name });
    } else if (user.role === 'student') {
      await Student.updateOne({ user: user._id }, { name, phone });
    }

    await logAudit(req, {
      action: 'PROFILE_UPDATED',
      entity: 'User',
      entityId: user._id,
      previousValue: prev,
      newValue: { name: user.name, phone: user.phone },
      reason: 'User updated personal profile'
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, {
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user._id,
      reason: 'User changed password'
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword
};
