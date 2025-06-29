const express = require('express');
const router = express.Router();
const {
  saveStep,
  getRegistrationStatus,
  uploadDocuments,
  getVendorProfile,
  updateVendorProfile
} = require('../controllers/vendorController');
const { getAllUsers } = require('../controllers/adminUserController');
const {
  getPOs,
  getPO,
  vendorResponse
} = require('../controllers/poController');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  approveInvoice,
  markAsPaid,
  deleteInvoice
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const { validateVendorStep3 } = require('../validation/vendorValidation');

// Test route (no auth required)
router.get('/test', (req, res) => {
  console.log('🔧 Vendor Route: Test route hit');
  res.json({ success: true, message: 'Vendor route is working' });
});

// Get all vendors (for dropdowns)
router.get('/', protect, async (req, res, next) => {
  console.log('🔧 Vendor Route: GET /vendors request received');
  console.log('🔧 Vendor Route: User:', req.user);
  console.log('🔧 Vendor Route: Query params:', req.query);
  
  try {
    // Use the getAllUsers function but filter for vendors only
    req.query.userType = 'vendor';
    req.query.isActive = 'true';
    req.query.isEmailVerified = 'true';
    req.query.registrationComplete = 'true';
    req.query.limit = '1000'; // Get all vendors
    
    console.log('🔧 Vendor Route: Modified query params:', req.query);
    
    await getAllUsers(req, res, next);
  } catch (error) {
    console.error('🔧 Vendor Route: Error in GET /vendors:', error);
    next(error);
  }
});

// Registration routes
router.post('/create', saveStep);
router.get('/registration/status', protect, getRegistrationStatus);

// Document upload
router.post('/documents', protect, uploadDocuments);

// Profile routes
router.get('/profile', protect, getVendorProfile);
router.put('/profile', protect, updateVendorProfile);

// PO routes (vendor can view and respond to POs)
router.get('/po', protect, authorize('vendor'), getPOs);
router.get('/po/:id', protect, authorize('vendor'), getPO);
router.post('/po/:id/vendor-response', protect, authorize('vendor'), vendorResponse);

// Invoice routes (vendor can create and manage invoices)
router.route('/invoice')
  .post(authorize('vendor'), createInvoice)
  .get(authorize('vendor'), getInvoices);

router.route('/invoice/:id')
  .get(authorize('vendor'), getInvoice)
  .put(authorize('vendor'), updateInvoice)
  .delete(authorize('vendor'), deleteInvoice);

router.post('/invoice/:id/approval', authorize('vendor'), approveInvoice);
router.post('/invoice/:id/mark-paid', authorize('vendor'), markAsPaid);

module.exports = router;