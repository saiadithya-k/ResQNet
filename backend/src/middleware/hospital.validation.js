const { AppError } = require('../utils/errors');

/**
 * Validate Hospital Creation
 */
exports.validateCreateHospital = (req, res, next) => {
  const name = req.body.hospitalName || req.body.name;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Hospital name is required and must be a non-empty string', 400));
  }

  if (req.body.latitude !== undefined && req.body.latitude !== null) {
    const lat = Number(req.body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90 || typeof req.body.latitude === 'boolean') {
      return next(new AppError('Invalid latitude. Must be a number between -90 and 90 degrees', 400));
    }
    req.body.latitude = lat;
  }

  if (req.body.longitude !== undefined && req.body.longitude !== null) {
    const lon = Number(req.body.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180 || typeof req.body.longitude === 'boolean') {
      return next(new AppError('Invalid longitude. Must be a number between -180 and 180 degrees', 400));
    }
    req.body.longitude = lon;
  }

  req.body.hospitalName = name.trim();
  next();
};

/**
 * Validate Hospital Updates
 */
exports.validateUpdateHospital = (req, res, next) => {
  const name = req.body.hospitalName || req.body.name;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return next(new AppError('Hospital name must be a non-empty string', 400));
    }
    req.body.hospitalName = name.trim();
  }

  if (req.body.latitude !== undefined && req.body.latitude !== null) {
    const lat = Number(req.body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90 || typeof req.body.latitude === 'boolean') {
      return next(new AppError('Invalid latitude. Must be a number between -90 and 90 degrees', 400));
    }
    req.body.latitude = lat;
  }

  if (req.body.longitude !== undefined && req.body.longitude !== null) {
    const lon = Number(req.body.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180 || typeof req.body.longitude === 'boolean') {
      return next(new AppError('Invalid longitude. Must be a number between -180 and 180 degrees', 400));
    }
    req.body.longitude = lon;
  }

  next();
};

/**
 * Validate Hospital Capacity Updates
 */
exports.validateCapacityUpdate = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Capacity update payload cannot be empty', 400));
  }

  const intFields = [
    'totalBeds',
    'availableBeds',
    'totalIcu',
    'totalICUBeds',
    'availableIcu',
    'availableICUBeds',
    'totalTrauma',
    'availableTrauma',
    'ventilators',
    'operatingRooms'
  ];

  for (const field of intFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      const val = req.body[field];

      if (typeof val === 'boolean' || isNaN(Number(val))) {
        return next(new AppError(`${field} must be a valid integer`, 400));
      }

      const num = Number(val);

      if (!Number.isInteger(num)) {
        return next(new AppError(`${field} must be an integer, fractional numbers are not allowed`, 400));
      }

      if (num < 0) {
        return next(new AppError(`${field} cannot be negative`, 400));
      }

      req.body[field] = num;
    }
  }

  // Check invariants if both total and available values are present in the request
  const totalBeds = req.body.totalBeds;
  const availBeds = req.body.availableBeds;
  if (totalBeds !== undefined && availBeds !== undefined && availBeds > totalBeds) {
    return next(new AppError('Available beds cannot exceed total beds', 400));
  }

  const totalIcu = req.body.totalIcu !== undefined ? req.body.totalIcu : req.body.totalICUBeds;
  const availIcu = req.body.availableIcu !== undefined ? req.body.availableIcu : req.body.availableICUBeds;
  if (totalIcu !== undefined && availIcu !== undefined && availIcu > totalIcu) {
    return next(new AppError('Available ICU beds cannot exceed total ICU beds', 400));
  }

  if (totalBeds !== undefined && totalIcu !== undefined && totalIcu > totalBeds) {
    return next(new AppError('Total ICU beds cannot exceed total hospital beds', 400));
  }

  const totalTrauma = req.body.totalTrauma;
  const availTrauma = req.body.availableTrauma;
  if (totalTrauma !== undefined && availTrauma !== undefined && availTrauma > totalTrauma) {
    return next(new AppError('Available trauma beds cannot exceed total trauma beds', 400));
  }

  next();
};

/**
 * Validate Hospital Matching Parameters
 */
exports.validateHospitalMatchParams = (req, res, next) => {
  const { incidentId } = req.params;

  if (!incidentId || typeof incidentId !== 'string' || incidentId.trim() === '') {
    return next(new AppError('Incident ID is required as a non-empty string', 400));
  }

  // Reject malformed UUID / ID if passed weirdly
  if (incidentId.trim().length < 3) {
    return next(new AppError('Invalid incident ID format', 400));
  }

  next();
};
