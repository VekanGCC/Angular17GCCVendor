const Application = require('../models/Application');
const Requirement = require('../models/Requirement');
const Resource = require('../models/Resource');
const ApplicationHistory = require('../models/ApplicationHistory');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');
const { createNotification } = require('./notificationController');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private
const getApplications = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    status,
    requirementId,
    resourceId,
    vendorId,
    clientId
  } = req.query;

  // Build query
  let query = {};

  if (status) {
    query.status = status;
  }

  if (requirementId) {
    query.requirement = requirementId;
  }

  if (resourceId) {
    query.resource = resourceId;
  }

  // For vendor-specific applications
  if (vendorId) {
    // Find requirements created by this vendor
    const vendorRequirements = await Requirement.find({ createdBy: vendorId }).select('_id');
    const requirementIds = vendorRequirements.map(req => req._id);
    
    // Find resources owned by this vendor
    const vendorResources = await Resource.find({ createdBy: vendorId }).select('_id');
    const resourceIds = vendorResources.map(res => res._id);
    
    // Applications where vendor is either requirement owner or resource owner
    query.$or = [
      { requirement: { $in: requirementIds } },
      { resource: { $in: resourceIds } }
    ];
  }

  // For client-specific applications
  if (clientId) {
    // Find requirements created by this client
    const clientRequirements = await Requirement.find({ createdBy: clientId }).select('_id');
    const requirementIds = clientRequirements.map(req => req._id);
    
    // Applications where client is the requirement owner
    query.requirement = { $in: requirementIds };
  }

  // Execute query with pagination
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    )
  );
});

// @desc    Get vendor applications
// @route   GET /api/applications/vendor
// @access  Private (Vendor only)
const getVendorApplications = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    status
  } = req.query;

  // Get vendor ID from JWT token
  const vendorId = req.user.id;

  // Debug logging
  console.log('=== Vendor Applications Debug ===');
  console.log('Vendor ID:', vendorId);
  console.log('Vendor User Type:', req.user.userType);

  // Find resources owned by this vendor
  const vendorResources = await Resource.find({ createdBy: vendorId }).select('_id name');
  const resourceIds = vendorResources.map(res => res._id);
  
  console.log('Vendor Resources Count:', vendorResources.length);
  console.log('Vendor Resource IDs:', resourceIds);
  vendorResources.forEach((res, index) => {
    console.log(`Resource ${index + 1}:`, { id: res._id, name: res.name });
  });
  
  // Build query - only show applications for resources owned by this vendor
  let query = {
    resource: { $in: resourceIds }
  };

  if (status) {
    query.status = status;
  }

  console.log('Query:', JSON.stringify(query, null, 2));

  // Execute query with pagination
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority createdBy')
    .populate('resource', 'name status category createdBy')
    .populate('createdBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  console.log('Applications Found:', applications.length);
  applications.forEach((app, index) => {
    console.log(`Application ${index + 1}:`, {
      id: app._id,
      resourceId: app.resource._id,
      resourceName: app.resource.name,
      resourceOwner: app.resource.createdBy,
      requirementId: app.requirement._id,
      requirementTitle: app.requirement.title,
      requirementOwner: app.requirement.createdBy,
      applicationCreator: app.createdBy._id
    });
  });
  console.log('================================');

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Vendor applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    )
  );
});

// @desc    Get client applications
// @route   GET /api/applications/client
// @access  Private (Client only)
const getClientApplications = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    status
  } = req.query;

  // Get client ID from JWT token
  const clientId = req.user.id;

  // Find requirements created by this client
  const clientRequirements = await Requirement.find({ createdBy: clientId }).select('_id');
  const requirementIds = clientRequirements.map(req => req._id);
  
  // Build query
  let query = {
    requirement: { $in: requirementIds }
  };

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Client applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    )
  );
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
const getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('requirement', 'title description status priority category')
    .populate('resource', 'name description status category')
    .populate('createdBy', 'firstName lastName email');

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  res.status(200).json(
    ApiResponse.success(application, 'Application retrieved successfully')
  );
});

// @desc    Get application history
// @route   GET /api/applications/:id/history
// @access  Private
const getApplicationHistory = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  const history = await ApplicationHistory.find({ application: req.params.id })
    .populate('updatedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json(
    ApiResponse.success(history, 'Application history retrieved successfully')
  );
});

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
const createApplication = asyncHandler(async (req, res, next) => {
  const { requirement: requirementId, resource: resourceId, notes, proposedRate, availability } = req.body;

  // Validate requirement exists
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    return next(new ErrorResponse('Requirement not found', 404));
  }

  // Validate resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return next(new ErrorResponse('Resource not found', 404));
  }

  // Check if application already exists
  const existingApplication = await Application.findOne({
    requirement: requirementId,
    resource: resourceId
  });

  if (existingApplication) {
    return next(new ErrorResponse('Application already exists for this resource and requirement', 400));
  }

  // Create application with user ID from token
  const application = await Application.create({
    requirement: requirementId,
    resource: resourceId,
    notes,
    proposedRate,
    availability,
    createdBy: req.user.id,
    status: 'applied'
  });

  // Populate related fields for response
  const populatedApplication = await Application.findById(application._id)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email');

  // Create initial history entry
  await ApplicationHistory.create({
    application: application._id,
    status: 'applied',
    notes: notes || 'Application submitted',
    updatedBy: req.user.id
  });

  // Create notification for requirement owner
  if (requirement.createdBy.toString() !== req.user.id) {
    await createNotification({
      recipient: requirement.createdBy,
      type: 'new_application',
      title: 'New Application Received',
      message: `A new application has been submitted for your requirement: ${requirement.title}`,
      relatedRequirement: requirementId,
      actionUrl: `/requirements/${requirementId}/applications`
    });
  }

  res.status(201).json(
    ApiResponse.success(populatedApplication, 'Application created successfully')
  );
});

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  let application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Check authorization - requirement owner, resource owner, or admin can update status
  const requirement = await Requirement.findById(application.requirement);
  const resource = await Resource.findById(application.resource);
  
  if (!requirement) {
    return next(new ErrorResponse('Associated requirement not found', 404));
  }

  if (!resource) {
    return next(new ErrorResponse('Associated resource not found', 404));
  }

  const isRequirementOwner = requirement.createdBy.toString() === req.user.id;
  const isResourceOwner = resource.createdBy.toString() === req.user.id;
  const isAdmin = req.user.userType === 'admin';

  if (!isRequirementOwner && !isResourceOwner && !isAdmin) {
    return next(
      new ErrorResponse('Not authorized to update this application. Only the requirement owner, resource owner, or admin can update application status.', 403)
    );
  }

  // Save previous status for history
  const previousStatus = application.status;

  // Update application
  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }
  updateData.updatedAt = Date.now();

  application = await Application.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email');

  // Create history entry
  await ApplicationHistory.create({
    application: application._id,
    previousStatus,
    status,
    notes: notes || `Status changed from ${previousStatus} to ${status}`,
    updatedBy: req.user.id
  });

  // Create notification for application creator
  await createNotification({
    recipient: application.createdBy,
    type: 'application_status_change',
    title: 'Application Status Updated',
    message: `Your application for ${requirement.title} has been ${status}`,
    relatedRequirement: requirement._id,
    actionUrl: `/applications/${application._id}`
  });

  res.status(200).json(
    ApiResponse.success(application, 'Application status updated successfully')
  );
});

// @desc    Update application details
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = asyncHandler(async (req, res, next) => {
  const { notes, proposedRate, availability } = req.body;

  let application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Check authorization - only application creator can update details
  if (application.createdBy.toString() !== req.user.id && req.user.userType !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to update this application', 403)
    );
  }

  // Update application
  const updateData = {};
  if (notes !== undefined) updateData.notes = notes;
  if (proposedRate) updateData.proposedRate = proposedRate;
  if (availability) updateData.availability = availability;
  updateData.updatedAt = Date.now();

  application = await Application.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  )
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email');

  // Create history entry
  await ApplicationHistory.create({
    application: application._id,
    status: application.status,
    notes: 'Application details updated',
    updatedBy: req.user.id
  });

  res.status(200).json(
    ApiResponse.success(application, 'Application updated successfully')
  );
});

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Check authorization - only application creator can delete
  if (application.createdBy.toString() !== req.user.id && req.user.userType !== 'admin') {
    return next(
      new ErrorResponse('Not authorized to delete this application', 403)
    );
  }

  // Create final history entry before deletion
  await ApplicationHistory.create({
    application: application._id,
    previousStatus: application.status,
    status: 'deleted',
    notes: 'Application was deleted',
    updatedBy: req.user.id
  });

  await application.deleteOne();

  res.status(200).json(
    ApiResponse.success(null, 'Application deleted successfully')
  );
});

module.exports = {
  getApplications,
  getVendorApplications,
  getClientApplications,
  getApplication,
  getApplicationHistory,
  createApplication,
  updateApplicationStatus,
  updateApplication,
  deleteApplication
};