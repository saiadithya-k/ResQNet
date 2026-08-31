const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || (statusCode >= 400 && statusCode < 500 ? 'fail' : 'error');
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle Prisma Known Request Errors
  if (err.code === 'P2002') {
    statusCode = 409;
    status = 'fail';
    const targets = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : (err.meta?.target || 'field');
    message = `A record with this ${targets} already exists`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    status = 'fail';
    message = err.meta?.cause || 'Requested record was not found';
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid data provided for database operation';
  }

  logger.error(`[API Error] ${message}`, err.stack || err);

  res.status(statusCode).json({
    success: false,
    status,
    message,
    details,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
