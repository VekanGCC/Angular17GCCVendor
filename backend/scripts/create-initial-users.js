const mongoose = require('mongoose');
const User = require('../models/User');
const UserAddress = require('../models/UserAddress');
const UserBankDetails = require('../models/UserBankDetails');
const UserStatutoryCompliance = require('../models/UserStatutoryCompliance');
const bcrypt = require('bcryptjs');

const createInitialUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/venkan212', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const password = 'demo123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin User
    const adminUser = await User.create({
      email: 'admin@venkan.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      userType: 'admin',
      phone: '+919999999999',
      isActive: true,
      isEmailVerified: true,
      approvalStatus: 'approved',
      companyName: 'Venkan Admin',
      contactPerson: 'Admin User',
      mobileNumber: '9999999999',
      gstNumber: 'ADMIN123456',
      serviceType: 'admin',
      currentStep: 5,
      registrationComplete: true
    });

    // Admin Address
    const adminAddress = new UserAddress({
      userId: adminUser._id,
      addressLine1: '123 Admin Street',
      addressLine2: 'Admin Building',
      city: 'Admin City',
      state: 'Admin State',
      country: 'India',
      pinCode: '123456',
      isDefault: true
    });

    // Admin Bank Details
    const adminBankDetails = new UserBankDetails({
      userId: adminUser._id,
      bankAccountNumber: '1234567890',
      accountType: 'Savings',
      ifscCode: 'ADMIN0001234',
      bankName: 'Admin Bank',
      branchName: 'Admin Branch',
      bankCity: 'Admin City',
      isVerified: true
    });

    // Admin Statutory Compliance
    const adminCompliance = new UserStatutoryCompliance({
      userId: adminUser._id,
      gstNumber: 'ADMIN123456',
      panNumber: 'ABCDE1234F',
      taxRegistrationNumber: 'TAX123456',
      businessLicenseNumber: 'LIC123456',
      insurancePolicyNumber: 'INS123456',
      complianceStatus: 'verified'
    });

    // Client User
    const clientUser = new User({
      email: 'client@venkan.com',
      password: hashedPassword,
      firstName: 'Client',
      lastName: 'User',
      role: 'client',
      userType: 'client',
      phone: '+918888888888',
      isActive: true,
      isEmailVerified: true,
      approvalStatus: 'approved',
      companyName: 'Client Company',
      contactPerson: 'Client User',
      mobileNumber: '8888888888',
      gstNumber: 'CLIENT123456',
      serviceType: 'IT Services',
      currentStep: 5,
      registrationComplete: true
    });

    // Client Address
    const clientAddress = new UserAddress({
      userId: clientUser._id,
      addressLine1: '456 Client Street',
      addressLine2: 'Client Building',
      city: 'Client City',
      state: 'Client State',
      country: 'India',
      pinCode: '234567',
      isDefault: true
    });

    // Client Bank Details
    const clientBankDetails = new UserBankDetails({
      userId: clientUser._id,
      bankAccountNumber: '2345678901',
      accountType: 'Current',
      ifscCode: 'CLIENT0001234',
      bankName: 'Client Bank',
      branchName: 'Client Branch',
      bankCity: 'Client City',
      isVerified: true
    });

    // Client Statutory Compliance
    const clientCompliance = new UserStatutoryCompliance({
      userId: clientUser._id,
      gstNumber: 'CLIENT123456',
      panNumber: 'FGHIJ5678K',
      taxRegistrationNumber: 'TAX234567',
      businessLicenseNumber: 'LIC234567',
      insurancePolicyNumber: 'INS234567',
      complianceStatus: 'verified'
    });

    // Vendor User
    const vendorUser = new User({
      email: 'vendor@venkan.com',
      password: hashedPassword,
      firstName: 'Vendor',
      lastName: 'User',
      role: 'vendor',
      userType: 'vendor',
      phone: '+917777777777',
      isActive: true,
      isEmailVerified: true,
      approvalStatus: 'approved',
      companyName: 'Vendor Company',
      contactPerson: 'Vendor User',
      mobileNumber: '7777777777',
      gstNumber: 'VENDOR123456',
      serviceType: 'IT Staffing',
      currentStep: 5,
      registrationComplete: true
    });

    // Vendor Address
    const vendorAddress = new UserAddress({
      userId: vendorUser._id,
      addressLine1: '789 Vendor Street',
      addressLine2: 'Vendor Building',
      city: 'Vendor City',
      state: 'Vendor State',
      country: 'India',
      pinCode: '345678',
      isDefault: true
    });

    // Vendor Bank Details
    const vendorBankDetails = new UserBankDetails({
      userId: vendorUser._id,
      bankAccountNumber: '3456789012',
      accountType: 'Current',
      ifscCode: 'VENDOR0001234',
      bankName: 'Vendor Bank',
      branchName: 'Vendor Branch',
      bankCity: 'Vendor City',
      isVerified: true
    });

    // Vendor Statutory Compliance
    const vendorCompliance = new UserStatutoryCompliance({
      userId: vendorUser._id,
      gstNumber: 'VENDOR123456',
      panNumber: 'LMNOP9012Q',
      taxRegistrationNumber: 'TAX345678',
      businessLicenseNumber: 'LIC345678',
      insurancePolicyNumber: 'INS345678',
      complianceStatus: 'verified'
    });

    // Save all users and their related data
    await Promise.all([
      adminUser.save(),
      adminAddress.save(),
      adminBankDetails.save(),
      adminCompliance.save(),
      clientUser.save(),
      clientAddress.save(),
      clientBankDetails.save(),
      clientCompliance.save(),
      vendorUser.save(),
      vendorAddress.save(),
      vendorBankDetails.save(),
      vendorCompliance.save()
    ]);

    console.log('Initial users and their related data created successfully');
    console.log('Admin User:', adminUser.email);
    console.log('Client User:', clientUser.email);
    console.log('Vendor User:', vendorUser.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating initial users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createInitialUsers(); 