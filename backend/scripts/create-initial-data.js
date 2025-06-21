const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserAddress = require('../models/UserAddress');
const UserBankDetails = require('../models/UserBankDetails');
const UserStatutoryCompliance = require('../models/UserStatutoryCompliance');

// MongoDB connection string
const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan212';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to create initial data
async function createInitialData() {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      UserAddress.deleteMany({}),
      UserBankDetails.deleteMany({}),
      UserStatutoryCompliance.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users with plain password - the User model will hash it
    const users = await User.create([
      {
        email: 'admin@venkan.com',
        password: 'demo123',
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin',
        role: 'admin',
        phone: '+1234567890',
        isActive: true,
        isEmailVerified: true,
        approvalStatus: 'approved',
        permissions: {
          manageUsers: true,
          manageServices: true,
          manageTransactions: true,
          manageContent: true,
          viewAnalytics: true,
          approveEntities: true
        }
      },
      {
        email: 'client@venkan.com',
        password: 'demo123',
        firstName: 'Client',
        lastName: 'User',
        userType: 'client',
        role: 'client',
        phone: '+1234567891',
        isActive: true,
        isEmailVerified: true,
        approvalStatus: 'approved'
      },
      {
        email: 'vendor@venkan.com',
        password: 'demo123',
        firstName: 'Vendor',
        lastName: 'User',
        userType: 'vendor',
        role: 'vendor',
        phone: '+1234567892',
        isActive: true,
        isEmailVerified: true,
        approvalStatus: 'approved'
      }
    ]);
    console.log('Created users');

    // Create related data for each user
    for (const user of users) {
      // Create address
      await UserAddress.create({
        userId: user._id,
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        pinCode: '10001',
        isDefault: true
      });

      // Create bank details
      await UserBankDetails.create({
        userId: user._id,
        bankAccountNumber: '1234567890',
        accountType: 'Savings',
        ifscCode: 'BANK123456',
        bankName: 'Sample Bank',
        branchName: 'Main Branch',
        bankCity: 'New York',
        isVerified: true
      });

      // Create statutory compliance
      await UserStatutoryCompliance.create({
        userId: user._id,
        gstNumber: 'GST123456789',
        panNumber: 'ABCDE1234F',
        taxRegistrationNumber: 'TAX123456',
        complianceStatus: 'verified',
        documents: [
          {
            type: 'GST Certificate',
            url: 'https://example.com/gst-cert.pdf',
            verified: true
          },
          {
            type: 'PAN Card',
            url: 'https://example.com/pan-card.pdf',
            verified: true
          }
        ]
      });
    }
    console.log('Created related data for all users');

    console.log('\nInitial Data Created Successfully!\n');
    console.log('Login Credentials:');
    console.log('----------------');
    console.log('Admin:');
    console.log('Email:', 'admin@venkan.com');
    console.log('Password: demo123\n');
    console.log('Client:');
    console.log('Email:', 'client@venkan.com');
    console.log('Password: demo123\n');
    console.log('Vendor:');
    console.log('Email:', 'vendor@venkan.com');
    console.log('Password: demo123');

  } catch (error) {
    console.error('Error creating initial data:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the script
createInitialData(); 