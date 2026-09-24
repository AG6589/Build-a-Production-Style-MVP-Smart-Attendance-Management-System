const express = require('express');
const router = express.Router();
const {
  createCorrectionRequest,
  getCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest
} = require('../controllers/correctionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', authenticate, createCorrectionRequest);
router.get('/', authenticate, getCorrectionRequests);
router.put('/:id/approve', authenticate, authorize('admin', 'reviewer'), approveCorrectionRequest);
router.put('/:id/reject', authenticate, authorize('admin', 'reviewer'), rejectCorrectionRequest);

module.exports = router;
