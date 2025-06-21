const mongoose = require('mongoose');
const Application = require('../models/Application');
const ApplicationHistory = require('../models/ApplicationHistory');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/staff-augmentation', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSampleHistory() {
  try {
    console.log('Creating sample application history...');

    // Get a sample application
    const application = await Application.findOne();
    if (!application) {
      console.log('No applications found. Please create an application first.');
      return;
    }

    // Get a sample user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Found application: ${application._id}`);
    console.log(`Found user: ${user._id}`);

    // Create sample history entries
    const historyEntries = [
      {
        application: application._id,
        status: 'pending',
        notes: 'Application created',
        updatedBy: user._id
      },
      {
        application: application._id,
        previousStatus: 'pending',
        status: 'shortlisted',
        notes: 'Candidate shortlisted for interview',
        updatedBy: user._id
      },
      {
        application: application._id,
        previousStatus: 'shortlisted',
        status: 'interview',
        notes: 'Interview scheduled',
        updatedBy: user._id
      }
    ];

    // Clear existing history for this application
    await ApplicationHistory.deleteMany({ application: application._id });
    console.log('Cleared existing history for this application');

    // Create new history entries
    for (const entry of historyEntries) {
      await ApplicationHistory.create(entry);
      console.log(`Created history entry: ${entry.status}`);
    }

    // Update application status to match the latest history entry
    await Application.findByIdAndUpdate(application._id, { status: 'interview' });
    console.log('Updated application status to: interview');

    console.log('Sample history created successfully!');
    console.log(`You can now test the history feature for application: ${application._id}`);

  } catch (error) {
    console.error('Error creating sample history:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleHistory(); 