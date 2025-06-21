const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createVendorUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if vendor already exists
    const existingVendor = await User.findOne({ email: 'vendor@techcorp.com' });
    if (existingVendor) {
      console.log('Vendor user already exists');
      process.exit(0);
    }

    // Create vendor user
    const vendorUser = new User({
      email: 'vendor@techcorp.com',
      password: 'demo123',
      userType: 'vendor',
      firstName: 'Vendor',
      lastName: 'TechCorp',
      phone: '+1987654321',
      role: undefined, // Not an admin
      permissions: {},
      address: {
        street: '456 Vendor Lane',
        city: 'Vendor City',
        state: 'Vendor State',
        zipCode: '54321',
        country: 'United States'
      },
      businessInfo: {
        companyName: 'TechCorp Solutions',
        businessType: 'IT Services',
        businessLicense: 'VENDOR456',
        taxId: 'TAX654321',
        website: 'https://techcorp.com'
      },
      documents: {
        profileImage: 'vendor.jpg',
        identificationDocument: 'vendor_id.jpg',
        businessCertificate: 'vendor_cert.jpg',
        insuranceCertificate: 'vendor_insurance.jpg'
      },
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isApproved: true,
      registrationStep: 5,
      isRegistrationComplete: true
    });

    // Save the vendor user
    await vendorUser.save();
    console.log('Vendor user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating vendor user:', error);
    process.exit(1);
  }
};

createVendorUser(); 