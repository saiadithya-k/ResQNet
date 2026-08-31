const { AppError } = require('../utils/errors');

const VALID_COORDINATION_STATUSES = ['REQUESTED', 'OFFERED', 'APPROVED', 'REJECTED', 'CANCELLED'];

/**
 * Validate Coordination Request Creation
 */
exports.validateCreateCoordinationRequest = (req, res, next) => {
  const { resourceId, toHospitalId, destinationHospitalId, requestingHospitalId, quantity, notes, reason } = req.body;

  if (!resourceId || typeof resourceId !== 'string' || resourceId.trim() === '') {
    return next(new AppError('Resource ID is required and must be a non-empty string', 400));
  }

  const destHosp = toHospitalId || destinationHospitalId || requestingHospitalId;
  if (!destHosp || typeof destHosp !== 'string' || destHosp.trim() === '') {
    return next(new AppError('Destination hospital ID is required and must be a non-empty string', 400));
  }

  if (quantity === undefined || quantity === null) {
    return next(new AppError('Requested quantity is required', 400));
  }

  const q = Number(quantity);
  if (typeof quantity === 'boolean' || isNaN(q) || !Number.isInteger(q) || q <= 0) {
    return next(new AppError('Requested quantity must be a positive integer', 400));
  }

  req.body.resourceId = resourceId.trim();
  req.body.toHospitalId = destHosp.trim();
  req.body.quantity = q;
  if (notes) req.body.notes = String(notes).trim();
  if (reason) req.body.reason = String(reason).trim();

  next();
};

/**
 * Validate Coordination Status Update
 */
exports.validateUpdateCoordinationStatus = (req, res, next) => {
  const { status, reason, actingHospitalId } = req.body;

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return next(new AppError('Target coordination status is required', 400));
  }

  const st = status.trim().toUpperCase();
  if (!VALID_COORDINATION_STATUSES.includes(st)) {
    return next(new AppError(`Invalid coordination status '${status}'. Allowed: ${VALID_COORDINATION_STATUSES.join(', ')}`, 400));
  }

  req.body.status = st;
  if (reason) req.body.reason = String(reason).trim();
  if (actingHospitalId) req.body.actingHospitalId = String(actingHospitalId).trim();

  next();
};
