const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'CORRECTION', 'ALERT'],
      default: 'INFO'
    },
    read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
