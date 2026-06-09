const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - message
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         message:
 *           type: string
 *         isRead:
 *           type: boolean
 */
const contactSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type:  String,
      trim:  true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    message: {
      type:      String,
      required:  [true, 'Message is required'],
      trim:      true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    isRead: {
      type:    Boolean,
      default: false,
    },
    emailSent: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

module.exports = mongoose.model('Contact', contactSchema);
