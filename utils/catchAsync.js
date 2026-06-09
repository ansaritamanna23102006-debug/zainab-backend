/**
 * Wraps async route handlers to eliminate repetitive try/catch blocks.
 * Passes errors to Express's next() for the global error handler.
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
