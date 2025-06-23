const User = require('../models/User');
const UserAddress = require('../models/UserAddress');
const UserBankDetails = require('../models/UserBankDetails');
const UserStatutoryCompliance = require('../models/UserStatutoryCompliance');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { validationResult } = require('express-validator');
const { createNotification } = require('./notificationController');

// @desc    Get all users (with filtering)
// @route   GET /api/admin/users/all
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { 
    userType, 
    isActive, 
    isEmailVerified,
    registrationComplete,
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search
  } = req.query;

  // Build query
  let query = {};

  if (userType) {
    query.userType = userType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (isEmailVerified !== undefined) {
    query.isEmailVerified = isEmailVerified === 'true';
  }

  if (registrationComplete !== undefined) {
    query.isRegistrationComplete = registrationComplete === 'true';
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const users = await User.find(query)
    .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/all/:id
// @access  Private (Admin only)
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/all/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res, next) => {
  // Prevent updating sensitive fields
  const fieldsToUpdate = { ...req.body };
  delete fieldsToUpdate.password;
  delete fieldsToUpdate.role; // Role can only be updated by superadmin
  delete fieldsToUpdate.email; // Email changes should go through a verification process

  // Check if trying to update admin permissions without being superadmin
  if (fieldsToUpdate.permissions && req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Not authorized to update admin permissions', 403));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Activate/Deactivate user
// @route   PUT /api/admin/users/all/:id/toggle-status
// @access  Private (Admin only)
const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Toggle active status
  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      isActive: user.isActive
    },
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

// @desc    Approve/Reject user
// @route   PUT /api/admin/users/all/:id/approve
// @access  Private (Admin only)
const approveUser = asyncHandler(async (req, res, next) => {
  const { approve = true, notes } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.approvalStatus = approve ? 'approved' : 'rejected';
  if (!approve && notes) {
    user.rejectionReason = notes;
  } else if (approve) {
    user.rejectionReason = undefined;
  }
  await user.save();

  // Create notification for the user
  await createNotification({
    recipient: user._id,
    type: 'account_update',
    title: approve ? 'Account Approved' : 'Account Rejected',
    message: approve 
      ? `Your ${user.userType} account has been approved. You can now ${user.userType === 'vendor' ? 'create services and receive orders' : 'book services'}.`
      : `Your ${user.userType} account approval was rejected. ${notes ? `Reason: ${notes}` : 'Please contact support for more information.'}`,
    relatedUser: req.user.id
  });

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      approvalStatus: user.approvalStatus,
      rejectionReason: user.rejectionReason
    },
    message: `User ${approve ? 'approved' : 'rejected'} successfully`
  });
});

// @desc    Reset user password
// @route   PUT /api/admin/users/all/:id/reset-password
// @access  Private (Admin only)
const resetUserPassword = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Create notification for the user
  await createNotification({
    recipient: user._id,
    type: 'account_update',
    title: 'Password Reset',
    message: 'Your password has been reset by an administrator. Please log in with your new password.',
    relatedUser: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get user profile with all related data
// @route   GET /api/admin/users/:id/profile
// @access  Private (Admin only)
const getUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Get user data
  const user = await User.findById(userId)
    .select('-password -emailVerificationToken -phoneVerificationCode -passwordResetToken');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Get user addresses
  const addresses = await UserAddress.find({ userId });

  // Get user bank details (only for vendors)
  const bankDetails = user.userType === 'vendor' ? await UserBankDetails.find({ userId }) : [];

  // Get user compliance data
  const compliance = await UserStatutoryCompliance.findOne({ userId });

  // Prepare response data
  const profileData = {
    user,
    addresses,
    bankDetails,
    compliance
  };

  res.status(200).json({
    success: true,
    data: profileData
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  approveUser,
  resetUserPassword,
  getUserProfile
};