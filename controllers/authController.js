const jwt       = require('jsonwebtoken');
const Admin     = require('../models/Admin');
const AppError  = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} = require('../utils/generateTokens');

/* ════════════════════════════════════════════════════════════════════════
   POST /api/auth/login
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Find admin (explicitly select password)
  const admin = await Admin.findOne({ email, isActive: true }).select('+password +refreshToken');
  if (!admin || !(await admin.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // 2. Generate tokens
  const accessToken  = generateAccessToken(admin._id, admin.role);
  const refreshToken = generateRefreshToken(admin._id);

  // 3. Persist refresh token (hashed later if needed)
  admin.refreshToken = refreshToken;
  admin.lastLogin    = new Date();
  await admin.save({ validateBeforeSave: false });

  // 4. Set refresh token as HttpOnly cookie
  setRefreshCookie(res, refreshToken);

  // 5. Send response (never send password)
  admin.password     = undefined;
  admin.refreshToken = undefined;

  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      admin: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   POST /api/auth/refresh
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using HttpOnly cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) return next(new AppError('No refresh token provided.', 401));

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  const admin = await Admin.findById(decoded.id).select('+refreshToken');
  if (!admin || admin.refreshToken !== token) {
    return next(new AppError('Refresh token mismatch. Please log in again.', 401));
  }

  // Issue new access token
  const newAccessToken  = generateAccessToken(admin._id, admin.role);
  const newRefreshToken = generateRefreshToken(admin._id);

  admin.refreshToken = newRefreshToken;
  await admin.save({ validateBeforeSave: false });
  setRefreshCookie(res, newRefreshToken);

  res.status(200).json({
    status: 'success',
    data:   { accessToken: newAccessToken },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   POST /api/auth/logout
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Admin logout — clears refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
const logout = catchAsync(async (req, res) => {
  // Invalidate server-side refresh token
  if (req.admin) {
    await Admin.findByIdAndUpdate(req.admin._id, { refreshToken: '' });
  }

  // Clear cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires:  new Date(0),
  });

  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/auth/me
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged-in admin profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Admin profile
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data:   { admin: req.admin },
  });
});

module.exports = { login, refreshToken, logout, getMe };
