const express = require('express');
const router = express.Router();
const {
  saveStep,
  getRegistrationStatus,
  uploadDocuments,
  getVendorProfile,
  updateVendorProfile
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const { validateVendorStep3 } = require('../validation/vendorValidation');

// Registration routes
router.post('/create', saveStep);
router.get('/registration/status', protect, getRegistrationStatus);

// Document upload
router.post('/documents', protect, uploadDocuments);

// Profile routes
router.get('/profile', protect, getVendorProfile);
router.put('/profile', protect, updateVendorProfile);

module.exports = router;