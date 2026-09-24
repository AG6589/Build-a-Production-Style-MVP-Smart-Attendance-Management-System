const AuditLog = require('../models/AuditLog');

const logAudit = async (req, { action, entity, entityId, previousValue, newValue, reason }) => {
  try {
    const performedBy = req?.user?._id || null;
    const userRole = req?.user?.role || 'system';
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';

    await AuditLog.create({
      performedBy,
      userRole,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      previousValue,
      newValue,
      reason,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
  }
};

module.exports = { logAudit };
