const express = require('express');
const router = express.Router();
const {
  createOrGetSession,
  getSessionById,
  saveDraft,
  submitAttendance,
  getSessionsHistory,
  getStudentAttendance
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Attendance sessions
router.post('/sessions', authenticate, authorize('faculty', 'admin', 'reviewer'), createOrGetSession);
router.get('/sessions', authenticate, getSessionsHistory);
router.get('/sessions/:id', authenticate, getSessionById);
router.put('/sessions/:id/draft', authenticate, authorize('faculty', 'admin'), saveDraft);
router.post('/sessions/:id/submit', authenticate, authorize('faculty', 'admin'), submitAttendance);

// Student attendance summaries
router.get('/student-summary', authenticate, getStudentAttendance);
router.get('/student-summary/:studentId', authenticate, getStudentAttendance);

module.exports = router;
