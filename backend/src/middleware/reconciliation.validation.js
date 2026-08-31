const { AppError } = require('../utils/errors');

/**
 * Validate Reconcile Transfer Request
 */
exports.validateReconcileTransfer = (req, res, next) => {
  const { actualQuantity, notes, actingHospitalId } = req.body;

  if (actualQuantity !== undefined && actualQuantity !== null) {
    const raw = Number(actualQuantity);
    if (typeof actualQuantity === 'boolean' || isNaN(raw) || !Number.isInteger(raw) || raw < 0) {
      return next(new AppError('Actual quantity must be a non-negative integer', 400));
    }
    req.body.actualQuantity = raw;
  }

  if (notes) req.body.notes = String(notes).trim();
  if (actingHospitalId) req.body.actingHospitalId = String(actingHospitalId).trim();

  next();
};

/**
 * Validate Resolve Discrepancy Request
 */
exports.validateResolveDiscrepancy = (req, res, next) => {
  const { reason, resolutionReason, notes, resolvedBy, actingHospitalId } = req.body;

  const resReason = reason || resolutionReason;
  if (!resReason || typeof resReason !== 'string' || resReason.trim() === '') {
    return next(new AppError('Resolution reason is required and must be a non-empty string', 400));
  }

  req.body.resolutionReason = resReason.trim();
  if (notes) req.body.notes = String(notes).trim();
  if (resolvedBy) req.body.resolvedBy = String(resolvedBy).trim();
  if (actingHospitalId) req.body.actingHospitalId = String(actingHospitalId).trim();

  next();
};
