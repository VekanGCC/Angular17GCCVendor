const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

async function deleteClientUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete the client user
    const result = await User.deleteOne({ email: 'client@enterprise.com' });
    if (result.deletedCount > 0) {
      console.log('Client user deleted successfully');
    } else {
      console.log('Client user not found');
    }

  } catch (error) {
    console.error('Error deleting client user:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
deleteClientUser(); 