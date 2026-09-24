const CorrectionRequest = require('../models/CorrectionRequest');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

// 1. Create correction request
const createCorrectionRequest = async (req, res, next) => {
  try {
    const { recordId, requestedStatus, reason, comment } = req.body;

    if (!recordId || !requestedStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Record ID, Requested Status, and Reason are required'
      });
    }

    const record = await AttendanceRecord.findById(recordId)
      .populate('session')
      .populate('student')
      .populate('subject');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Edge case: check if session is submitted
    if (record.session.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: 'Correction requests can only be raised for submitted attendance sessions'
      });
    }

    // Check if student belongs to this record if student role
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== record.student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only raise correction requests for your own attendance records'
        });
      }
    }

    // Check if there is already an active PENDING request for this record
    const existingPending = await CorrectionRequest.findOne({
      record: record._id,
      status: 'PENDING'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'A pending correction request already exists for this attendance record'
      });
    }

    const correction = await CorrectionRequest.create({
      session: record.session._id,
      record: record._id,
      student: record.student._id,
      subject: record.subject._id,
      requestedBy: req.user._id,
      requestedRole: req.user.role,
      originalStatus: record.status,
      requestedStatus,
      reason,
      comment: comment || '',
      status: 'PENDING'
    });

    await logAudit(req, {
      action: 'CORRECTION_REQUESTED',
      entity: 'CorrectionRequest',
      entityId: correction._id,
      newValue: {
        student: record.student.studentId,
        subject: record.subject.code,
        originalStatus: record.status,
        requestedStatus,
        reason
      },
      reason: 'User submitted attendance correction request'
    });

    // Notify reviewers/admins
    const reviewers = await User.find({ role: { $in: ['reviewer', 'admin'] } });
    for (const rev of reviewers) {
      await Notification.create({
        recipient: rev._id,
        title: 'New Correction Request',
        message: `${req.user.name} submitted a correction request for ${record.student.name} in ${record.subject.code}.`,
        type: 'CORRECTION',
        link: '/corrections'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully and is pending review',
      data: correction
    });
  } catch (error) {
    next(error);
  }
};

// 2. List correction requests with role-based scoping
const getCorrectionRequests = async (req, res, next) => {
  try {
    const { status, subjectId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (subjectId) filter.subject = subjectId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      filter.student = student._id;
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ user: req.user._id });
      if (faculty) {
        // Find subjects taught by faculty
        const Subject = require('../models/Subject');
        const subjects = await Subject.find({ assignedFaculty: faculty._id }).select('_id');
        const subjectIds = subjects.map(s => s._id);
        filter.subject = { $in: subjectIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await CorrectionRequest.countDocuments(filter);

    const requests = await CorrectionRequest.find(filter)
      .populate('student', 'name studentId rollNumber')
      .populate('subject', 'name code')
      .populate('session', 'date startTime status')
      .populate('requestedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// 3. Approve correction request
const approveCorrectionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerComment } = req.body;

    const request = await CorrectionRequest.findById(id)
      .populate('student')
      .populate('subject')
      .populate('session');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Correction request has already been ${request.status.toLowerCase()}`
      });
    }

    // Update AttendanceRecord
    const record = await AttendanceRecord.findById(request.record);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Target attendance record not found' });
    }

    const prevRecordStatus = record.status;
    record.status = request.requestedStatus;
    await record.save();

    // Recalculate session counts
    const session = await AttendanceSession.findById(request.session._id);
    if (session) {
      const presentCount = await AttendanceRecord.countDocuments({
        session: session._id,
        status: { $in: ['PRESENT', 'LATE'] }
      });
      const totalCount = await AttendanceRecord.countDocuments({ session: session._id });
      session.presentCount = presentCount;
      session.absentCount = totalCount - presentCount;
      await session.save();
    }

    // Update request state
    request.status = 'APPROVED';
    request.reviewedBy = req.user._id;
    request.reviewerComment = reviewerComment || 'Approved after review';
    request.reviewedAt = new Date();
    await request.save();

    // Log audit trail
    await logAudit(req, {
      action: 'CORRECTION_APPROVED',
      entity: 'CorrectionRequest',
      entityId: request._id,
      previousValue: { status: prevRecordStatus },
      newValue: { status: request.requestedStatus, reviewerComment: request.reviewerComment },
      reason: `Correction approved: ${request.reason}`
    });

    // Notify student
    await Notification.create({
      recipient: request.student.user,
      title: 'Correction Request Approved',
      message: `Your attendance correction request for ${request.subject.code} on ${new Date(request.session.date).toLocaleDateString()} was approved. Status changed to ${request.requestedStatus}.`,
      type: 'INFO',
      link: '/corrections'
    });

    res.status(200).json({
      success: true,
      message: 'Correction request approved and attendance record updated',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// 4. Reject correction request
const rejectCorrectionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerComment } = req.body;

    if (!reviewerComment) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer comment/reason is required when rejecting a request'
      });
    }

    const request = await CorrectionRequest.findById(id)
      .populate('student')
      .populate('subject')
      .populate('session');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Correction request has already been ${request.status.toLowerCase()}`
      });
    }

    request.status = 'REJECTED';
    request.reviewedBy = req.user._id;
    request.reviewerComment = reviewerComment;
    request.reviewedAt = new Date();
    await request.save();

    await logAudit(req, {
      action: 'CORRECTION_REJECTED',
      entity: 'CorrectionRequest',
      entityId: request._id,
      newValue: { status: 'REJECTED', reviewerComment },
      reason: `Correction rejected: ${reviewerComment}`
    });

    // Notify student
    await Notification.create({
      recipient: request.student.user,
      title: 'Correction Request Rejected',
      message: `Your attendance correction request for ${request.subject.code} was rejected. Reason: ${reviewerComment}`,
      type: 'WARNING',
      link: '/corrections'
    });

    res.status(200).json({
      success: true,
      message: 'Correction request rejected. Attendance record remains unchanged.',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCorrectionRequest,
  getCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest
};
