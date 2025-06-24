const Resource = require('../models/Resource');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getResources = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search,
    status,
    category,
    skills,
    minExperience,
    maxExperience,
    minRate,
    maxRate,
    approvedVendorsOnly
  } = req.query;

  console.log('🔧 ResourceController: Query parameters received:', req.query);

  // Build query
  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
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
      const skillLogic = req.query.skillLogic || 'OR';
      
      if (skillLogic === 'AND') {
        // For AND logic, use $all to ensure ALL skills are present
        query.skills = { $all: validSkillIds };
      } else {
        // For OR logic (default), use $in to match ANY of the skills
        query.skills = { $in: validSkillIds };
      }
    }
  }

  // Search by experience range
  if (minExperience || maxExperience) {
    query['experience.years'] = {};
    if (minExperience) {
      query['experience.years'].$gte = parseInt(minExperience);
    }
    if (maxExperience) {
      query['experience.years'].$lte = parseInt(maxExperience);
    }
  }

  // Search by rate range
  if (minRate || maxRate) {
    query['rate.hourly'] = {};
    if (minRate) {
      query['rate.hourly'].$gte = parseInt(minRate);
    }
    if (maxRate) {
      query['rate.hourly'].$lte = parseInt(maxRate);
    }
  }

  // Filter by approved vendors only
  if (approvedVendorsOnly === 'true') {
    console.log('🔧 ResourceController: Filtering for approved vendors only');
    
    // Get the VendorSkill and AdminSkill models
    const VendorSkill = require('../models/VendorSkill');
    const AdminSkill = require('../models/AdminSkill');
    
    if (skills && skills.length > 0) {
      // Handle skills as array or single skill
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      const validSkillIds = skillsArray.filter(skillId => skillId && skillId.trim() !== '');
      
      if (validSkillIds.length > 0) {
        const skillLogic = req.query.skillLogic || 'OR';
        console.log('🔧 ResourceController: Filtering by skill IDs:', validSkillIds, 'with logic:', skillLogic);
        
        // First, get the skill names from AdminSkill model using the skill IDs
        const adminSkills = await AdminSkill.find({ _id: { $in: validSkillIds } });
        const skillNames = adminSkills.map(skill => skill.name);
        console.log('🔧 ResourceController: Skill names:', skillNames);
        
        if (skillNames.length > 0) {
          // Get approved vendor skills that match the selected skill names
          let approvedVendorSkillsQuery = {
            status: 'approved',
            skillName: { $in: skillNames }
          };
          
          const approvedVendorSkills = await VendorSkill.find(approvedVendorSkillsQuery);
          console.log('🔧 ResourceController: Found', approvedVendorSkills.length, 'approved vendor skills');
          
          if (approvedVendorSkills.length > 0) {
            // Group by vendor and check logic
            const vendorSkillMap = {};
            approvedVendorSkills.forEach(vs => {
              if (!vendorSkillMap[vs.vendor]) {
                vendorSkillMap[vs.vendor] = [];
              }
              vendorSkillMap[vs.vendor].push(vs.skillName);
            });
            
            let approvedVendors = [];
            
            if (skillLogic === 'AND') {
              // For AND logic, vendor must have ALL selected skills approved
              approvedVendors = Object.keys(vendorSkillMap).filter(vendorId => {
                const vendorSkills = vendorSkillMap[vendorId];
                return skillNames.every(skillName => vendorSkills.includes(skillName));
              });
            } else {
              // For OR logic, vendor must have ANY of the selected skills approved
              approvedVendors = Object.keys(vendorSkillMap);
            }
            
            console.log('🔧 ResourceController: Found', approvedVendors.length, 'approved vendors with matching skills');
            
            if (approvedVendors.length > 0) {
              query.createdBy = { $in: approvedVendors };
            } else {
              // No vendors have the required approved skills
              query.createdBy = { $in: [] };
            }
          } else {
            // No approved vendor skills found for the selected skills
            query.createdBy = { $in: [] };
          }
        } else {
          // No valid skill names found, return empty result
          query.createdBy = { $in: [] };
        }
      } else {
        // No valid skill IDs, return empty result
        query.createdBy = { $in: [] };
      }
    } else {
      // No skills selected, get all vendors with any approved skills
      const approvedVendors = await VendorSkill.distinct('vendor', { status: 'approved' });
      console.log('🔧 ResourceController: Found', approvedVendors.length, 'approved vendors (no skill filter)');
      
      if (approvedVendors.length > 0) {
        query.createdBy = { $in: approvedVendors };
      } else {
        query.createdBy = { $in: [] };
      }
    }
  }

  console.log('🔧 ResourceController: Final query:', JSON.stringify(query, null, 2));

  // Only return resources for the logged-in vendor
  if (req.user && req.user.userType === 'vendor') {
    console.log('🔧 ResourceController: User is vendor, filtering by vendor ID:', req.user.id);
    // If approvedVendorsOnly is true, we need to check if this vendor is approved
    if (approvedVendorsOnly === 'true') {
      console.log('🔧 ResourceController: Approved vendors only filter is active for vendor');
      const VendorSkill = require('../models/VendorSkill');
      const AdminSkill = require('../models/AdminSkill');
      
      if (skills && skills.length > 0) {
        // Handle skills as array or single skill
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        const validSkillIds = skillsArray.filter(skillId => skillId && skillId.trim() !== '');
        
        if (validSkillIds.length > 0) {
          const skillLogic = req.query.skillLogic || 'OR';
          
          // Get the skill names from AdminSkill model
          const adminSkills = await AdminSkill.find({ _id: { $in: validSkillIds } });
          const skillNames = adminSkills.map(skill => skill.name);
          
          if (skillNames.length > 0) {
            // Check if this vendor has approved skills matching the selected skills
            const vendorApprovedSkills = await VendorSkill.find({ 
              vendor: req.user.id, 
              status: 'approved',
              skillName: { $in: skillNames }
            });
            
            if (skillLogic === 'AND') {
              // For AND logic, vendor must have ALL selected skills approved
              const vendorSkillNames = vendorApprovedSkills.map(vs => vs.skillName);
              const hasAllSkills = skillNames.every(skillName => vendorSkillNames.includes(skillName));
              
              if (!hasAllSkills) {
                // Vendor doesn't have all required approved skills
                query.createdBy = { $in: [] };
              } else {
                // Vendor has all required approved skills
                query.createdBy = req.user.id;
              }
            } else {
              // For OR logic, vendor must have ANY of the selected skills approved
              if (vendorApprovedSkills.length === 0) {
                // Vendor has no approved skills matching the selection
                query.createdBy = { $in: [] };
              } else {
                // Vendor has at least one approved skill matching the selection
                query.createdBy = req.user.id;
              }
            }
          } else {
            // No valid skill names found
            query.createdBy = { $in: [] };
          }
        } else {
          // No valid skill IDs
          query.createdBy = { $in: [] };
        }
      } else {
        // No skills selected, check if vendor has any approved skills
        const vendorApprovedSkills = await VendorSkill.find({ 
          vendor: req.user.id, 
          status: 'approved' 
        });
        
        if (vendorApprovedSkills.length === 0) {
          // Vendor has no approved skills
          query.createdBy = { $in: [] };
        } else {
          // Vendor has approved skills
          query.createdBy = req.user.id;
        }
      }
    } else {
      // Normal vendor filtering
      query.createdBy = req.user.id;
    }
  }

  // Execute query with pagination
  const resources = await Resource.find(query)
    .populate('category', 'name description')
    .populate('skills', 'name description')
    .populate('createdBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Resource.countDocuments(query);

  console.log('🔧 ResourceController: Found', resources.length, 'resources out of', total, 'total');

  res.status(200).json(
    ApiResponse.success(
      resources,
      'Resources retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    )
  );
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('category', 'name description')
    .populate('skills', 'name description')
    .populate('createdBy', 'firstName lastName email');

  if (!resource) {
    return next(new ErrorResponse('Resource not found', 404));
  }

  res.status(200).json(
    ApiResponse.success(resource, 'Resource retrieved successfully')
  );
});

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res, next) => {
  // Add user to req.body from JWT token
  req.body.createdBy = req.user.id;

  // Ensure skills is an array and convert string IDs to ObjectIds
  if (req.body.skills) {
    if (!Array.isArray(req.body.skills)) {
      req.body.skills = [req.body.skills];
    }
    // Filter out any empty or invalid skill IDs
    req.body.skills = req.body.skills.filter(skillId => skillId && skillId.trim() !== '');
  }

  // Remove the old skill field if it exists
  if (req.body.skill) {
    delete req.body.skill;
  }

  console.log('🔧 ResourceController: Creating resource with data:', JSON.stringify(req.body, null, 2));
  console.log('🔧 ResourceController: Skills array:', req.body.skills);

  const resource = await Resource.create(req.body);

  console.log('🔧 ResourceController: Created resource:', JSON.stringify(resource, null, 2));

  res.status(201).json(
    ApiResponse.success(resource, 'Resource created successfully')
  );
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = asyncHandler(async (req, res, next) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse('Resource not found', 404));
  }

  // Make sure user is resource owner or admin
  if (resource.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this resource', 403)
    );
  }

  resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(
    ApiResponse.success(resource, 'Resource updated successfully')
  );
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse('Resource not found', 404));
  }

  // Make sure user is resource owner or admin
  if (resource.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this resource', 403)
    );
  }

  await resource.deleteOne();

  res.status(200).json(
    ApiResponse.success(null, 'Resource deleted successfully')
  );
});

module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource
};