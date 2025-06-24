const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venkan212', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateVendorToOrganization() {
  try {
    console.log('🔧 Starting vendor to organization migration...');

    // Find all existing vendor users
    const vendorUsers = await User.find({ userType: 'vendor' });
    console.log(`Found ${vendorUsers.length} vendor users to migrate`);

    for (const vendorUser of vendorUsers) {
      console.log(`\n📋 Processing vendor: ${vendorUser.email}`);

      // Check if user already has organization
      if (vendorUser.organizationId) {
        console.log(`✅ User ${vendorUser.email} already has organization: ${vendorUser.organizationId}`);
        continue;
      }

      // Extract domain from email
      const emailDomain = vendorUser.email.split('@')[1];
      console.log(`📧 Email domain: ${emailDomain}`);

      // Create organization for this vendor
      const organization = new Organization({
        name: vendorUser.businessInfo?.companyName || `${vendorUser.firstName} ${vendorUser.lastName} Organization`,
        ownerId: vendorUser._id,
        domain: emailDomain,
        status: 'active'
      });

      await organization.save();
      console.log(`✅ Created organization: ${organization._id}`);

      // Update user to be organization owner
      vendorUser.organizationId = organization._id;
      vendorUser.organizationRole = 'vendor_owner';
      
      // Set default values for required fields if they're missing
      if (!vendorUser.serviceType) {
        vendorUser.serviceType = 'IT Services'; // Default service type
      }
      if (!vendorUser.gstNumber) {
        vendorUser.gstNumber = 'N/A'; // Default GST number
      }
      if (!vendorUser.contactPerson) {
        vendorUser.contactPerson = `${vendorUser.firstName} ${vendorUser.lastName}`; // Use name as contact person
      }
      if (!vendorUser.companyName) {
        vendorUser.companyName = vendorUser.businessInfo?.companyName || `${vendorUser.firstName} ${vendorUser.lastName} Company`; // Use business info or default
      }
      
      await vendorUser.save();
      console.log(`✅ Updated user ${vendorUser.email} to be organization owner`);
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // Display summary
    const updatedUsers = await User.find({ 
      userType: 'vendor', 
      organizationId: { $exists: true } 
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total vendor users: ${vendorUsers.length}`);
    console.log(`- Users with organizations: ${updatedUsers.length}`);
    
    // List all organizations
    const organizations = await Organization.find();
    console.log(`- Total organizations created: ${organizations.length}`);
    
    organizations.forEach(org => {
      console.log(`  - ${org.name} (${org.domain}) - Owner: ${org.ownerId}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateVendorToOrganization(); 