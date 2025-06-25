const Application = require('../models/Application');
const Requirement = require('../models/Requirement');
const Resource = require('../models/Resource');
const ApplicationHistory = require('../models/ApplicationHistory');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');
const { createNotification } = require('./notificationController');
const User = require('../models/User');

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
    // Get the vendor user to check if they have an organization
    const vendor = await User.findById(vendorId).lean();
    
    if (vendor && vendor.userType === 'vendor') {
      if (vendor.organizationId) {
        // Get resources that belong to the vendor's organization
        const vendorResources = await Resource.find({ 
          organizationId: vendor.organizationId 
        }).select('_id').lean();
        const vendorResourceIds = vendorResources.map(res => res._id);
        query.resource = { $in: vendorResourceIds };
      } else {
        // Fallback to resource-based filtering for vendors without organization
        const vendorResources = await Resource.find({ createdBy: vendorId }).select('_id').lean();
        const vendorResourceIds = vendorResources.map(res => res._id);
        query.resource = { $in: vendorResourceIds };
      }
    }
  }

  // For client-specific applications
  if (clientId) {
    // Find requirements created by this client
    const clientRequirements = await Requirement.find({ createdBy: clientId }).select('_id').lean();
    const requirementIds = clientRequirements.map(req => req._id);
    
    // Applications where client is the requirement owner
    query.requirement = { $in: requirementIds };
  }

  // Execute query with pagination - OPTIMIZED
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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

  // Build query - filter by vendor's resources (CORRECTED LOGIC)
  let query = {};

  if (req.user.userType === 'vendor') {
    // For vendors, we want to show ALL applications for their resources
    // regardless of the application's organizationId, since applications can come from different clients
    if (req.user.organizationId) {
      // Get resources that belong to the vendor's organization
      const vendorResources = await Resource.find({ 
        organizationId: req.user.organizationId 
      }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds };
    } else {
      // Fallback to resource-based filtering for vendors without organization
      const vendorResources = await Resource.find({ createdBy: vendorId }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds };
    }
  }

  if (status) {
    query.status = status;
  }

  // Execute query with pagination - OPTIMIZED
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority createdBy')
    .populate('resource', 'name status category createdBy')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Vendor applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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
    status,
    requirementId
  } = req.query;

  // Get client ID from JWT token
  const clientId = req.user.id;

  // Build query - filter by client's requirements (CORRECTED LOGIC)
  let query = {};

  // For clients, we want to show ALL applications for their requirements
  // regardless of the application's organizationId, since applications can come from different vendors
  if (req.user.userType === 'client') {
    if (req.user.organizationId) {
      // Get requirements that belong to the client's organization
      const clientRequirements = await Requirement.find({ 
        organizationId: req.user.organizationId 
      }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds };
    } else {
      // Fallback to requirement-based filtering for clients without organization
      const clientRequirements = await Requirement.find({ createdBy: clientId }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds };
    }
  }

  if (status) {
    query.status = status;
  }

  // Filter by specific requirement if provided
  if (requirementId) {
    query.requirement = requirementId;
  }

  // Execute query with pagination - OPTIMIZED
  const applications = await Application.find(query)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  const total = await Application.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(
      applications,
      'Client applications retrieved successfully',
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
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
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

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
    .populate('createdBy', 'firstName lastName email')
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
  const applicationData = {
    requirement: requirementId,
    resource: resourceId,
    notes,
    proposedRate,
    availability,
    createdBy: req.user.id,
    updatedBy: req.user.id,
    status: 'applied'
  };

  // Add organizationId for both vendor and client applications
  if (req.user.organizationId) {
    applicationData.organizationId = req.user.organizationId;
    console.log('🔧 ApplicationController: Adding organizationId to application:', req.user.organizationId);
  } else {
    return next(new ErrorResponse('User must belong to an organization to create applications', 400));
  }

  const application = await Application.create(applicationData);

  // Populate related fields for response
  const populatedApplication = await Application.findById(application._id)
    .populate('requirement', 'title status priority')
    .populate('resource', 'name status category')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  // Create initial history entry
  const historyData = {
    application: application._id,
    status: 'applied',
    notes: notes || 'Application submitted',
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  // Add organizationId for application history
  if (req.user.organizationId) {
    historyData.organizationId = req.user.organizationId;
    console.log('🔧 ApplicationController: Adding organizationId to application history:', req.user.organizationId);
  }

  await ApplicationHistory.create(historyData);

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
  updateData.updatedBy = req.user.id;
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
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  // Create history entry
  const historyData = {
    application: application._id,
    previousStatus,
    status,
    notes: notes || `Status changed from ${previousStatus} to ${status}`,
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  // Add organizationId for application history
  if (req.user.organizationId) {
    historyData.organizationId = req.user.organizationId;
    console.log('🔧 ApplicationController: Adding organizationId to application history:', req.user.organizationId);
  }

  await ApplicationHistory.create(historyData);

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
  updateData.updatedBy = req.user.id;
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
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

  // Create history entry
  const historyData = {
    application: application._id,
    status: application.status,
    notes: 'Application details updated',
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  // Add organizationId for application history
  if (req.user.organizationId) {
    historyData.organizationId = req.user.organizationId;
    console.log('🔧 ApplicationController: Adding organizationId to application history:', req.user.organizationId);
  }

  await ApplicationHistory.create(historyData);

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
  const historyData = {
    application: application._id,
    previousStatus: application.status,
    status: 'deleted',
    notes: 'Application was deleted',
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  // Add organizationId for application history
  if (req.user.organizationId) {
    historyData.organizationId = req.user.organizationId;
    console.log('🔧 ApplicationController: Adding organizationId to application history:', req.user.organizationId);
  }

  await ApplicationHistory.create(historyData);

  await application.deleteOne();

  res.status(200).json(
    ApiResponse.success(null, 'Application deleted successfully')
  );
});

// @desc    Get application counts for requirements
// @route   GET /api/applications/counts/requirements
// @access  Private
const getApplicationCountsForRequirements = asyncHandler(async (req, res, next) => {
  const { requirementIds } = req.query;
  
  if (!requirementIds) {
    return next(new ErrorResponse('Requirement IDs are required', 400));
  }

  // Parse requirement IDs (can be comma-separated string or array)
  let requirementIdArray;
  if (typeof requirementIds === 'string') {
    requirementIdArray = requirementIds.split(',');
  } else if (Array.isArray(requirementIds)) {
    requirementIdArray = requirementIds;
  } else {
    return next(new ErrorResponse('Invalid requirement IDs format', 400));
  }

  // Build query based on user type
  let query = { requirement: { $in: requirementIdArray } };

  // For clients, we want to count ALL applications for their requirements
  // regardless of organizationId, since applications can come from different vendors
  if (req.user.userType === 'client') {
    // For clients, we only need to ensure the requirements belong to them
    // The applications can be from any vendor/organization
    if (req.user.organizationId) {
      // Get requirements that belong to the client's organization
      const clientRequirements = await Requirement.find({ 
        organizationId: req.user.organizationId,
        _id: { $in: requirementIdArray }
      }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds };
    } else {
      // Fallback to requirement-based filtering for clients without organization
      const clientRequirements = await Requirement.find({ createdBy: req.user.id }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds.filter(id => requirementIdArray.includes(id.toString())) };
    }
  }

  // For vendors, filter by their resources
  if (req.user.userType === 'vendor') {
    // For vendors, we want to count ALL applications for their resources
    // regardless of the application's organizationId, since applications can come from different clients
    if (req.user.organizationId) {
      // Get resources that belong to the vendor's organization
      const vendorResources = await Resource.find({ 
        organizationId: req.user.organizationId
      }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds };
    } else {
      // Fallback to resource-based filtering for vendors without organization
      const vendorResources = await Resource.find({ createdBy: req.user.id }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds };
    }
  }

  // Aggregate to get counts for each requirement - OPTIMIZED
  const counts = await Application.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$requirement',
        count: { $sum: 1 }
      }
    }
  ]).allowDiskUse(true); // Allow disk use for large datasets

  // Convert to object with requirement ID as key
  const countsMap = {};
  counts.forEach(item => {
    countsMap[item._id.toString()] = item.count;
  });

  // Ensure all requested requirement IDs are included (with 0 count if no applications)
  requirementIdArray.forEach(reqId => {
    if (!countsMap[reqId]) {
      countsMap[reqId] = 0;
    }
  });

  res.status(200).json(
    ApiResponse.success(countsMap, 'Application counts retrieved successfully')
  );
});

// @desc    Get application counts for resources
// @route   GET /api/applications/counts/resources
// @access  Private
const getApplicationCountsForResources = asyncHandler(async (req, res, next) => {
  const { resourceIds } = req.query;
  
  if (!resourceIds) {
    return next(new ErrorResponse('Resource IDs are required', 400));
  }

  // Parse resource IDs (can be comma-separated string or array)
  let resourceIdArray;
  if (typeof resourceIds === 'string') {
    resourceIdArray = resourceIds.split(',');
  } else if (Array.isArray(resourceIds)) {
    resourceIdArray = resourceIds;
  } else {
    return next(new ErrorResponse('Invalid resource IDs format', 400));
  }

  // Build query based on user type
  let query = { resource: { $in: resourceIdArray } };

  // For vendors, we want to count applications for their resources
  if (req.user.userType === 'vendor') {
    // For vendors, we want to count ALL applications for their resources
    // regardless of the application's organizationId, since applications can come from different clients
    if (req.user.organizationId) {
      // Get resources that belong to the vendor's organization
      const vendorResources = await Resource.find({ 
        organizationId: req.user.organizationId,
        _id: { $in: resourceIdArray }
      }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds };
    } else {
      // Fallback to resource-based filtering for vendors without organization
      const vendorResources = await Resource.find({ createdBy: req.user.id }).select('_id').lean();
      const vendorResourceIds = vendorResources.map(res => res._id);
      query.resource = { $in: vendorResourceIds.filter(id => resourceIdArray.includes(id.toString())) };
    }
  }

  // For clients, filter by their requirements
  if (req.user.userType === 'client') {
    if (req.user.organizationId) {
      // Get requirements that belong to the client's organization
      const clientRequirements = await Requirement.find({ 
        organizationId: req.user.organizationId
      }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds };
    } else {
      // Fallback to requirement-based filtering for clients without organization
      const clientRequirements = await Requirement.find({ createdBy: req.user.id }).select('_id').lean();
      const clientRequirementIds = clientRequirements.map(req => req._id);
      query.requirement = { $in: clientRequirementIds };
    }
  }

  // Aggregate to get counts for each resource - OPTIMIZED
  const counts = await Application.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$resource',
        count: { $sum: 1 }
      }
    }
  ]).allowDiskUse(true); // Allow disk use for large datasets

  // Convert to object with resource ID as key
  const countsMap = {};
  counts.forEach(item => {
    countsMap[item._id.toString()] = item.count;
  });

  // Ensure all requested resource IDs are included (with 0 count if no applications)
  resourceIdArray.forEach(resId => {
    if (!countsMap[resId]) {
      countsMap[resId] = 0;
    }
  });

  res.status(200).json(
    ApiResponse.success(countsMap, 'Application counts for resources retrieved successfully')
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
  deleteApplication,
  getApplicationCountsForRequirements,
  getApplicationCountsForResources
};