const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
