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
    maxRate
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
    query.skills = { $in: skillsArray };
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

  console.log('🔧 ResourceController: Final query:', JSON.stringify(query, null, 2));

  // Only return resources for the logged-in vendor
  if (req.user && req.user.userType === 'vendor') {
    query.createdBy = req.user.id;
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