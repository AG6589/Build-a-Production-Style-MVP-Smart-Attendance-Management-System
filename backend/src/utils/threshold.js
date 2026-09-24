const Setting = require('../models/Setting');

const DEFAULT_THRESHOLD = 75;

const getAttendanceThreshold = async () => {
  try {
    const setting = await Setting.findOne({ key: 'lowAttendanceThreshold' });
    if (setting && typeof setting.value === 'number') {
      return setting.value;
    }
    return DEFAULT_THRESHOLD;
  } catch (error) {
    console.error('Error fetching attendance threshold setting:', error.message);
    return DEFAULT_THRESHOLD;
  }
};

module.exports = { getAttendanceThreshold, DEFAULT_THRESHOLD };
