const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

async function cloneVendorToClient() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the vendor user, including the password and role fields
    const vendor = await User.findOne({ email: 'vendor@techcorp.com' }).select('+password +role');
    if (!vendor) {
      console.log('Vendor user not found');
      return;
    }

    console.log('Found vendor:', {
      email: vendor.email,
      userType: vendor.userType,
      role: vendor.role,
      hasPassword: !!vendor.password
    });

    // Create a new client user with the same password
    const clientUser = new User({
      email: 'client@enterprise.com',
      password: 'demo123', // Set the plain password, it will be hashed by the pre-save hook
      userType: 'client',
      role: 'client',
      firstName: 'Enterprise',
      lastName: 'Client',
      phone: vendor.phone,
      address: vendor.address,
      businessInfo: vendor.businessInfo,
      documents: vendor.documents,
      isApproved: true,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      registrationStep: 5,
      isRegistrationComplete: true,
      permissions: vendor.permissions
    });

    // Remove if already exists
    await User.deleteOne({ email: 'client@enterprise.com' });

    // Save the new client user
    await clientUser.save();
    console.log('Client user created successfully');
  } catch (error) {
    console.error('Error creating client user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

cloneVendorToClient(); 