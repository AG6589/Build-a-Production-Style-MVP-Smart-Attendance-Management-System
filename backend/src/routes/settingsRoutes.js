const express = require('express');
const router = express.Router();
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('admin'), updateSetting);

module.exports = router;
