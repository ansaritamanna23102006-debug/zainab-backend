const AppError = require('../utils/AppError');

/* ── Mongoose-specific error handlers ─────────────────────────────────── */

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field '${field}'. Please use a different value.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 400);
};

/* ── JWT error handlers ───────────────────────────────────────────────── */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

/* ── Response senders ────────────────────────────────────────────────── */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status:     err.status,
    message:    err.message,
    stack:      err.stack,
    error:      err,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted errors: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status:  err.status,
      message: err.message,
    });
  }
  // Programming or unknown errors: don't leak details
  console.error('💥 UNHANDLED ERROR:', err);
  return res.status(500).json({
    status:  'error',
    message: 'Something went wrong. Please try again later.',
  });
};

/* ── Global error handler middleware ──────────────────────────────────── */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    if (err.name === 'CastError')           error = handleCastErrorDB(error);
    if (err.code  === 11000)                error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError')     error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError')   error = handleJWTError();
    if (err.name === 'TokenExpiredError')   error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
