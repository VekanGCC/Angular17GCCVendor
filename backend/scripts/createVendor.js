const mongoose = require('mongoose');
const User = require('../models/User');

// Replace with your actual MongoDB connection string
const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

const vendorData = {
  email: 'testvendor2@example.com',
  password: 'Test@123', // In production, hash the password!
  userType: 'vendor',
  firstName: 'Test',
  lastName: 'Vendor',
  phone: '1234567890',
  isApproved: false,
  isActive: true,
  isEmailVerified: true,
  registrationStep: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  documents: {
    insuranceCertificate: 'placeholder-insurance.pdf',
    businessCertificate: 'placeholder-business.pdf'
  },
  businessInfo: {
    taxId: 'TAX123456',
    businessLicense: 'LIC123456',
    businessType: 'LLC',
    companyName: 'Test Vendor Company'
  },
  address: {
    zipCode: '12345',
    state: 'TestState',
    city: 'TestCity',
    street: '123 Test St'
  }
};

mongoose.connect(MONGODB_URI)
  .then(() => User.create(vendorData))
  .then(user => {
    console.log('Vendor created! _id:', user._id.toString());
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  }); 