const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('../models/User');

async function checkUsers() {
  try {
    // Find both users
    const vendor = await User.findOne({ email: 'vendor@techcorp.com' }).select('+password');
    const client = await User.findOne({ email: 'client@innovate.com' }).select('+password');
    
    console.log('\nVendor User:');
    console.log({
      email: vendor?.email,
      userType: vendor?.userType,
      role: vendor?.role,
      isActive: vendor?.isActive,
      isApproved: vendor?.isApproved,
      password: vendor?.password
    });

    console.log('\nClient User:');
    console.log({
      email: client?.email,
      userType: client?.userType,
      role: client?.role,
      isActive: client?.isActive,
      isApproved: client?.isApproved,
      password: client?.password
    });

    // Compare the structures
    console.log('\nDifferences in structure:');
    const vendorKeys = Object.keys(vendor?.toObject() || {});
    const clientKeys = Object.keys(client?.toObject() || {});
    
    const missingInClient = vendorKeys.filter(key => !clientKeys.includes(key));
    const missingInVendor = clientKeys.filter(key => !vendorKeys.includes(key));
    
    if (missingInClient.length > 0) {
      console.log('Keys missing in client:', missingInClient);
    }
    if (missingInVendor.length > 0) {
      console.log('Keys missing in vendor:', missingInVendor);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkUsers(); 