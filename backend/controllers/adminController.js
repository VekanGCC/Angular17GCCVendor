const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Review = require('../models/Review');
const AdminSkill = require('../models/AdminSkill');
const PendingApproval = require('../models/PendingApproval');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { createNotification } = require('./notificationController');

// @desc    Get pending approvals
// @route   GET /api/admin/approvals
// @access  Private (Admin only)
const getPendingApprovals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments({ approvalStatus: 'pending' });

  const users = await User.find({ approvalStatus: 'pending' })
    .select('firstName lastName email userType phone createdAt businessInfo address')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    pagination,
    data: users
  });
});

// @desc    Get single pending approval
// @route   GET /api/admin/approvals/:id
// @access  Private (Admin only)
const getApproval = asyncHandler(async (req, res, next) => {
  const approval = await PendingApproval.findById(req.params.id)
    .populate('submittedBy', 'firstName lastName email userType')
    .populate('reviewedBy', 'firstName lastName email')
    .populate('entityId');

  if (!approval) {
    return next(new ErrorResponse('Approval request not found', 404));
  }

  res.status(200).json({
    success: true,
    data: approval
  });
});

// @desc    Approve user
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin only)
const approveEntity = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const userId = req.params.id;
  
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  if (user.approvalStatus === 'approved') {
    return next(new ErrorResponse('User is already approved', 400));
  }
  
  // Update user status
  user.approvalStatus = 'approved';
  user.rejectionReason = null; // Clear any previous rejection reason
  await user.save();
  
  // Send notification
  await createNotification({
    recipient: user._id,
    type: 'account_update',
    title: 'Account Approved',
    message: user.userType === 'vendor' 
      ? 'Your vendor account has been approved. You can now create services and receive orders.'
      : 'Your client account has been approved. You can now book services.',
    relatedUser: req.user.id
  });
  
  res.status(200).json({
    success: true,
    data: user,
    message: 'User approved successfully'
  });
});

// @desc    Reject user
// @route   PUT /api/admin/users/:id/reject
// @access  Private (Admin only)
const rejectEntity = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const userId = req.params.id;
  
  if (!notes) {
    return next(new ErrorResponse('Rejection notes are required', 400));
  }
  
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  if (user.approvalStatus === 'approved') {
    return next(new ErrorResponse('User is already approved', 400));
  }
  
  // Update user status
  user.approvalStatus = 'rejected';
  user.rejectionReason = notes;
  await user.save();
  
  // Send notification
  await createNotification({
    recipient: user._id,
    type: 'account_update',
    title: 'Account Approval Rejected',
    message: `Your ${user.userType} account approval was rejected. Reason: ${notes}`,
    relatedUser: req.user.id
  });
  
  res.status(200).json({
    success: true,
    data: user,
    message: 'User rejected successfully'
  });
});

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getPlatformStats = asyncHandler(async (req, res, next) => {
  // Get current date ranges
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  // User statistics
  const totalUsers = await User.countDocuments();
  const totalVendors = await User.countDocuments({ userType: 'vendor' });
  const totalClients = await User.countDocuments({ userType: 'client' });
  const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
  
  // Service statistics
  const totalServices = await Service.countDocuments();
  const activeServices = await Service.countDocuments({ status: 'active' });
  const pendingServices = await Service.countDocuments({ status: 'pending' });
  const newServicesThisMonth = await Service.countDocuments({ createdAt: { $gte: startOfMonth } });
  
  // Order statistics
  const totalOrders = await Order.countDocuments();
  const completedOrders = await Order.countDocuments({ status: 'completed' });
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
  const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfDay } });
  const ordersThisWeek = await Order.countDocuments({ createdAt: { $gte: startOfWeek } });
  const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
  
  // Revenue statistics
  const totalRevenue = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const revenueToday = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const revenueThisWeek = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const revenueThisMonth = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const revenueThisYear = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  // Review statistics
  const totalReviews = await Review.countDocuments();
  const averageRating = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' } } }
  ]);
  
  // Pending approvals
  const pendingApprovals = await PendingApproval.countDocuments({ status: 'pending' });
  
  // Monthly revenue trend
  const monthlyRevenue = await Order.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        vendors: totalVendors,
        clients: totalClients,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth
      },
      services: {
        total: totalServices,
        active: activeServices,
        pending: pendingServices,
        newThisMonth: newServicesThisMonth
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        today: ordersToday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: revenueToday[0]?.total || 0,
        thisWeek: revenueThisWeek[0]?.total || 0,
        thisMonth: revenueThisMonth[0]?.total || 0,
        thisYear: revenueThisYear[0]?.total || 0
      },
      reviews: {
        total: totalReviews,
        averageRating: averageRating[0]?.avg || 0
      },
      pendingApprovals,
      monthlyRevenue: monthlyRevenue.map(item => ({
        period: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        count: item.count
      }))
    }
  });
});

// @desc    Get all admin skills
// @route   GET /api/admin/skills
// @access  Private (Admin only)
const getAdminSkills = asyncHandler(async (req, res, next) => {
  const { 
    category,
    isActive,
    page = 1, 
    limit = 50, 
    sortBy = 'name', 
    sortOrder = 'asc',
    search
  } = req.query;

  // Build query
  let query = {};

  if (category) {
    query.category = category;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Execute query with pagination
  const skills = await AdminSkill.find(query)
    .populate('createdBy', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await AdminSkill.countDocuments(query);

  res.status(200).json({
    success: true,
    data: skills,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single admin skill
// @route   GET /api/admin/skills/:id
// @access  Private (Admin only)
const getAdminSkill = asyncHandler(async (req, res, next) => {
  const skill = await AdminSkill.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email');

  if (!skill) {
    return next(new ErrorResponse('Skill not found', 404));
  }

  res.status(200).json({
    success: true,
    data: skill
  });
});

// @desc    Create admin skill
// @route   POST /api/admin/skills
// @access  Private (Admin only)
const createAdminSkill = asyncHandler(async (req, res, next) => {
  // Add admin user to req.body
  req.body.createdBy = req.user.id;

  // Check if skill already exists
  const existingSkill = await AdminSkill.findOne({ name: req.body.name });
  if (existingSkill) {
    return next(new ErrorResponse('Skill with this name already exists', 400));
  }

  const skill = await AdminSkill.create(req.body);

  res.status(201).json({
    success: true,
    data: skill
  });
});

// @desc    Update admin skill
// @route   PUT /api/admin/skills/:id
// @access  Private (Admin only)
const updateAdminSkill = asyncHandler(async (req, res, next) => {
  let skill = await AdminSkill.findById(req.params.id);

  if (!skill) {
    return next(new ErrorResponse('Skill not found', 404));
  }

  // Check if name is being updated and if it already exists
  if (req.body.name && req.body.name !== skill.name) {
    const existingSkill = await AdminSkill.findOne({ name: req.body.name });
    if (existingSkill) {
      return next(new ErrorResponse('Skill with this name already exists', 400));
    }
  }

  skill = await AdminSkill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: skill
  });
});

// @desc    Delete admin skill
// @route   DELETE /api/admin/skills/:id
// @access  Private (Admin only)
const deleteAdminSkill = asyncHandler(async (req, res, next) => {
  const skill = await AdminSkill.findById(req.params.id);

  if (!skill) {
    return next(new ErrorResponse('Skill not found', 404));
  }

  await skill.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
const getAllTransactions = asyncHandler(async (req, res, next) => {
  const { 
    type,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  // Build query
  let query = {};

  if (type) {
    query.type = type;
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
  }

  // Execute query with pagination
  const transactions = await Transaction.find(query)
    .populate('client', 'firstName lastName email')
    .populate('vendor', 'firstName lastName email businessInfo')
    .populate('relatedOrder', 'orderNumber')
    .populate('relatedService', 'title')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    success: true,
    data: transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get transaction by ID
// @route   GET /api/admin/transactions/:id
// @access  Private (Admin only)
const getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('client', 'firstName lastName email phone')
    .populate('vendor', 'firstName lastName email businessInfo')
    .populate('relatedOrder', 'orderNumber totalAmount status')
    .populate('relatedService', 'title category');

  if (!transaction) {
    return next(new ErrorResponse('Transaction not found', 404));
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Update transaction
// @route   PUT /api/admin/transactions/:id
// @access  Private (Admin only)
const updateTransaction = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;

  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse('Transaction not found', 404));
  }

  // Only allow updating specific fields
  const updateData = {};
  if (status) updateData.status = status;
  if (notes) updateData.notes = notes;

  if (status === 'completed' && transaction.status !== 'completed') {
    updateData.processedAt = Date.now();
  }

  transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  // If status changed to completed, notify relevant users
  if (status === 'completed' && transaction.status !== 'completed') {
    // Notify client if exists
    if (transaction.client) {
      await createNotification({
        recipient: transaction.client,
        type: 'payment_received',
        title: 'Payment Processed',
        message: `Your ${transaction.type} of ${transaction.amount} ${transaction.currency} has been processed successfully.`,
        relatedOrder: transaction.relatedOrder
      });
    }

    // Notify vendor if exists and is a payout
    if (transaction.vendor && transaction.type === 'payout') {
      await createNotification({
        recipient: transaction.vendor,
        type: 'payment_received',
        title: 'Payout Processed',
        message: `Your payout of ${transaction.amount} ${transaction.currency} has been processed successfully.`,
        relatedOrder: transaction.relatedOrder
      });
    }
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAdminUsers = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search,
    userType,
    isActive
  } = req.query;

  // Build query
  let query = {};

  // Add filters if provided
  if (userType) {
    query.userType = userType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const users = await User.find(query)
    .select('-password')
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

// @desc    Create admin user
// @route   POST /api/admin/users
// @access  Private (Super Admin only)
const createAdminUser = asyncHandler(async (req, res, next) => {
  // Check if current user is super admin
  if (req.user.role !== 'superadmin') {
    return next(new ErrorResponse('Not authorized to create admin users', 403));
  }

  const { email, password, firstName, lastName, permissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create admin user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    userType: 'admin',
    role: 'admin',
    permissions,
    isEmailVerified: true, // Auto-verify admin emails
    isActive: true,
    approvalStatus: 'approved',
    registrationStep: 5,
    isRegistrationComplete: true
  });

  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions
    }
  });
});

module.exports = {
  getPendingApprovals,
  getApproval,
  approveEntity,
  rejectEntity,
  getPlatformStats,
  getAdminSkills,
  getAdminSkill,
  createAdminSkill,
  updateAdminSkill,
  deleteAdminSkill,
  getAllTransactions,
  getTransaction,
  updateTransaction,
  getAdminUsers,
  createAdminUser
};