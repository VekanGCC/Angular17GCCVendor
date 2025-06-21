const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

async function checkClientUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the client user
    const client = await User.findOne({ email: 'client@enterprise.com' }).select('+password +role');
    
    if (client) {
      console.log('Client user found:');
      console.log({
        email: client.email,
        userType: client.userType,
        role: client.role,
        firstName: client.firstName,
        lastName: client.lastName,
        isActive: client.isActive,
        isApproved: client.isApproved,
        hasPassword: !!client.password,
        registrationStep: client.registrationStep,
        isRegistrationComplete: client.isRegistrationComplete
      });
    } else {
      console.log('Client user not found');
    }

  } catch (error) {
    console.error('Error checking client user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

checkClientUser(); 