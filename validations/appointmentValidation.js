const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status:  'fail',
      message: 'Validation failed',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const createAppointmentRules = [
  body('patientName')
    .trim()
    .notEmpty().withMessage('Patient name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('age')
    .optional()
    .isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),

  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Please provide a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error('Appointment date cannot be in the past');
      return true;
    }),

  body('appointmentTime')
    .trim()
    .notEmpty().withMessage('Appointment time is required'),

  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),
];

const updateAppointmentRules = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Status must be pending, confirmed, cancelled, or completed'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
];

module.exports = { createAppointmentRules, updateAppointmentRules, validate };
