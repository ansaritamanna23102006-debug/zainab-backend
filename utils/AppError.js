/**
 * Custom operational error class.
 * Distinguishes known API errors (4xx/5xx) from unexpected crashes.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode  = statusCode;
    this.status      = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
