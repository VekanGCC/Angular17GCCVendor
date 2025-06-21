const express = require('express');
const router = express.Router();
const {
  getPendingApprovals,
  getApproval,
  approveEntity,
  rejectEntity,
  getPlatformStats,
  getAdminSkills,
  getAdminSkill,
  createAdminSkill,
  updateAdminSkill,
  deleteAdminSkill,
  getAllTransactions,
  getTransaction,
  updateTransaction,
  getAdminUsers,
  createAdminUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/adminMiddleware');

// All routes are protected and admin-only
router.use(protect);

// Approval routes
router.get('/approvals', getPendingApprovals);
router.get('/approvals/:id', getApproval);
router.put('/approvals/:id/approve', approveEntity);
router.put('/approvals/:id/reject', rejectEntity);

// Platform statistics
router.get('/stats', getPlatformStats);

// Admin skills routes
router.route('/skills')
  .get(getAdminSkills)
  .post(createAdminSkill);

router.route('/skills/:id')
  .get(getAdminSkill)
  .put(updateAdminSkill)
  .delete(deleteAdminSkill);

// Transaction routes
router.get('/transactions', getAllTransactions);
router.route('/transactions/:id')
  .get(getTransaction)
  .put(updateTransaction);

// Admin user management
router.route('/users')
  .get(getAdminUsers)
  .post(createAdminUser);

module.exports = router;