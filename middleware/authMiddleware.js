const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Verify JWT access token from Authorization header.
 * Attaches req.admin to the request object.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this route.', 401));
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Check admin still exists and is active
  const admin = await Admin.findById(decoded.id).select('+isActive');
  if (!admin || !admin.isActive) {
    return next(new AppError('The account associated with this token no longer exists.', 401));
  }

  req.admin = admin;
  next();
});

/**
 * Restrict route to specific roles.
 * Must be used AFTER protect middleware.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { protect, restrictTo };
