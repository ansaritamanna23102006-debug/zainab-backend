const express  = require('express');
const router   = express.Router();
const { login, refreshToken, logout, getMe } = require('../controllers/authController');
const { protect }   = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginRules, validate } = require('../validations/authValidation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin authentication endpoints
 */

router.post('/login',   authLimiter, loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout',  protect, logout);
router.get('/me',       protect, getMe);

module.exports = router;
