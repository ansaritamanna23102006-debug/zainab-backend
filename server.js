/**
 * ============================================================
 *  Zainab Clinic — Production-Ready Express Server
 * ============================================================
 */

'use strict';

// ── Load environment variables first ──────────────────────────────────────
require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss           = require('xss');
const hpp           = require('hpp');
const cookieParser  = require('cookie-parser');
const swaggerUi     = require('swagger-ui-express');

const connectDB          = require('./config/db');
const swaggerSpec        = require('./config/swagger');
const { generalLimiter } = require('./middleware/rateLimiter');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError           = require('./utils/AppError');

// ── Route imports ─────────────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const contactRoutes     = require('./routes/contactRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const uploadRoutes      = require('./routes/uploadRoutes');

/* ══════════════════════════════════════════════════════════════════════════
   Connect to Database
══════════════════════════════════════════════════════════════════════════ */
connectDB();

/* ══════════════════════════════════════════════════════════════════════════
   App Initialization
══════════════════════════════════════════════════════════════════════════ */
const app = express();

/* ══════════════════════════════════════════════════════════════════════════
   Trust Proxy (Required for rate limiting behind Render/Railway/Nginx)
══════════════════════════════════════════════════════════════════════════ */
app.set('trust proxy', 1);

/* ══════════════════════════════════════════════════════════════════════════
   Security Middleware
══════════════════════════════════════════════════════════════════════════ */

// HTTP Security Headers
app.use(helmet());

// CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials:      true,
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
}));

// General rate limiter (applied to all /api routes)
app.use('/api', generalLimiter);

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL injection sanitization
app.use(mongoSanitize());

// XSS sanitization — sanitize req.body string fields
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') obj[key] = xss(obj[key]);
        else if (typeof obj[key] === 'object' && obj[key] !== null) sanitize(obj[key]);
      }
    };
    sanitize(req.body);
  }
  next();
});

// HTTP Parameter Pollution prevention
app.use(hpp({
  whitelist: ['status', 'sort', 'page', 'limit', 'date'],
}));

/* ══════════════════════════════════════════════════════════════════════════
   Development Logging
══════════════════════════════════════════════════════════════════════════ */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ══════════════════════════════════════════════════════════════════════════
   Health Check & Root Routes
   ══════════════════════════════════════════════════════════════════════════ */
app.get('/', (req, res) => {
  res.status(200).json({
    status:  'success',
    message: '🏥 Welcome to the Zainab Clinic API. Use /health for status or /api/docs for documentation.',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status:  'success',
    message: '🏥 Zainab Clinic API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Swagger API Documentation
══════════════════════════════════════════════════════════════════════════ */
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Zainab Clinic API Docs',
    customCss: '.swagger-ui .topbar { background-color: #0F766E; }',
  })
);

/* ══════════════════════════════════════════════════════════════════════════
   API Routes
══════════════════════════════════════════════════════════════════════════ */
app.use('/api/auth',         authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contact',      contactRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/upload',       uploadRoutes);

/* ══════════════════════════════════════════════════════════════════════════
   Unhandled Routes
══════════════════════════════════════════════════════════════════════════ */
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

/* ══════════════════════════════════════════════════════════════════════════
   Global Error Handler
══════════════════════════════════════════════════════════════════════════ */
app.use(globalErrorHandler);

/* ══════════════════════════════════════════════════════════════════════════
   Start Server
══════════════════════════════════════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Zainab Clinic API running on port ${PORT}`);
  console.log(`   Mode:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Docs:  http://localhost:${PORT}/api/docs`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

/* ══════════════════════════════════════════════════════════════════════════
   Unhandled Promise Rejections & Exceptions
══════════════════════════════════════════════════════════════════════════ */
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION:', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.name, err.message);
  process.exit(1);
});

module.exports = app;
