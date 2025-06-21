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
    category
  } = req.query;

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

  // Only return resources for the logged-in vendor
  if (req.user && req.user.userType === 'vendor') {
    query.createdBy = req.user.id;
  }

  // Execute query with pagination
  const resources = await Resource.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Resource.countDocuments(query);

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
  const resource = await Resource.findById(req.params.id);

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

  const resource = await Resource.create(req.body);

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