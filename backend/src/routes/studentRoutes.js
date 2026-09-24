const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent
} = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, authorize('admin'), createStudent);
router.put('/:id', authenticate, authorize('admin'), updateStudent);

module.exports = router;
