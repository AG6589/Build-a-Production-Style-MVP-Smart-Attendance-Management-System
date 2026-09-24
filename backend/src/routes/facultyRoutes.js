const express = require('express');
const router = express.Router();
const {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty
} = require('../controllers/facultyController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', authenticate, getFacultyList);
router.get('/:id', authenticate, getFacultyById);
router.post('/', authenticate, authorize('admin'), createFaculty);
router.put('/:id', authenticate, authorize('admin'), updateFaculty);

module.exports = router;
