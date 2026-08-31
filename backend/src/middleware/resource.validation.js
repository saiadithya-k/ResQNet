const { AppError } = require('../utils/errors');

const VALID_STATUSES = ['AVAILABLE', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'DEPLOYED', 'RETURNED'];

/**
 * Validate Resource Creation
 */
exports.validateCreateResource = (req, res, next) => {
  const { name, category, type, quantity, availableQty, status } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Resource name is required and must be a non-empty string', 400));
  }

  const catVal = category || type;
  if (!catVal || typeof catVal !== 'string' || catVal.trim() === '') {
    return next(new AppError('Resource category is required and must be a non-empty string', 400));
  }

  let totalQty = 1;
  if (quantity !== undefined && quantity !== null) {
    const q = Number(quantity);
    if (typeof quantity === 'boolean' || isNaN(q) || !Number.isInteger(q) || q < 0) {
      return next(new AppError('Quantity must be a non-negative integer', 400));
    }
    totalQty = q;
    req.body.quantity = totalQty;
  }

  if (availableQty !== undefined && availableQty !== null) {
    const a = Number(availableQty);
    if (typeof availableQty === 'boolean' || isNaN(a) || !Number.isInteger(a) || a < 0) {
      return next(new AppError('Available quantity must be a non-negative integer', 400));
    }
    if (a > totalQty) {
      return next(new AppError('Available quantity cannot exceed total quantity', 400));
    }
    req.body.availableQty = a;
  }

  if (status !== undefined && status !== null) {
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status.trim().toUpperCase())) {
      return next(new AppError(`Invalid resource status '${status}'. Allowed: ${VALID_STATUSES.join(', ')}`, 400));
    }
  }

  req.body.name = name.trim();
  req.body.category = catVal.trim().toUpperCase();
  next();
};

/**
 * Validate Resource Update
 */
exports.validateUpdateResource = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Update payload cannot be empty', 400));
  }

  const { name, category, type, quantity, availableQty, status, hospitalId } = req.body;

  if (hospitalId !== undefined) {
    return next(new AppError('Modifying hospital ownership is not permitted', 400));
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return next(new AppError('Resource name must be a non-empty string', 400));
    }
    req.body.name = name.trim();
  }

  const catVal = category || type;
  if (catVal !== undefined) {
    if (typeof catVal !== 'string' || catVal.trim() === '') {
      return next(new AppError('Resource category must be a non-empty string', 400));
    }
    req.body.category = catVal.trim().toUpperCase();
  }

  if (quantity !== undefined && quantity !== null) {
    const q = Number(quantity);
    if (typeof quantity === 'boolean' || isNaN(q) || !Number.isInteger(q) || q < 0) {
      return next(new AppError('Quantity must be a non-negative integer', 400));
    }
    req.body.quantity = q;
  }

  if (availableQty !== undefined && availableQty !== null) {
    const a = Number(availableQty);
    if (typeof availableQty === 'boolean' || isNaN(a) || !Number.isInteger(a) || a < 0) {
      return next(new AppError('Available quantity must be a non-negative integer', 400));
    }
    req.body.availableQty = a;
  }

  if (req.body.quantity !== undefined && req.body.availableQty !== undefined) {
    if (req.body.availableQty > req.body.quantity) {
      return next(new AppError('Available quantity cannot exceed total quantity', 400));
    }
  }

  if (status !== undefined && status !== null) {
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status.trim().toUpperCase())) {
      return next(new AppError(`Invalid resource status '${status}'. Allowed: ${VALID_STATUSES.join(', ')}`, 400));
    }
  }

  next();
};
