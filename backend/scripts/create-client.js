const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan';

async function createClientUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if client already exists
    const existingClient = await User.findOne({ email: 'client@enterprise.com' });
    if (existingClient) {
      console.log('Client user already exists');
      process.exit(0);
    }

    // Create client user
    const clientUser = new User({
      email: 'client@enterprise.com',
      password: await bcrypt.hash('demo123', 10),
      userType: 'client',
      firstName: 'Enterprise',
      lastName: 'Client',
      phone: '+1234567890',
      role: 'client',
      permissions: [
        'view_resources',
        'view_requirements',
        'view_applications',
        'create_requirements',
        'manage_requirements',
        'view_analytics'
      ],
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

    // Save the client user
    await clientUser.save();
    console.log('Client user created successfully');

  } catch (error) {
    console.error('Error creating client user:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
createClientUser(); 