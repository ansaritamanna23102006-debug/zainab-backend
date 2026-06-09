const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientName
 *         - phone
 *         - appointmentDate
 *         - appointmentTime
 *       properties:
 *         patientName:
 *           type: string
 *         phone:
 *           type: string
 *         age:
 *           type: number
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         appointmentDate:
 *           type: string
 *           format: date
 *         appointmentTime:
 *           type: string
 *         symptoms:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 */
const appointmentSchema = new mongoose.Schema(
  {
    patientName: {
      type:     String,
      required: [true, 'Patient name is required'],
      trim:     true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type:     String,
      required: [true, 'Phone number is required'],
      trim:     true,
      match:    [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    age: {
      type: Number,
      min:  [1,   'Age must be at least 1'],
      max:  [120, 'Age cannot exceed 120'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      lowercase: true,
    },
    appointmentDate: {
      type:     Date,
      required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
      type:     String,
      required: [true, 'Appointment time is required'],
      trim:     true,
    },
    symptoms: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Symptoms description cannot exceed 500 characters'],
    },
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type:      String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    emailSent: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ phone: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
