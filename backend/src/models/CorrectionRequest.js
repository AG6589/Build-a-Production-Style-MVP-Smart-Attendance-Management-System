const mongoose = require('mongoose');

const correctionRequestSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session is required']
    },
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: [true, 'Attendance record is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required']
    },
    requestedRole: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true
    },
    originalStatus: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE'],
      required: true
    },
    requestedStatus: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE'],
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Reason for correction is required'],
      trim: true
    },
    comment: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewerComment: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

correctionRequestSchema.index({ status: 1 });
correctionRequestSchema.index({ student: 1, status: 1 });
correctionRequestSchema.index({ session: 1, record: 1 });

module.exports = mongoose.model('CorrectionRequest', correctionRequestSchema);
