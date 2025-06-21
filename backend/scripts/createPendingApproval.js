const mongoose = require('mongoose');
const PendingApproval = require('../models/PendingApproval');

// Replace with your actual MongoDB connection string and vendor ID
const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';
const VENDOR_ID = '684fd3a84067c0c7546c671e';

mongoose.connect(MONGODB_URI)
  .then(() => {
    return PendingApproval.create({
      entityType: 'vendor',
      entityId: VENDOR_ID,
      status: 'pending',
      submittedBy: VENDOR_ID,
      submittedAt: new Date()
    });
  })
  .then(() => {
    console.log('Pending approval record created!');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  }); 