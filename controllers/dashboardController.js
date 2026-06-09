const Appointment = require('../models/Appointment');
const Contact     = require('../models/Contact');
const catchAsync  = require('../utils/catchAsync');

/* ════════════════════════════════════════════════════════════════════════
   GET /api/dashboard/stats
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    totalMessages,
    unreadMessages,
  ] = await Promise.all([
    Appointment.countDocuments(),
    Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: 'confirmed' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: 'cancelled' }),
    Contact.countDocuments(),
    Contact.countDocuments({ isRead: false }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      appointments: {
        total:     totalAppointments,
        today:     todayAppointments,
        pending:   pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
      messages: {
        total:  totalMessages,
        unread: unreadMessages,
      },
    },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/dashboard/monthly
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/dashboard/monthly:
 *   get:
 *     summary: Get monthly appointment statistics for the past 12 months
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Monthly chart data
 */
const getMonthlyStats = catchAsync(async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyData = await Appointment.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total:     { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id:       0,
        year:      '$_id.year',
        month:     '$_id.month',
        total:     1,
        completed: 1,
        cancelled: 1,
      },
    },
  ]);

  // Format into readable month labels
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formatted = monthlyData.map((d) => ({
    label:     `${MONTHS[d.month - 1]} ${d.year}`,
    total:     d.total,
    completed: d.completed,
    cancelled: d.cancelled,
  }));

  res.status(200).json({
    status: 'success',
    data:   { monthly: formatted },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/dashboard/recent
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get recent appointments and messages
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent activity
 */
const getRecentActivity = catchAsync(async (req, res) => {
  const [recentAppointments, recentMessages] = await Promise.all([
    Appointment.find().sort('-createdAt').limit(5),
    Contact.find().sort('-createdAt').limit(5),
  ]);

  res.status(200).json({
    status: 'success',
    data:   { recentAppointments, recentMessages },
  });
});

module.exports = { getDashboardStats, getMonthlyStats, getRecentActivity };
