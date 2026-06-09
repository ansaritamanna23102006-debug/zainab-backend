const express  = require('express');
const router   = express.Router();
const {
  getDashboardStats,
  getMonthlyStats,
  getRecentActivity,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard statistics
 */

router.use(protect); // All dashboard routes require auth

router.get('/stats',   getDashboardStats);
router.get('/monthly', getMonthlyStats);
router.get('/recent',  getRecentActivity);

module.exports = router;
