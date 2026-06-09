const express  = require('express');
const router   = express.Router();
const {
  createAppointment,
  getAllAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect }    = require('../middleware/authMiddleware');
const { formLimiter } = require('../middleware/rateLimiter');
const {
  createAppointmentRules,
  updateAppointmentRules,
  validate,
} = require('../validations/appointmentValidation');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment booking and management
 */

// Public: book appointment
router.post('/', formLimiter, createAppointmentRules, validate, createAppointment);

// Protected: admin only
router.use(protect);
router.get('/',    getAllAppointments);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointmentRules, validate, updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
