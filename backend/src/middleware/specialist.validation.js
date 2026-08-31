const { AppError } = require('../utils/errors');

/**
 * Validate Specialist Creation
 */
exports.validateCreateSpecialist = (req, res, next) => {
  const { name, specialty, status, availability } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Specialist name is required and must be a non-empty string', 400));
  }

  if (!specialty || typeof specialty !== 'string' || specialty.trim() === '') {
    return next(new AppError('Specialty is required and must be a non-empty string', 400));
  }

  const rawStatus = status || availability;
  if (rawStatus !== undefined) {
    if (typeof rawStatus !== 'string') {
      return next(new AppError('Specialist status must be a string', 400));
    }
    const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'OFF_DUTY'];
    if (!validStatuses.includes(rawStatus.trim().toUpperCase())) {
      return next(new AppError(`Invalid specialist status '${rawStatus}'. Allowed: ${validStatuses.join(', ')}`, 400));
    }
  }

  req.body.name = name.trim();
  req.body.specialty = specialty.trim();
  next();
};

/**
 * Validate Specialist Updates
 */
exports.validateUpdateSpecialist = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Update payload cannot be empty', 400));
  }

  const { name, specialty, status, availability } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return next(new AppError('Specialist name must be a non-empty string', 400));
    }
    req.body.name = name.trim();
  }

  if (specialty !== undefined) {
    if (typeof specialty !== 'string' || specialty.trim() === '') {
      return next(new AppError('Specialty must be a non-empty string', 400));
    }
    req.body.specialty = specialty.trim();
  }

  const rawStatus = status || availability;
  if (rawStatus !== undefined) {
    if (typeof rawStatus !== 'string') {
      return next(new AppError('Specialist status must be a string', 400));
    }
    const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'OFF_DUTY'];
    if (!validStatuses.includes(rawStatus.trim().toUpperCase())) {
      return next(new AppError(`Invalid specialist status '${rawStatus}'. Allowed: ${validStatuses.join(', ')}`, 400));
    }
  }

  next();
};
