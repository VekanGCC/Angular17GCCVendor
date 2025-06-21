const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

async function resetUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all existing users
    await User.deleteMany({});
    console.log('Deleted all existing users');

    // Create admin user
    const adminUser = new User({
      email: 'admin@talentbridge.com',
      password: 'demo123',
      userType: 'vendor',  // Using vendor type for admin
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'United States'
      },
      businessInfo: {
        companyName: 'TalentBridge Admin',
        businessType: 'Corporation',
        businessLicense: 'ADM123456',
        taxId: 'TAX123456789',
        website: 'https://talentbridge.com'
      },
      documents: {
        profileImage: 'default-profile.jpg',
        identificationDocument: 'id-doc.pdf',
        businessCertificate: 'business-cert.pdf',
        insuranceCertificate: 'insurance-cert.pdf'
      },
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isApproved: true,
      registrationStep: 5,
      isRegistrationComplete: true,
      permissions: {
        manageUsers: true,
        manageServices: true,
        manageTransactions: true,
        manageContent: true,
        viewAnalytics: true,
        approveEntities: true
      }
    });

    // Create vendor user
    const vendorUser = new User({
      email: 'vendor@techcorp.com',
      password: 'demo123',
      userType: 'vendor',
      role: 'vendor',
      firstName: 'Tech',
      lastName: 'Vendor',
      phone: '+1234567890',
      address: {
        street: '123 Tech St',
        city: 'Tech City',
        state: 'Tech State',
        zipCode: '12345',
        country: 'United States'
      },
      businessInfo: {
        companyName: 'TechCorp Solutions',
        businessType: 'Technology',
        businessLicense: 'TEC123456',
        taxId: 'TAX123456789',
        website: 'https://techcorp.com'
      },
      documents: {
        profileImage: 'default-profile.jpg',
        identificationDocument: 'id-doc.pdf',
        businessCertificate: 'business-cert.pdf',
        insuranceCertificate: 'insurance-cert.pdf'
      },
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isApproved: true,
      registrationStep: 5,
      isRegistrationComplete: true
    });

    // Create client user
    const clientUser = new User({
      email: 'client@enterprise.com',
      password: 'demo123',
      userType: 'client',
      role: 'client',
      firstName: 'Enterprise',
      lastName: 'Client',
      phone: '+1234567890',
      address: {
        street: '123 Business Ave',
        city: 'Enterprise City',
        state: 'Business State',
        zipCode: '12345',
        country: 'United States'
      },
      businessInfo: {
        companyName: 'Enterprise Solutions Inc.',
        businessType: 'Corporation',
        businessLicense: 'ENT123456',
        taxId: 'TAX123456789',
        website: 'https://enterprise-solutions.com'
      },
      documents: {
        profileImage: 'default-profile.jpg',
        identificationDocument: 'id-doc.pdf',
        businessCertificate: 'business-cert.pdf',
        insuranceCertificate: 'insurance-cert.pdf'
      },
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      isApproved: true,
      registrationStep: 5,
      isRegistrationComplete: true
    });

    // Save all users
    await Promise.all([
      adminUser.save(),
      vendorUser.save(),
      clientUser.save()
    ]);

    console.log('Users created successfully');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@talentbridge.com / demo123');
    console.log('Vendor: vendor@techcorp.com / demo123');
    console.log('Client: client@enterprise.com / demo123');

  } catch (error) {
    console.error('Error resetting users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

resetUsers(); 