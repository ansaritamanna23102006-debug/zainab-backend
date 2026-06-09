const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  message: {
    status:  'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * Strict auth rate limiter — 10 requests per 15 minutes.
 * Prevents brute-force login attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: {
    status:  'fail',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

/**
 * Form submission limiter — 5 per 10 minutes.
 * Applied to appointment and contact POST routes.
 */
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      5,
  message: {
    status:  'fail',
    message: 'Too many form submissions. Please wait a few minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

module.exports = { generalLimiter, authLimiter, formLimiter };
