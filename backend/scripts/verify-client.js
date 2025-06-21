const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('../models/User');

async function verifyClient() {
  try {
    // Find the client user
    const client = await User.findOne({ email: 'client@innovate.com' }).select('+password');
    
    if (!client) {
      console.log('Client user not found');
      return;
    }

    console.log('Client user found:', {
      email: client.email,
      userType: client.userType,
      password: client.password
    });

    // Test password directly with bcrypt
    const testPassword = 'demo123';
    console.log('Testing password:', testPassword);
    
    const isMatch = await bcrypt.compare(testPassword, client.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password does not match. Creating new password...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      
      // Update the password
      client.password = newHash;
      await client.save();
      
      console.log('New password hash created and saved:', newHash);
      
      // Verify the new password
      const verifyNew = await bcrypt.compare(testPassword, newHash);
      console.log('Verification of new password:', verifyNew);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

verifyClient(); 