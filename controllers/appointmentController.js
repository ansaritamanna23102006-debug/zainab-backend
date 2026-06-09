const Appointment  = require('../models/Appointment');
const AppError     = require('../utils/AppError');
const catchAsync   = require('../utils/catchAsync');
const { sendAppointmentEmail } = require('../services/emailService');

/* ════════════════════════════════════════════════════════════════════════
   POST /api/appointments  — Create
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment booked
 *       422:
 *         description: Validation error
 */
const createAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.create(req.body);

  // Send email notification (non-blocking)
  sendAppointmentEmail(appointment).then(() => {
    Appointment.findByIdAndUpdate(appointment._id, { emailSent: true }).exec();
  }).catch((err) => {
    console.error('Email send failed:', err.message);
  });

  res.status(201).json({
    status:  'success',
    message: 'Appointment booked successfully. We will confirm shortly.',
    data:    { appointment },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/appointments  — List All (Protected)
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments (Admin only)
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of appointments
 */
const getAllAppointments = catchAsync(async (req, res) => {
  const { status, date, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.appointmentDate = { $gte: start, $lt: end };
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
    data: { appointments },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   GET /api/appointments/:id  — Single
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get single appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details
 *       404:
 *         description: Not found
 */
const getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found.', 404));

  res.status(200).json({
    status: 'success',
    data:   { appointment },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   PUT /api/appointments/:id  — Update
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment status or notes
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated appointment
 *       404:
 *         description: Not found
 */
const updateAppointment = catchAsync(async (req, res, next) => {
  const allowedFields = ['status', 'notes', 'appointmentDate', 'appointmentTime'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );
  if (!appointment) return next(new AppError('Appointment not found.', 404));

  res.status(200).json({
    status:  'success',
    message: 'Appointment updated successfully.',
    data:    { appointment },
  });
});

/* ════════════════════════════════════════════════════════════════════════
   DELETE /api/appointments/:id
════════════════════════════════════════════════════════════════════════ */
/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 */
const deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found.', 404));

  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
};
