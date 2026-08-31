const { AppError } = require('../utils/errors');

module.exports = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === '');
    if (missing.length > 0) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }
    next();
  };
};
