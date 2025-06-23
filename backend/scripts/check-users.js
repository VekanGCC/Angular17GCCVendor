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
    
    console.log('Vendor Details:');
    console.log({
      id: vendor?._id,
      email: vendor?.email,
      name: `${vendor?.firstName} ${vendor?.lastName}`,
      userType: vendor?.userType,
      approvalStatus: vendor?.approvalStatus,
      isActive: vendor?.isActive,
      isEmailVerified: vendor?.isEmailVerified
    });

    console.log('\nClient Details:');
    console.log({
      id: client?._id,
      email: client?.email,
      name: `${client?.firstName} ${client?.lastName}`,
      userType: client?.userType,
      approvalStatus: client?.approvalStatus,
      isActive: client?.isActive,
      isEmailVerified: client?.isEmailVerified
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