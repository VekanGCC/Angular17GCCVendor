const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gcc-vendor-platform');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test organizations
const createTestOrganizations = async () => {
  try {
    // Create test client organization
    const clientOrg = await Organization.findOneAndUpdate(
      { name: 'Test Client Corp' },
      {
        name: 'Test Client Corp',
        type: 'client',
        industry: 'Technology',
        size: 'medium',
        description: 'Test client organization for workflow testing',
        address: {
          street: '123 Client Street',
          city: 'Client City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contactInfo: {
          email: 'contact@testclient.com',
          phone: '+1-555-0123',
          website: 'https://testclient.com'
        },
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Create test vendor organization
    const vendorOrg = await Organization.findOneAndUpdate(
      { name: 'Test Vendor Solutions' },
      {
        name: 'Test Vendor Solutions',
        type: 'vendor',
        industry: 'IT Services',
        size: 'large',
        description: 'Test vendor organization for workflow testing',
        address: {
          street: '456 Vendor Avenue',
          city: 'Vendor City',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contactInfo: {
          email: 'contact@testvendor.com',
          phone: '+1-555-0456',
          website: 'https://testvendor.com'
        },
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test organizations created/updated');
    return { clientOrg, vendorOrg };
  } catch (error) {
    console.error('❌ Error creating organizations:', error);
    throw error;
  }
};

// Create test users
const createTestUsers = async (organizations) => {
  try {
    const { clientOrg, vendorOrg } = organizations;
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    // Create client_account user
    const clientAccountUser = await User.findOneAndUpdate(
      { email: 'client.account@testclient.com' },
      {
        email: 'client.account@testclient.com',
        password: hashedPassword,
        userType: 'client',
        companyName: 'Test Client Corp',
        contactPerson: 'Client Account Manager',
        gstNumber: 'GST123456789',
        serviceType: 'Technology Services',
        numberOfResources: 5,
        numberOfRequirements: 3,
        firstName: 'Client',
        lastName: 'Account',
        phone: '+1-555-0001',
        organizationId: clientOrg._id,
        organizationRole: 'client_account',
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        isRegistrationComplete: true,
        registrationStep: 5
      },
      { upsert: true, new: true }
    );

    // Create client_owner user
    const clientOwnerUser = await User.findOneAndUpdate(
      { email: 'client.owner@testclient.com' },
      {
        email: 'client.owner@testclient.com',
        password: hashedPassword,
        userType: 'client',
        companyName: 'Test Client Corp',
        contactPerson: 'Client Owner',
        gstNumber: 'GST123456789',
        serviceType: 'Technology Services',
        numberOfResources: 5,
        numberOfRequirements: 3,
        firstName: 'Client',
        lastName: 'Owner',
        phone: '+1-555-0002',
        organizationId: clientOrg._id,
        organizationRole: 'client_owner',
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        isRegistrationComplete: true,
        registrationStep: 5
      },
      { upsert: true, new: true }
    );

    // Create vendor_account user
    const vendorAccountUser = await User.findOneAndUpdate(
      { email: 'vendor.account@testvendor.com' },
      {
        email: 'vendor.account@testvendor.com',
        password: hashedPassword,
        userType: 'vendor',
        companyName: 'Test Vendor Solutions',
        contactPerson: 'Vendor Account Manager',
        gstNumber: 'GST987654321',
        serviceType: 'IT Services',
        numberOfResources: 10,
        numberOfRequirements: 2,
        firstName: 'Vendor',
        lastName: 'Account',
        phone: '+1-555-0003',
        organizationId: vendorOrg._id,
        organizationRole: 'vendor_account',
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        isRegistrationComplete: true,
        registrationStep: 5
      },
      { upsert: true, new: true }
    );

    // Create vendor_owner user
    const vendorOwnerUser = await User.findOneAndUpdate(
      { email: 'vendor.owner@testvendor.com' },
      {
        email: 'vendor.owner@testvendor.com',
        password: hashedPassword,
        userType: 'vendor',
        companyName: 'Test Vendor Solutions',
        contactPerson: 'Vendor Owner',
        gstNumber: 'GST987654321',
        serviceType: 'IT Services',
        numberOfResources: 10,
        numberOfRequirements: 2,
        firstName: 'Vendor',
        lastName: 'Owner',
        phone: '+1-555-0004',
        organizationId: vendorOrg._id,
        organizationRole: 'vendor_owner',
        isEmailVerified: true,
        isActive: true,
        approvalStatus: 'approved',
        isRegistrationComplete: true,
        registrationStep: 5
      },
      { upsert: true, new: true }
    );

    console.log('✅ Test users created/updated');
    return {
      clientAccountUser,
      clientOwnerUser,
      vendorAccountUser,
      vendorOwnerUser
    };
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting test user creation...');
    
    await connectDB();
    const organizations = await createTestOrganizations();
    const users = await createTestUsers(organizations);
    
    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================================');
    console.log('🔵 CLIENT ACCOUNT (for SOW/PO creation):');
    console.log('   Email: client.account@testclient.com');
    console.log('   Password: Test123!');
    console.log('   Role: client_account');
    console.log('');
    console.log('🔵 CLIENT OWNER (for admin functions):');
    console.log('   Email: client.owner@testclient.com');
    console.log('   Password: Test123!');
    console.log('   Role: client_owner');
    console.log('');
    console.log('🟢 VENDOR ACCOUNT (for SOW/PO approvals):');
    console.log('   Email: vendor.account@testvendor.com');
    console.log('   Password: Test123!');
    console.log('   Role: vendor_account');
    console.log('');
    console.log('🟢 VENDOR OWNER (for admin functions):');
    console.log('   Email: vendor.owner@testvendor.com');
    console.log('   Password: Test123!');
    console.log('   Role: vendor_owner');
    console.log('');
    console.log('📝 Workflow Testing Steps:');
    console.log('1. Login as client_account to create SOWs');
    console.log('2. Login as client_owner to approve and send SOWs to vendor');
    console.log('3. Login as vendor_account to approve SOWs');
    console.log('4. Login as client_account to create POs (linked to approved SOWs)');
    console.log('5. Login as client_owner to approve and send POs to vendor');
    console.log('6. Login as vendor_account to approve POs');
    console.log('7. Login as vendor_account to create invoices (linked to approved POs)');
    console.log('=====================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUsers, createTestOrganizations }; 