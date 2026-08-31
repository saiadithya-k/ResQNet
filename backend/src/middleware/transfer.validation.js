const { AppError } = require('../utils/errors');

const VALID_TRANSFER_TARGET_STATUSES = ['IN_TRANSIT', 'DELIVERED', 'RECEIVED', 'CANCELLED'];

/**
 * Validate Transfer Status Transition
 */
exports.validateUpdateTransferStatus = (req, res, next) => {
  const { status, actingHospitalId } = req.body;

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return next(new AppError('Target transfer status is required', 400));
  }

  const st = status.trim().toUpperCase();
  if (!VALID_TRANSFER_TARGET_STATUSES.includes(st)) {
    return next(
      new AppError(
        `Invalid transfer status '${status}'. Allowed: ${VALID_TRANSFER_TARGET_STATUSES.join(', ')}`,
        400
      )
    );
  }

  req.body.status = st;
  if (actingHospitalId) req.body.actingHospitalId = String(actingHospitalId).trim();

  next();
};
