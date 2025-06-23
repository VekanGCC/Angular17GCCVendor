const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  approveUser,
  resetUserPassword,
  getUserProfile
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// User management routes
router.get('/all', getAllUsers);
router.get('/:id/profile', getUserProfile);
router.get('/all/:id', getUserById);
router.put('/all/:id', updateUser);
router.put('/all/:id/toggle-status', toggleUserStatus);
router.put('/all/:id/approve', approveUser);
router.put('/all/:id/reset-password', resetUserPassword);

module.exports = router;