const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gcc-vendor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const setupOrganizations = async () => {
  try {
    console.log('🔧 Setting up organizations for existing vendors...');

    // Find all existing vendors without organizations
    const vendors = await User.find({
      userType: 'vendor',
      organizationId: { $exists: false }
    });

    console.log(`Found ${vendors.length} vendors without organizations`);

    for (const vendor of vendors) {
      // Extract domain from vendor email
      const domain = vendor.email.split('@')[1];
      
      // Create organization
      const organization = await Organization.create({
        name: vendor.companyName || `${vendor.firstName} ${vendor.lastName} Organization`,
        ownerId: vendor._id,
        domain: domain,
        status: 'active'
      });

      // Update vendor with organization details
      await User.findByIdAndUpdate(vendor._id, {
        organizationId: organization._id,
        organizationRole: 'vendor_owner'
      });

      console.log(`✅ Created organization for ${vendor.email}: ${organization.name}`);
    }

    console.log('🎉 Organization setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up organizations:', error);
    process.exit(1);
  }
};

setupOrganizations(); 