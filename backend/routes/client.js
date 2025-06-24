const express = require('express');
const router = express.Router();
const {
  completeRegistration,
  getClientProfile,
  updateClientProfile,
  saveStep,
  sendOTP,
  verifyOTP,
  getClientRequirements,
  getOrganizationUsers,
  addOrganizationUser,
  updateUserStatus
} = require('../controllers/clientController');
const { createApplication } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - no authentication required
router.post('/create', saveStep);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.use(protect);

// Client-only routes
router.get('/profile', authorize('client'), getClientProfile);
router.put('/profile', authorize('client'), updateClientProfile);
router.get('/requirements', authorize('client'), getClientRequirements);
router.post('/applications', authorize('client'), createApplication);

// Client User Management routes
router.get('/organization/users', authorize('client'), getOrganizationUsers);
router.post('/organization/users', authorize('client'), addOrganizationUser);
router.put('/organization/users/:userId/status', authorize('client'), updateUserStatus);

// Registration routes
router.post('/complete-registration', authorize('client'), completeRegistration);

module.exports = router;