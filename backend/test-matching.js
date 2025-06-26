const mongoose = require('mongoose');
const Resource = require('./models/Resource');
const Requirement = require('./models/Requirement');
const AdminSkill = require('./models/AdminSkill');

// MongoDB connection string
const MONGODB_URI = 'mongodb://127.0.0.1:27017/venkan212';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testMatching() {
  try {
    console.log('🔧 Testing matching logic...');
    
    // Check if there are any skills
    const skills = await AdminSkill.find({});
    console.log('🔧 Found skills:', skills.length);
    if (skills.length > 0) {
      console.log('🔧 Sample skills:', skills.slice(0, 3).map(s => s.name));
    }
    
    // Check if there are any resources
    const resources = await Resource.find({}).populate('skills', 'name');
    console.log('🔧 Found resources:', resources.length);
    if (resources.length > 0) {
      console.log('🔧 Sample resource:', {
        name: resources[0].name,
        skills: resources[0].skills.map(s => s.name),
        experience: resources[0].experience,
        rate: resources[0].rate
      });
    }
    
    // Check if there are any requirements
    const requirements = await Requirement.find({}).populate('skills', 'name');
    console.log('🔧 Found requirements:', requirements.length);
    if (requirements.length > 0) {
      console.log('🔧 Sample requirement:', {
        title: requirements[0].title,
        skills: requirements[0].skills.map(s => s.name),
        experience: requirements[0].experience,
        budget: requirements[0].budget,
        status: requirements[0].status
      });
    }
    
    // Test matching logic if we have data
    if (resources.length > 0 && requirements.length > 0) {
      const resource = resources[0];
      console.log('\n🔧 Testing matching for resource:', resource.name);
      
      // Build matching criteria
      const matchingCriteria = {
        status: 'open'
      };
      
      if (resource.skills && resource.skills.length > 0) {
        matchingCriteria.skills = { $exists: true, $ne: [] };
      }
      
      if (resource.experience && resource.experience.years) {
        matchingCriteria['experience.minYears'] = { $lte: resource.experience.years };
      }
      
      if (resource.rate && resource.rate.hourly) {
        matchingCriteria['budget.charge'] = { $gte: resource.rate.hourly };
      }
      
      console.log('🔧 Matching criteria:', matchingCriteria);
      
      const matchingRequirements = await Requirement.find(matchingCriteria)
        .populate('skills', 'name')
        .lean();
      
      console.log('🔧 Initial query returned:', matchingRequirements.length, 'requirements');
      
      // Test skill matching
      const filteredRequirements = matchingRequirements.filter(requirement => {
        const requirementSkillIds = requirement.skills.map(skill => skill._id.toString());
        const resourceSkillIds = resource.skills.map(skill => skill._id.toString());
        
        console.log('🔧 Requirement:', requirement.title);
        console.log('🔧 Resource skills (IDs):', resourceSkillIds);
        console.log('🔧 Requirement skills (IDs):', requirementSkillIds);
        console.log('🔧 Resource skills (names):', resource.skills.map(s => s.name));
        console.log('🔧 Requirement skills (names):', requirement.skills.map(s => s.name));
        
        // Resource must have ALL skills required by the requirement
        const hasAllRequiredSkills = requirementSkillIds.every(skillId =>
          resourceSkillIds.includes(skillId)
        );
        
        console.log('🔧 Has all required skills:', hasAllRequiredSkills);
        
        if (!hasAllRequiredSkills) {
          console.log('🔧 Requirement rejected - missing skills');
          return false;
        }
        
        console.log('🔧 Requirement passed skill check');
        return true;
      });
      
      console.log('🔧 After skill filtering:', filteredRequirements.length, 'requirements');
    }
    
  } catch (error) {
    console.error('Error testing matching:', error);
  } finally {
    mongoose.disconnect();
  }
}

testMatching(); 