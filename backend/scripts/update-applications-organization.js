const mongoose = require('mongoose');
const Application = require('../models/Application');
const ApplicationHistory = require('../models/ApplicationHistory');
const User = require('../models/User');
const config = require('../config/database');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateApplicationsOrganization = async () => {
  try {
    console.log('🔄 Starting application organization and updatedBy field update...');

    // Find all applications without organizationId or updatedBy
    const applicationsToUpdate = await Application.find({
      $or: [
        { organizationId: { $exists: false } },
        { updatedBy: { $exists: false } }
      ]
    });
    console.log(`📊 Found ${applicationsToUpdate.length} applications that need updating`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const application of applicationsToUpdate) {
      try {
        // Get the user who created the application
        const user = await User.findById(application.createdBy);
        
        if (!user) {
          console.log(`⚠️  User not found for application ${application._id}, skipping...`);
          skippedCount++;
          continue;
        }

        // Prepare update data
        const updateData = {};
        
        // Add organizationId if missing
        if (!application.organizationId) {
          if (!user.organizationId) {
            console.log(`⚠️  User ${user._id} (${user.email}) has no organizationId, skipping application ${application._id}...`);
            skippedCount++;
            continue;
          }
          updateData.organizationId = user.organizationId;
          console.log(`✅ Adding organizationId to application ${application._id}: ${user.organizationId}`);
        }
        
        // Add updatedBy if missing
        if (!application.updatedBy) {
          updateData.updatedBy = application.createdBy; // Set to same as createdBy for existing applications
          console.log(`✅ Adding updatedBy to application ${application._id}: ${application.createdBy}`);
        }

        // Update the application
        if (Object.keys(updateData).length > 0) {
          await Application.findByIdAndUpdate(application._id, updateData);
          updatedCount++;
        }

      } catch (error) {
        console.error(`❌ Error updating application ${application._id}:`, error.message);
        skippedCount++;
      }
    }

    // Find all application history entries without organizationId or updatedBy
    const historyToUpdate = await ApplicationHistory.find({
      $or: [
        { organizationId: { $exists: false } },
        { updatedBy: { $exists: false } }
      ]
    });
    console.log(`📊 Found ${historyToUpdate.length} application history entries that need updating`);

    let historyUpdatedCount = 0;
    let historySkippedCount = 0;

    for (const history of historyToUpdate) {
      try {
        // Get the user who created the history entry
        const user = await User.findById(history.createdBy);
        
        if (!user) {
          console.log(`⚠️  User not found for history ${history._id}, skipping...`);
          historySkippedCount++;
          continue;
        }

        // Prepare update data
        const updateData = {};
        
        // Add organizationId if missing
        if (!history.organizationId) {
          if (!user.organizationId) {
            console.log(`⚠️  User ${user._id} (${user.email}) has no organizationId, skipping history ${history._id}...`);
            historySkippedCount++;
            continue;
          }
          updateData.organizationId = user.organizationId;
          console.log(`✅ Adding organizationId to history ${history._id}: ${user.organizationId}`);
        }
        
        // Add updatedBy if missing
        if (!history.updatedBy) {
          updateData.updatedBy = history.createdBy; // Set to same as createdBy for existing history
          console.log(`✅ Adding updatedBy to history ${history._id}: ${history.createdBy}`);
        }

        // Update the history entry
        if (Object.keys(updateData).length > 0) {
          await ApplicationHistory.findByIdAndUpdate(history._id, updateData);
          historyUpdatedCount++;
        }

      } catch (error) {
        console.error(`❌ Error updating history ${history._id}:`, error.message);
        historySkippedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`Applications updated: ${updatedCount}`);
    console.log(`Applications skipped: ${skippedCount}`);
    console.log(`History entries updated: ${historyUpdatedCount}`);
    console.log(`History entries skipped: ${historySkippedCount}`);

    console.log('\n✅ Application organization and updatedBy field update completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the migration
updateApplicationsOrganization(); 