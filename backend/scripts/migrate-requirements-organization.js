const mongoose = require('mongoose');
const User = require('../models/User');
const Requirement = require('../models/Requirement');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gcc_vendor_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateRequirementsOrganization = async () => {
  try {
    console.log('🔧 Starting requirements organization migration...');

    // Get all requirements without organizationId
    const requirementsWithoutOrg = await Requirement.find({ organizationId: { $exists: false } });
    console.log(`🔧 Found ${requirementsWithoutOrg.length} requirements without organizationId`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const requirement of requirementsWithoutOrg) {
      try {
        // Find the user who created this requirement
        const user = await User.findById(requirement.createdBy);
        
        if (user && user.organizationId) {
          // Update requirement with organizationId
          await Requirement.findByIdAndUpdate(requirement._id, {
            organizationId: user.organizationId
          });
          updatedCount++;
          console.log(`🔧 Updated requirement ${requirement._id} with organizationId: ${user.organizationId}`);
        } else {
          skippedCount++;
          console.log(`🔧 Skipped requirement ${requirement._id} - user not found or no organizationId`);
        }
      } catch (error) {
        console.error(`🔧 Error updating requirement ${requirement._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`🔧 Migration completed!`);
    console.log(`🔧 Updated: ${updatedCount} requirements`);
    console.log(`🔧 Skipped: ${skippedCount} requirements`);

    // Verify migration
    const remainingWithoutOrg = await Requirement.find({ organizationId: { $exists: false } });
    console.log(`🔧 Requirements still without organizationId: ${remainingWithoutOrg.length}`);

  } catch (error) {
    console.error('🔧 Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔧 Database connection closed');
  }
};

// Run migration
migrateRequirementsOrganization(); 