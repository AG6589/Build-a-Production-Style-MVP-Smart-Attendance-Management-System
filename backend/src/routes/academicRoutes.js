const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getClasses,
  createClass,
  getSections,
  createSection,
  getSubjects,
  createSubject,
  updateSubject
} = require('../controllers/academicController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Departments
router.get('/departments', authenticate, getDepartments);
router.post('/departments', authenticate, authorize('admin'), createDepartment);
router.put('/departments/:id', authenticate, authorize('admin'), updateDepartment);
router.delete('/departments/:id', authenticate, authorize('admin'), deleteDepartment);

// Classes
router.get('/classes', authenticate, getClasses);
router.post('/classes', authenticate, authorize('admin'), createClass);

// Sections
router.get('/sections', authenticate, getSections);
router.post('/sections', authenticate, authorize('admin'), createSection);

// Subjects
router.get('/subjects', authenticate, getSubjects);
router.post('/subjects', authenticate, authorize('admin'), createSubject);
router.put('/subjects/:id', authenticate, authorize('admin'), updateSubject);

module.exports = router;
