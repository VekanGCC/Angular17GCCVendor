const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user growth report
// @route   GET /api/admin/reports/user-growth
// @access  Private (Admin only)
const getUserGrowthReport = asyncHandler(async (req, res, next) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  let dateRange;
  let groupBy;
  
  if (startDate && endDate) {
    dateRange = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    switch (period) {
      case 'week':
        dateRange = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'year':
        dateRange = { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // month
        dateRange = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }
  
  // Get user growth data
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: dateRange
      }
    },
    {
      $group: {
        _id: groupBy,
        totalUsers: { $sum: 1 },
        vendors: {
          $sum: { $cond: [{ $eq: ['$userType', 'vendor'] }, 1, 0] }
        },
        clients: {
          $sum: { $cond: [{ $eq: ['$userType', 'client'] }, 1, 0] }
        },
        date: { $first: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        date: { 
          $dateToString: { 
            format: period === 'year' ? '%Y-%m' : '%Y-%m-%d', 
            date: '$date' 
          } 
        },
        totalUsers: 1,
        vendors: 1,
        clients: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Get cumulative user counts
  const totalUsers = await User.countDocuments();
  const totalVendors = await User.countDocuments({ userType: 'vendor' });
  const totalClients = await User.countDocuments({ userType: 'client' });
  
  res.status(200).json({
    success: true,
    data: {
      growth: userGrowth,
      totals: {
        users: totalUsers,
        vendors: totalVendors,
        clients: totalClients
      }
    }
  });
});

// @desc    Get revenue report
// @route   GET /api/admin/reports/revenue
// @access  Private (Admin only)
const getRevenueReport = asyncHandler(async (req, res, next) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  let dateRange;
  let groupBy;
  
  if (startDate && endDate) {
    dateRange = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    switch (period) {
      case 'week':
        dateRange = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'year':
        dateRange = { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // month
        dateRange = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }
  
  // Get revenue data
  const revenueData = await Order.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: dateRange
      }
    },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        platformFees: { $sum: { $multiply: ['$totalAmount', 0.10] } }, // Assuming 10% platform fee
        date: { $first: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        date: { 
          $dateToString: { 
            format: period === 'year' ? '%Y-%m' : '%Y-%m-%d', 
            date: '$date' 
          } 
        },
        totalRevenue: 1,
        orderCount: 1,
        platformFees: 1,
        vendorEarnings: { $subtract: ['$totalRevenue', '$platformFees'] }
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Get revenue by category
  const revenueByCategory = await Order.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: dateRange
      }
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceInfo'
      }
    },
    { $unwind: '$serviceInfo' },
    {
      $group: {
        _id: '$serviceInfo.category',
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalRevenue: 1,
        orderCount: 1
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);
  
  // Get total revenue stats
  const totalRevenue = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  const totalOrders = await Order.countDocuments({ status: 'completed' });
  
  res.status(200).json({
    success: true,
    data: {
      timeline: revenueData,
      byCategory: revenueByCategory,
      totals: {
        revenue: totalRevenue[0]?.total || 0,
        orders: totalOrders,
        platformFees: (totalRevenue[0]?.total || 0) * 0.10, // Assuming 10% platform fee
        vendorEarnings: (totalRevenue[0]?.total || 0) * 0.90 // Assuming 90% to vendors
      }
    }
  });
});

// @desc    Get service performance report
// @route   GET /api/admin/reports/service-performance
// @access  Private (Admin only)
const getServicePerformanceReport = asyncHandler(async (req, res, next) => {
  // Get top performing services
  const topServices = await Service.aggregate([
    { $match: { status: 'active' } },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'service',
        as: 'orders'
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        category: 1,
        vendor: 1,
        pricing: 1,
        stats: 1,
        orderCount: { $size: '$orders' },
        revenue: {
          $reduce: {
            input: '$orders',
            initialValue: 0,
            in: { 
              $add: [
                '$$value', 
                { $cond: [{ $eq: ['$$this.status', 'completed'] }, '$$this.totalAmount', 0] }
              ]
            }
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendorInfo'
      }
    },
    { $unwind: '$vendorInfo' },
    {
      $project: {
        _id: 1,
        title: 1,
        category: 1,
        vendorName: { 
          $concat: ['$vendorInfo.firstName', ' ', '$vendorInfo.lastName'] 
        },
        basePrice: '$pricing.basePrice',
        averageRating: '$stats.averageRating',
        totalReviews: '$stats.totalReviews',
        orderCount: 1,
        revenue: 1
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 }
  ]);
  
  // Get service category distribution
  const categoryDistribution = await Service.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        averagePrice: { $avg: '$pricing.basePrice' }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1,
        averagePrice: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Get service growth over time
  const serviceGrowth = await Service.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: { 
          $dateToString: { 
            format: '%Y-%m', 
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: 1
              }
            }
          }
        },
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      topServices,
      categoryDistribution,
      serviceGrowth
    }
  });
});

// @desc    Get vendor performance report
// @route   GET /api/admin/reports/vendor-performance
// @access  Private (Admin only)
const getVendorPerformanceReport = asyncHandler(async (req, res, next) => {
  // Get top performing vendors
  const topVendors = await User.aggregate([
    { $match: { userType: 'vendor', isActive: true } },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'vendor',
        as: 'orders'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'vendor',
        as: 'reviews'
      }
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        businessInfo: 1,
        orderCount: { $size: '$orders' },
        revenue: {
          $reduce: {
            input: '$orders',
            initialValue: 0,
            in: { 
              $add: [
                '$$value', 
                { $cond: [{ $eq: ['$$this.status', 'completed'] }, '$$this.totalAmount', 0] }
              ]
            }
          }
        },
        averageRating: { 
          $cond: [
            { $gt: [{ $size: '$reviews' }, 0] },
            { $avg: '$reviews.rating' },
            0
          ]
        },
        totalReviews: { $size: '$reviews' }
      }
    },
    {
      $project: {
        _id: 1,
        name: { $concat: ['$firstName', ' ', '$lastName'] },
        email: 1,
        businessName: '$businessInfo.companyName',
        orderCount: 1,
        revenue: 1,
        averageRating: 1,
        totalReviews: 1
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 }
  ]);
  
  // Get vendor registration trend
  const vendorGrowth = await User.aggregate([
    { $match: { userType: 'vendor' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: { 
          $dateToString: { 
            format: '%Y-%m', 
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: 1
              }
            }
          }
        },
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      topVendors,
      vendorGrowth
    }
  });
});

// @desc    Get client activity report
// @route   GET /api/admin/reports/client-activity
// @access  Private (Admin only)
const getClientActivityReport = asyncHandler(async (req, res, next) => {
  // Get top clients by spending
  const topClients = await User.aggregate([
    { $match: { userType: 'client', isActive: true } },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'client',
        as: 'orders'
      }
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        orderCount: { $size: '$orders' },
        totalSpent: {
          $reduce: {
            input: '$orders',
            initialValue: 0,
            in: { 
              $add: [
                '$$value', 
                { $cond: [{ $eq: ['$$this.status', 'completed'] }, '$$this.totalAmount', 0] }
              ]
            }
          }
        },
        registrationDate: '$createdAt'
      }
    },
    {
      $project: {
        _id: 1,
        name: { $concat: ['$firstName', ' ', '$lastName'] },
        email: 1,
        orderCount: 1,
        totalSpent: 1,
        registrationDate: 1
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 20 }
  ]);
  
  // Get client registration trend
  const clientGrowth = await User.aggregate([
    { $match: { userType: 'client' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: { 
          $dateToString: { 
            format: '%Y-%m', 
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: 1
              }
            }
          }
        },
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Get client retention data
  const clientRetention = await Order.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$client',
        orderCount: { $sum: 1 },
        firstOrder: { $min: '$createdAt' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 1,
        orderCount: 1,
        firstOrder: 1,
        lastOrder: 1,
        daysSinceFirstOrder: { 
          $divide: [
            { $subtract: [new Date(), '$firstOrder'] },
            1000 * 60 * 60 * 24
          ]
        },
        daysBetweenFirstAndLastOrder: {
          $divide: [
            { $subtract: ['$lastOrder', '$firstOrder'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    }
  ]);
  
  // Calculate retention metrics
  const repeatClients = clientRetention.filter(client => client.orderCount > 1).length;
  const totalClients = clientRetention.length;
  const retentionRate = totalClients > 0 ? (repeatClients / totalClients * 100).toFixed(1) : 0;
  
  res.status(200).json({
    success: true,
    data: {
      topClients,
      clientGrowth,
      retention: {
        totalClients,
        repeatClients,
        retentionRate: parseFloat(retentionRate),
        averageOrdersPerClient: totalClients > 0 
          ? clientRetention.reduce((sum, client) => sum + client.orderCount, 0) / totalClients 
          : 0
      }
    }
  });
});

module.exports = {
  getUserGrowthReport,
  getRevenueReport,
  getServicePerformanceReport,
  getVendorPerformanceReport,
  getClientActivityReport
};