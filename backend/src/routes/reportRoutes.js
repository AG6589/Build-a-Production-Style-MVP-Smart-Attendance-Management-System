const express = require('express');
const router = express.Router();
const {
  getStudentReport,
  getSubjectReport,
  getDepartmentReport,
  exportReportCSV
} = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/student/:studentId', authenticate, getStudentReport);
router.get('/subject/:subjectId', authenticate, authorize('admin', 'faculty', 'reviewer'), getSubjectReport);
router.get('/department/:departmentId', authenticate, authorize('admin', 'reviewer'), getDepartmentReport);
router.get('/export-csv', authenticate, authorize('admin', 'faculty', 'reviewer'), exportReportCSV);

module.exports = router;
