const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 12
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

subjectSchema.index({ code: 1, section: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Subject', subjectSchema);
