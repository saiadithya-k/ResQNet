const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`[API Error] ${err.message}`, err.stack);

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    details: err.details || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
