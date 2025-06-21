const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const ApiResponse = require('../models/ApiResponse');
const File = require('../models/File');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }

  const { entityType, entityId, category, description, isPublic, tags } = req.body;

  // Validate required fields
  if (!entityType || !entityId) {
    return next(new ErrorResponse('Entity type and entity ID are required', 400));
  }

  // Create file record
  const fileData = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    extension: path.extname(req.file.originalname).toLowerCase(),
    uploadedBy: req.user.id,
    entityType,
    entityId,
    category: category || 'other',
    description: description || '',
    isPublic: isPublic === 'true',
    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
  };

  const file = await File.create(fileData);

  // Populate uploader info
  await file.populate('uploadedBy', 'firstName lastName email');

  res.status(201).json(
    ApiResponse.success(file, 'File uploaded successfully')
  );
});

// @desc    Get files by entity
// @route   GET /api/files/entity/:entityType/:entityId
// @access  Private
const getFilesByEntity = asyncHandler(async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const { category, approvalStatus, page = 1, limit = 10 } = req.query;

  // Build query
  let query = { entityType, entityId };

  // Add filters
  if (category) {
    query.category = category;
  }

  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  // Check permissions - users can only see their own files or public files
  if (req.user.role !== 'admin') {
    query.$or = [
      { uploadedBy: req.user.id },
      { isPublic: true }
    ];
  }

  const files = await File.find(query)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await File.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(files, 'Files retrieved successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  );
});

// @desc    Get file by ID
// @route   GET /api/files/:id
// @access  Private
const getFile = asyncHandler(async (req, res, next) => {
  const file = await File.findById(req.params.id)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email');

  if (!file) {
    return next(new ErrorResponse('File not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && 
      file.uploadedBy._id.toString() !== req.user.id && 
      !file.isPublic) {
    return next(new ErrorResponse('Not authorized to access this file', 403));
  }

  res.status(200).json(
    ApiResponse.success(file, 'File retrieved successfully')
  );
});

// @desc    Download file
// @route   GET /api/files/:id/download
// @access  Private
const downloadFile = asyncHandler(async (req, res, next) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse('File not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && 
      file.uploadedBy.toString() !== req.user.id && 
      !file.isPublic) {
    return next(new ErrorResponse('Not authorized to download this file', 403));
  }

  // Check if file exists on disk
  try {
    await fs.access(file.path);
  } catch (error) {
    return next(new ErrorResponse('File not found on server', 404));
  }

  // Update download count
  file.downloadCount += 1;
  file.lastDownloadedAt = new Date();
  await file.save();

  // Send file
  res.download(file.path, file.originalName);
});

// @desc    Update file
// @route   PUT /api/files/:id
// @access  Private
const updateFile = asyncHandler(async (req, res, next) => {
  let file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse('File not found', 404));
  }

  // Check permissions - only uploader or admin can update
  if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this file', 403));
  }

  // Fields that can be updated
  const allowedFields = ['description', 'category', 'isPublic', 'tags'];
  const updateData = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'tags' && typeof req.body[field] === 'string') {
        updateData[field] = req.body[field].split(',').map(tag => tag.trim());
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  file = await File.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  }).populate('uploadedBy', 'firstName lastName email');

  res.status(200).json(
    ApiResponse.success(file, 'File updated successfully')
  );
});

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = asyncHandler(async (req, res, next) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse('File not found', 404));
  }

  // Check permissions - only uploader or admin can delete
  if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this file', 403));
  }

  // Delete file from disk
  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error('Error deleting file from disk:', error);
    // Continue with database deletion even if file doesn't exist on disk
  }

  await file.deleteOne();

  res.status(200).json(
    ApiResponse.success(null, 'File deleted successfully')
  );
});

// @desc    Approve/reject file (Admin only)
// @route   PATCH /api/files/:id/approval
// @access  Private (Admin only)
const updateFileApproval = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to approve files', 403));
  }

  const { approvalStatus, approvalNotes } = req.body;

  if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
    return next(new ErrorResponse('Invalid approval status', 400));
  }

  const file = await File.findById(req.params.id);

  if (!file) {
    return next(new ErrorResponse('File not found', 404));
  }

  file.approvalStatus = approvalStatus;
  file.isApproved = approvalStatus === 'approved';
  file.approvalNotes = approvalNotes || '';
  file.approvedBy = req.user.id;
  file.approvedAt = new Date();

  await file.save();

  await file.populate('uploadedBy', 'firstName lastName email');
  await file.populate('approvedBy', 'firstName lastName email');

  res.status(200).json(
    ApiResponse.success(file, `File ${approvalStatus} successfully`)
  );
});

// @desc    Get user's files
// @route   GET /api/files/my-files
// @access  Private
const getMyFiles = asyncHandler(async (req, res, next) => {
  const { category, approvalStatus, page = 1, limit = 10 } = req.query;

  let query = { uploadedBy: req.user.id };

  if (category) {
    query.category = category;
  }

  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  const files = await File.find(query)
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await File.countDocuments(query);

  res.status(200).json(
    ApiResponse.success(files, 'Files retrieved successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  );
});

// @desc    Get pending approvals (Admin only)
// @route   GET /api/files/pending-approvals
// @access  Private (Admin only)
const getPendingApprovals = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view pending approvals', 403));
  }

  const { page = 1, limit = 10 } = req.query;

  const files = await File.find({ approvalStatus: 'pending' })
    .populate('uploadedBy', 'firstName lastName email companyName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await File.countDocuments({ approvalStatus: 'pending' });

  res.status(200).json(
    ApiResponse.success(files, 'Pending approvals retrieved successfully', {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    })
  );
});

// @desc    Bulk approve/reject files (Admin only)
// @route   POST /api/files/bulk-approval
// @access  Private (Admin only)
const bulkUpdateApproval = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to approve files', 403));
  }

  const { fileIds, approvalStatus, approvalNotes } = req.body;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return next(new ErrorResponse('File IDs are required', 400));
  }

  if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
    return next(new ErrorResponse('Invalid approval status', 400));
  }

  const updateData = {
    approvalStatus,
    isApproved: approvalStatus === 'approved',
    approvalNotes: approvalNotes || '',
    approvedBy: req.user.id,
    approvedAt: new Date()
  };

  const result = await File.updateMany(
    { _id: { $in: fileIds } },
    updateData
  );

  res.status(200).json(
    ApiResponse.success(
      { updatedCount: result.modifiedCount },
      `${result.modifiedCount} files ${approvalStatus} successfully`
    )
  );
});

module.exports = {
  uploadFile,
  getFilesByEntity,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
  updateFileApproval,
  getMyFiles,
  getPendingApprovals,
  bulkUpdateApproval
}; 