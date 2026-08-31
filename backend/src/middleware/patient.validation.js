const { AppError } = require('../utils/errors');

const ALLOWED_STATUSES = ['EXPECTED', 'ARRIVED', 'CHECKED_IN', 'ADMITTED', 'CANCELLED'];
const ALLOWED_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Validate Patient Creation
 */
exports.validateCreatePatient = (req, res, next) => {
  const { age, gender, triageSeverity, status } = req.body;

  if (age !== undefined && age !== null) {
    const parsedAge = Number(age);
    if (isNaN(parsedAge) || typeof age === 'boolean' || parsedAge < 0 || parsedAge > 150 || !Number.isInteger(parsedAge)) {
      return next(new AppError('Age must be an integer between 0 and 150', 400));
    }
  }

  if (gender !== undefined && gender !== null) {
    if (typeof gender !== 'string' || !ALLOWED_GENDERS.includes(gender.trim().toUpperCase())) {
      return next(new AppError(`Invalid gender. Allowed: ${ALLOWED_GENDERS.join(', ')}`, 400));
    }
  }

  if (triageSeverity !== undefined && triageSeverity !== null) {
    if (typeof triageSeverity !== 'string' || !ALLOWED_SEVERITIES.includes(triageSeverity.trim().toUpperCase())) {
      return next(new AppError(`Invalid triageSeverity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}`, 400));
    }
  }

  if (status !== undefined && status !== null) {
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status.trim().toUpperCase())) {
      return next(new AppError(`Invalid patient status '${status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400));
    }
  }

  next();
};

/**
 * Validate Patient Update
 */
exports.validateUpdatePatient = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Update payload cannot be empty', 400));
  }

  const { age, gender, triageSeverity, status } = req.body;

  if (status !== undefined) {
    return next(new AppError('Status updates must use PATCH /status endpoint to ensure lifecycle transitions', 400));
  }

  if (age !== undefined && age !== null) {
    const parsedAge = Number(age);
    if (isNaN(parsedAge) || typeof age === 'boolean' || parsedAge < 0 || parsedAge > 150 || !Number.isInteger(parsedAge)) {
      return next(new AppError('Age must be an integer between 0 and 150', 400));
    }
  }

  if (gender !== undefined && gender !== null) {
    if (typeof gender !== 'string' || !ALLOWED_GENDERS.includes(gender.trim().toUpperCase())) {
      return next(new AppError(`Invalid gender. Allowed: ${ALLOWED_GENDERS.join(', ')}`, 400));
    }
  }

  if (triageSeverity !== undefined && triageSeverity !== null) {
    if (typeof triageSeverity !== 'string' || !ALLOWED_SEVERITIES.includes(triageSeverity.trim().toUpperCase())) {
      return next(new AppError(`Invalid triageSeverity. Allowed: ${ALLOWED_SEVERITIES.join(', ')}`, 400));
    }
  }

  next();
};

/**
 * Validate Status Transition Request
 */
exports.validateUpdatePatientStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return next(new AppError('Status is required as a non-empty string', 400));
  }

  if (!ALLOWED_STATUSES.includes(status.trim().toUpperCase())) {
    return next(new AppError(`Invalid patient status '${status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400));
  }

  next();
};
