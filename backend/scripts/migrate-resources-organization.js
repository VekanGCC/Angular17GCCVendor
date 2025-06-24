const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const User = require('../models/User');
require('dotenv').config();

async function migrateResourcesOrganization() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all resources that don't have organizationId
    const resourcesWithoutOrg = await Resource.find({ organizationId: { $exists: false } });
    console.log(`📊 Found ${resourcesWithoutOrg.length} resources without organizationId`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const resource of resourcesWithoutOrg) {
      try {
        // Find the user who created this resource
        const user = await User.findById(resource.createdBy);
        
        if (!user) {
          console.log(`⚠️  User not found for resource ${resource._id}, skipping...`);
          skippedCount++;
          continue;
        }

        if (user.userType === 'vendor' && user.organizationId) {
          // Update the resource with organizationId
          await Resource.findByIdAndUpdate(resource._id, {
            organizationId: user.organizationId
          });
          console.log(`✅ Updated resource ${resource._id} with organizationId: ${user.organizationId}`);
          updatedCount++;
        } else if (user.userType === 'client') {
          // Client resources don't need organizationId, mark as processed
          await Resource.findByIdAndUpdate(resource._id, {
            organizationId: null
          });
          console.log(`✅ Marked client resource ${resource._id} as processed (no organizationId needed)`);
          updatedCount++;
        } else {
          console.log(`⚠️  User ${user._id} has unknown userType: ${user.userType}, skipping...`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing resource ${resource._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} resources`);
    console.log(`⚠️  Skipped: ${skippedCount} resources`);
    console.log(`📊 Total processed: ${updatedCount + skippedCount} resources`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateResourcesOrganization(); 