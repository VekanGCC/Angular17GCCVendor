const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token, explicitly selecting the role field
      const user = await User.findById(decoded.id).select('+role');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Check if user is an admin
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect }; 