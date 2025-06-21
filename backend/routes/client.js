const express = require('express');
const router = express.Router();
const {
  completeRegistration,
  getClientProfile,
  updateClientProfile,
  saveStep,
  sendOTP,
  verifyOTP,
  getClientRequirements
} = require('../controllers/clientController');
const { createApplication } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - no authentication required
router.post('/create', saveStep);

// Protected routes
router.use(protect);

// Client-only routes
router.get('/profile', authorize('client'), getClientProfile);
router.put('/profile', authorize('client'), updateClientProfile);
router.get('/requirements', authorize('client'), getClientRequirements);
router.post('/applications', authorize('client'), createApplication);

// Registration routes
router.post('/complete-registration', authorize('client'), completeRegistration);
router.post('/send-otp', authorize('client'), sendOTP);
router.post('/verify-otp', authorize('client'), verifyOTP);

module.exports = router;