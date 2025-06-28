const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_USERS = [
  {
    email: 'client.account@testclient.com',
    password: 'Test123!',
    firstName: 'Client',
    lastName: 'Account',
    userType: 'client',
    companyName: 'Test Client Corp',
    contactPerson: 'Client Account Manager',
    gstNumber: 'GST123456789',
    serviceType: 'Technology Services',
    numberOfResources: 5,
    numberOfRequirements: 3,
    phone: '+1-555-0001',
    organizationRole: 'client_account'
  },
  {
    email: 'client.owner@testclient.com',
    password: 'Test123!',
    firstName: 'Client',
    lastName: 'Owner',
    userType: 'client',
    companyName: 'Test Client Corp',
    contactPerson: 'Client Owner',
    gstNumber: 'GST123456789',
    serviceType: 'Technology Services',
    numberOfResources: 5,
    numberOfRequirements: 3,
    phone: '+1-555-0002',
    organizationRole: 'client_owner'
  },
  {
    email: 'vendor.account@testvendor.com',
    password: 'Test123!',
    firstName: 'Vendor',
    lastName: 'Account',
    userType: 'vendor',
    companyName: 'Test Vendor Solutions',
    contactPerson: 'Vendor Account Manager',
    gstNumber: 'GST987654321',
    serviceType: 'IT Services',
    numberOfResources: 10,
    numberOfRequirements: 2,
    phone: '+1-555-0003',
    organizationRole: 'vendor_account'
  },
  {
    email: 'vendor.owner@testvendor.com',
    password: 'Test123!',
    firstName: 'Vendor',
    lastName: 'Owner',
    userType: 'vendor',
    companyName: 'Test Vendor Solutions',
    contactPerson: 'Vendor Owner',
    gstNumber: 'GST987654321',
    serviceType: 'IT Services',
    numberOfResources: 10,
    numberOfRequirements: 2,
    phone: '+1-555-0004',
    organizationRole: 'vendor_owner'
  }
];

// Helper function to create user
const createUser = async (userData) => {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    
    if (response.data.success) {
      console.log(`✅ Successfully created user: ${userData.email}`);
      return response.data;
    } else {
      console.log(`❌ Failed to create user: ${userData.email} - ${response.data.message}`);
      return null;
    }
  } catch (error) {
    if (error.response?.data?.message) {
      console.log(`❌ Error creating user ${userData.email}: ${error.response.data.message}`);
    } else {
      console.log(`❌ Error creating user ${userData.email}: ${error.message}`);
    }
    return null;
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting test user creation via API...');
  console.log('Make sure your backend server is running on http://localhost:3000');
  console.log('');
  
  const results = [];
  
  for (const userData of TEST_USERS) {
    const result = await createUser(userData);
    results.push({ userData, result });
    console.log(''); // Add spacing between users
  }
  
  console.log('📋 Summary:');
  console.log('=====================================');
  
  const successful = results.filter(r => r.result);
  const failed = results.filter(r => !r.result);
  
  console.log(`✅ Successfully created: ${successful.length} users`);
  console.log(`❌ Failed to create: ${failed.length} users`);
  
  if (successful.length > 0) {
    console.log('');
    console.log('🎉 Test users created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('=====================================');
    
    successful.forEach(({ userData }) => {
      const role = userData.organizationRole;
      const emoji = role.includes('client') ? '🔵' : '🟢';
      console.log(`${emoji} ${role.toUpperCase()}:`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log('');
    });
    
    console.log('📝 Workflow Testing Steps:');
    console.log('1. Login as client_account to create SOWs');
    console.log('2. Login as client_owner to approve and send SOWs to vendor');
    console.log('3. Login as vendor_account to approve SOWs');
    console.log('4. Login as client_account to create POs (linked to approved SOWs)');
    console.log('5. Login as client_owner to approve and send POs to vendor');
    console.log('6. Login as vendor_account to approve POs');
    console.log('7. Login as vendor_account to create invoices (linked to approved POs)');
    console.log('=====================================');
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ Failed users:');
    failed.forEach(({ userData }) => {
      console.log(`   - ${userData.email}`);
    });
  }
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createUser, TEST_USERS }; 