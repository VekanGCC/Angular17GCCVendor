const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('../models/User');

async function checkPassword() {
  try {
    // Find the client user
    const user = await User.findOne({ email: 'client@innovate.com' }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      password: user.password,
      userType: user.userType
    });

    // Test password match
    const isMatch = await bcrypt.compare('demo123', user.password);
    console.log('Password match:', isMatch);

    // If password doesn't match, let's create a new hash
    if (!isMatch) {
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash('demo123', salt);
      console.log('New hash for demo123:', newHash);
      
      // Update the user's password
      user.password = newHash;
      await user.save();
      console.log('Password updated successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkPassword(); 