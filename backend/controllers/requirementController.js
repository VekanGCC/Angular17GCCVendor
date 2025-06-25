const Requirement = require('../models/Requirement');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');
const Resource = require('../models/Resource');

// @desc    Get all requirements
// @route   GET /api/requirements
// @access  Private
const getRequirements = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search,
    status,
    priority,
    category,
    skills,
    skillLogic,
    minBudget,
    maxBudget,
    minDuration,
    maxDuration
  } = req.query;

  console.log('🔧 RequirementController: Query parameters received:', req.query);

  // Build query
  let query = {};

  // If user is a client, only show their organization's requirements
  if (req.user.userType === 'client') {
    if (req.user.organizationId) {
      query.organizationId = req.user.organizationId;
    } else {
      // If client doesn't have organizationId, only show their own requirements
      query.createdBy = req.user.id;
    }
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (category) {
    query.category = category;
  }

  if (skills) {
    // Handle skills as array or single skill
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    // Filter out any empty values and ensure we have valid ObjectIds
    const validSkillIds = skillsArray.filter(skillId => skillId && skillId.trim() !== '');
    if (validSkillIds.length > 0) {
      const logic = skillLogic || 'OR';
      
      if (logic === 'AND') {
        // For AND logic, use $all to ensure ALL skills are present
        query.skills = { $all: validSkillIds };
      } else {
        // For OR logic (default), use $in to match ANY of the skills
        query.skills = { $in: validSkillIds };
      }
    }
  }

  // Search by budget range
  if (minBudget || maxBudget) {
    query['budget.charge'] = {};
    if (minBudget) {
      query['budget.charge'].$gte = parseInt(minBudget);
    }
    if (maxBudget) {
      query['budget.charge'].$lte = parseInt(maxBudget);
    }
  }

  // Search by duration range
  if (minDuration || maxDuration) {
    query.duration = {};
    if (minDuration) {
      query.duration.$gte = parseInt(minDuration);
    }
    if (maxDuration) {
      query.duration.$lte = parseInt(maxDuration);
    }
  }

  console.log('🔧 RequirementController: Final query:', JSON.stringify(query, null, 2));

  // Execute query with pagination
  const requirements = await Requirement.find(query)
    .populate('category')
    .populate('skills')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  console.log('🔧 Backend: Retrieved requirements:', JSON.stringify(requirements, null, 2));
  console.log('🔧 Backend: First requirement skills:', requirements[0]?.skills);
  console.log('🔧 Backend: First requirement category:', requirements[0]?.category);

  // Debug: Check if referenced documents exist
  if (requirements.length > 0) {
    const firstReq = requirements[0];
    console.log('🔧 Backend: Checking if category exists:', firstReq.category);
    console.log('🔧 Backend: Checking if skills exist:', firstReq.skills);
    
    // Check if category exists
    const Category = require('../models/Category');
    const categoryExists = await Category.findById(firstReq.category);
    console.log('🔧 Backend: Category exists:', categoryExists ? 'YES' : 'NO');
    if (categoryExists) {
      console.log('🔧 Backend: Category data:', categoryExists);
    }
    
    // Check if skills exist
    const AdminSkill = require('../models/AdminSkill');
    for (let i = 0; i < firstReq.skills.length; i++) {
      const skillExists = await AdminSkill.findById(firstReq.skills[i]);
      console.log(`🔧 Backend: Skill ${i} (${firstReq.skills[i]}) exists:`, skillExists ? 'YES' : 'NO');
      if (skillExists) {
        console.log(`🔧 Backend: Skill ${i} data:`, skillExists);
      }
    }
    
    // Try manual population
    console.log('🔧 Backend: Trying manual population...');
    const manualPopulated = await Requirement.findById(firstReq._id)
      .populate('category')
      .populate('skills');
    console.log('🔧 Backend: Manual populated result:', JSON.stringify(manualPopulated, null, 2));
  }

  const total = await Requirement.countDocuments(query);

  console.log('🔧 RequirementController: Found', requirements.length, 'requirements out of', total, 'total');

  res.status(200).json(
    ApiResponse.success(
      requirements,
      'Requirements retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    )
  );
});

// @desc    Get single requirement
// @route   GET /api/requirements/:id
// @access  Private
const getRequirement = asyncHandler(async (req, res, next) => {
  const requirement = await Requirement.findById(req.params.id)
    .populate('category')
    .populate('skills');

  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  res.status(200).json(
    ApiResponse.success(requirement, 'Requirement retrieved successfully')
  );
});

// @desc    Create new requirement
// @route   POST /api/requirements
// @access  Private
const createRequirement = asyncHandler(async (req, res, next) => {
  // Add user to req.body from JWT token
  req.body.createdBy = req.user.id;

  // Add organizationId from user's organization
  if (req.user.organizationId) {
    req.body.organizationId = req.user.organizationId;
  } else {
    return next(new ErrorResponse('User must belong to an organization to create requirements', 400));
  }

  console.log('🔧 Backend: Creating requirement with body:', JSON.stringify(req.body, null, 2));
  console.log('🔧 Backend: Budget field:', req.body.budget);
  console.log('🔧 Backend: Budget charge value:', req.body.budget?.charge);

  const requirement = await Requirement.create(req.body);

  console.log('🔧 Backend: Created requirement:', JSON.stringify(requirement, null, 2));
  console.log('🔧 Backend: Saved budget field:', requirement.budget);

  res.status(201).json(
    ApiResponse.success(requirement, 'Requirement created successfully')
  );
});

// @desc    Update requirement
// @route   PUT /api/requirements/:id
// @access  Private
const updateRequirement = asyncHandler(async (req, res, next) => {
  let requirement = await Requirement.findById(req.params.id);

  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  // Make sure user is requirement owner or admin
  if (requirement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this requirement', 403)
    );
  }

  requirement = await Requirement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  .populate('category')
  .populate('skills');

  res.status(200).json(
    ApiResponse.success(requirement, 'Requirement updated successfully')
  );
});

// @desc    Update requirement status
// @route   PUT /api/requirements/:id/status
// @access  Private
const updateRequirementStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  let requirement = await Requirement.findById(req.params.id);

  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  // Make sure user is requirement owner or admin
  if (requirement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this requirement', 403)
    );
  }

  requirement = await Requirement.findByIdAndUpdate(
    req.params.id, 
    { status }, 
    {
      new: true,
      runValidators: true
    }
  )
  .populate('category')
  .populate('skills');

  res.status(200).json(
    ApiResponse.success(requirement, 'Requirement status updated successfully')
  );
});

// @desc    Delete requirement
// @route   DELETE /api/requirements/:id
// @access  Private
const deleteRequirement = asyncHandler(async (req, res, next) => {
  const requirement = await Requirement.findById(req.params.id);

  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  // Make sure user is requirement owner or admin
  if (requirement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this requirement', 403)
    );
  }

  await requirement.deleteOne();

  res.status(200).json(
    ApiResponse.success(null, 'Requirement deleted successfully')
  );
});

// @desc    Get matching resources count for a requirement
// @route   GET /api/requirements/:id/matching-resources
// @access  Private
const getMatchingResourcesCount = asyncHandler(async (req, res, next) => {
  const requirement = await Requirement.findById(req.params.id)
    .populate('skills', 'name')
    .populate('category', 'name');

  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  // Build matching criteria
  const matchingCriteria = {};

  // 1. Skills matching
  const requirementSkills = requirement.skills.map(skill => skill._id);
  const minSkillsToMatch = Math.min(requirementSkills.length, 3); // Max 3 skills to match
  
  if (requirementSkills.length > 0) {
    matchingCriteria.skills = { $in: requirementSkills };
  }

  // 2. Budget matching (resource cost should be less than requirement budget)
  if (requirement.budget && requirement.budget.charge) {
    matchingCriteria['rate.hourly'] = { $lte: requirement.budget.charge };
  }

  // 3. Availability matching (resource should be available before requirement start date)
  if (requirement.startDate) {
    matchingCriteria['availability.start_date'] = { $lte: requirement.startDate };
  }

  // 4. Resource should be active
  matchingCriteria.status = 'active';

  // 5. Resource should be available
  matchingCriteria['availability.status'] = { $in: ['available', 'partially_available'] };

  console.log('🔧 RequirementController: Matching criteria:', JSON.stringify(matchingCriteria, null, 2));

  // Get matching resources
  const matchingResources = await Resource.find(matchingCriteria)
    .populate('skills', 'name')
    .populate('category', 'name');

  console.log('🔧 RequirementController: Found matching resources:', matchingResources.length);

  // Filter by exact skills matching
  const filteredResources = matchingResources.filter(resource => {
    const resourceSkillIds = resource.skills.map(skill => skill._id.toString());
    const requirementSkillIds = requirementSkills.map(skill => skill.toString());
    
    // Count how many requirement skills are present in resource
    const matchingSkills = requirementSkillIds.filter(skillId => 
      resourceSkillIds.includes(skillId)
    );
    
    // Check if we have the minimum required skills
    if (matchingSkills.length < minSkillsToMatch) {
      return false;
    }

    // Check experience years matching - resource should have equal or more years than requirement
    const requirementMinYears = requirement.experience?.minYears || 0;
    const resourceYears = resource.experience?.years || 0;
    
    if (resourceYears < requirementMinYears) {
      return false;
    }

    return true;
  });

  console.log('🔧 RequirementController: After skills filtering:', filteredResources.length);

  // Additional filtering for budget and availability
  const finalMatchingResources = filteredResources.filter(resource => {
    // Budget check
    if (requirement.budget && requirement.budget.charge && resource.rate && resource.rate.hourly) {
      if (resource.rate.hourly > requirement.budget.charge) {
        return false;
      }
    }

    // Availability check
    if (requirement.startDate && resource.availability && resource.availability.start_date) {
      if (new Date(resource.availability.start_date) > new Date(requirement.startDate)) {
        return false;
      }
    }

    return true;
  });

  console.log('🔧 RequirementController: Final matching resources:', finalMatchingResources.length);
  console.log('🔧 RequirementController: Experience matching criteria - Required min years:', requirement.experience?.minYears);

  res.status(200).json(
    ApiResponse.success({
      count: finalMatchingResources.length,
      requirement: {
        _id: requirement._id,
        title: requirement.title,
        skills: requirement.skills,
        budget: requirement.budget,
        startDate: requirement.startDate,
        experience: requirement.experience
      },
      matchingCriteria: {
        minSkillsToMatch,
        maxBudget: requirement.budget?.charge,
        requiredStartDate: requirement.startDate,
        minExperienceYears: requirement.experience?.minYears
      }
    }, 'Matching resources count retrieved successfully')
  );
});

module.exports = {
  getRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  deleteRequirement,
  getMatchingResourcesCount
};