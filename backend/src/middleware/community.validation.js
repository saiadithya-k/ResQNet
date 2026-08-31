const { AppError } = require('../utils/errors');

/**
 * Validate Community Responder Registration
 */
exports.validateRegisterCommunityResponder = (req, res, next) => {
  const { email, userId, role } = req.body;

  if (!email && !userId) {
    return next(new AppError('Either email or userId is required to register as a community responder', 400));
  }

  if (role && ['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
    return next(new AppError('Unauthorized role escalation. Cannot register with administrative privileges.', 403));
  }

  next();
};

/**
 * Validate Availability Updates
 */
exports.validateAvailability = (req, res, next) => {
  const { isAvailable, status } = req.body;

  if (isAvailable === undefined && status === undefined) {
    return next(new AppError('isAvailable (boolean) or status (AVAILABLE/UNAVAILABLE) is required', 400));
  }

  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
    return next(new AppError('isAvailable must be a boolean (true or false)', 400));
  }

  if (status !== undefined && !['AVAILABLE', 'UNAVAILABLE', 'OFF_DUTY'].includes(status)) {
    return next(new AppError('status must be AVAILABLE or UNAVAILABLE', 400));
  }

  next();
};

/**
 * Validate Community GPS Location
 */
exports.validateCommunityLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return next(new AppError('Both latitude and longitude are required', 400));
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return next(new AppError('Invalid latitude. Must be between -90 and 90 degrees', 400));
  }

  if (isNaN(lon) || lon < -180 || lon > 180) {
    return next(new AppError('Invalid longitude. Must be between -180 and 180 degrees', 400));
  }

  req.body.latitude = lat;
  req.body.longitude = lon;
  next();
};

/**
 * Validate Task Acceptance
 */
exports.validateAcceptTask = (req, res, next) => {
  const incidentId = req.body.incidentId || req.body.taskId;

  if (!incidentId || typeof incidentId !== 'string' || incidentId.trim() === '') {
    return next(new AppError('incidentId or taskId is required as a non-empty string', 400));
  }

  req.body.incidentId = incidentId.trim();
  next();
};

/**
 * Validate Task Status Updates
 */
exports.validateTaskStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return next(new AppError('status is required as a string', 400));
  }

  const validStatuses = ['EN_ROUTE', 'ON_SCENE', 'COMPLETED', 'CANCELLED', 'UNAVAILABLE'];
  if (!validStatuses.includes(status.trim().toUpperCase())) {
    return next(new AppError(`Invalid task status. Allowed: ${validStatuses.join(', ')}`, 400));
  }

  req.body.status = status.trim().toUpperCase();
  next();
};
