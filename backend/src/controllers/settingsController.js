const Setting = require('../models/Setting');
const { logAudit } = require('../utils/auditLogger');
const { DEFAULT_THRESHOLD } = require('../utils/threshold');

const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    if (settingsMap.lowAttendanceThreshold === undefined) {
      settingsMap.lowAttendanceThreshold = DEFAULT_THRESHOLD;
    }

    res.status(200).json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting key and value are required'
      });
    }

    if (key === 'lowAttendanceThreshold') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 100) {
        return res.status(400).json({
          success: false,
          message: 'Attendance threshold must be a number between 1 and 100'
        });
      }
    }

    const prev = await Setting.findOne({ key });
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, description: req.body.description || '' },
      { upsert: true, new: true }
    );

    await logAudit(req, {
      action: 'SETTING_UPDATED',
      entity: 'Setting',
      entityId: setting._id,
      previousValue: prev ? prev.value : null,
      newValue: value,
      reason: `Admin updated setting '${key}' to ${value}`
    });

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSetting
};
