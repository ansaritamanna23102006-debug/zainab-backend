const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, superadmin]
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Admin name is required'],
      trim:     true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:   false, // Never return password in queries
    },
    role: {
      type:    String,
      enum:    ['admin', 'superadmin'],
      default: 'admin',
    },
    refreshToken: {
      type:   String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Hash password before save ──────────────────────────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare passwords ────────────────────────────────────
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
