const Requirement = require('../models/Requirement');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');

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
    category
  } = req.query;

  // Build query
  let query = {};

  // If user is a client, only show their requirements
  if (req.user.role === 'client') {
    query.createdBy = req.user.id;
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

  // Execute query with pagination
  const requirements = await Requirement.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Requirement.countDocuments(query);

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
  const requirement = await Requirement.findById(req.params.id);

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
  });

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
  );

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

module.exports = {
  getRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  updateRequirementStatus,
  deleteRequirement
};