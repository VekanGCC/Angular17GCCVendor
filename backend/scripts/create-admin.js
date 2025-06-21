const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@talentbridge.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@talentbridge.com',
      password: 'demo123',
      userType: 'vendor',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: 'admin',
      permissions: {
        manageUsers: true,
        manageServices: true,
        manageTransactions: true,
        manageContent: true,
        viewAnalytics: true,
        approveEntities: true
      },
      // Required address fields
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'United States'
      },
      // Required business info fields
      businessInfo: {
        companyName: 'TalentBridge Admin',
        businessType: 'Technology',
        businessLicense: 'ADMIN123',
        taxId: 'TAX123456',
        website: 'https://talentbridge.com'
      },
      // Required document fields
      documents: {
        profileImage: 'default.jpg',
        identificationDocument: 'id.jpg',
        businessCertificate: 'cert.jpg',
        insuranceCertificate: 'insurance.jpg'
      },
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isApproved: true,
      registrationStep: 5,
      isRegistrationComplete: true
    });

    // Save the admin user
    await adminUser.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 