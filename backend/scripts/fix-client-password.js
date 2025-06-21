const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('../models/User');

async function fixClientPassword() {
  try {
    // Find the client user
    const client = await User.findOne({ email: 'client@innovate.com' });
    
    if (!client) {
      console.log('Client user not found');
      return;
    }

    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // Update the password
    client.password = hashedPassword;
    await client.save();

    console.log('Client password updated successfully');
    console.log('New password hash:', hashedPassword);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixClientPassword(); 