const { AppError } = require('../utils/errors');

const VALID_STATUSES = [
  'AVAILABLE',
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SCENE',
  'TRANSPORTING',
  'UNAVAILABLE',
  'OFF_DUTY'
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate responder creation payload
 */
exports.validateCreateResponder = (req, res, next) => {
  const { name, email, responderType, type, badgeNumber, skills, equipment, status, phone } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Name is required and must be a non-empty string', 400));
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return next(new AppError('A valid email address is required', 400));
  }

  const effectiveType = responderType || type;
  if (!effectiveType || typeof effectiveType !== 'string' || effectiveType.trim() === '') {
    return next(new AppError('Responder type is required and must be a non-empty string', 400));
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
  }

  if (badgeNumber !== undefined && (typeof badgeNumber !== 'string' || badgeNumber.trim() === '')) {
    return next(new AppError('Badge number must be a non-empty string if provided', 400));
  }

  if (skills !== undefined && (!Array.isArray(skills) || !skills.every(s => typeof s === 'string'))) {
    return next(new AppError('Skills must be an array of strings', 400));
  }

  if (equipment !== undefined && (!Array.isArray(equipment) || !equipment.every(e => typeof e === 'string'))) {
    return next(new AppError('Equipment must be an array of strings', 400));
  }

  if (phone !== undefined && typeof phone !== 'string') {
    return next(new AppError('Phone must be a string if provided', 400));
  }

  next();
};

/**
 * Validate responder update payload
 */
exports.validateUpdateResponder = (req, res, next) => {
  const { name, email, responderType, type, badgeNumber, skills, equipment, status, phone } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return next(new AppError('Name must be a non-empty string', 400));
  }

  if (email !== undefined && (typeof email !== 'string' || !emailRegex.test(email.trim()))) {
    return next(new AppError('Email must be a valid email format', 400));
  }

  const effectiveType = responderType || type;
  if (effectiveType !== undefined && (typeof effectiveType !== 'string' || effectiveType.trim() === '')) {
    return next(new AppError('Responder type must be a non-empty string', 400));
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
  }

  if (badgeNumber !== undefined && (typeof badgeNumber !== 'string' || badgeNumber.trim() === '')) {
    return next(new AppError('Badge number must be a valid string', 400));
  }

  if (skills !== undefined && (!Array.isArray(skills) || !skills.every(s => typeof s === 'string'))) {
    return next(new AppError('Skills must be an array of strings', 400));
  }

  if (equipment !== undefined && (!Array.isArray(equipment) || !equipment.every(e => typeof e === 'string'))) {
    return next(new AppError('Equipment must be an array of strings', 400));
  }

  if (phone !== undefined && typeof phone !== 'string') {
    return next(new AppError('Phone must be a string', 400));
  }

  next();
};

/**
 * Validate responder status update payload
 */
exports.validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;

  if (status === undefined || status === null || typeof status !== 'string' || status.trim() === '') {
    return next(new AppError('Status is required and must be a non-empty string', 400));
  }

  const targetStatus = status.trim();
  if (!VALID_STATUSES.includes(targetStatus)) {
    return next(new AppError(`Invalid status '${targetStatus}'. Must be one of: ${VALID_STATUSES.join(', ')}`, 400));
  }

  next();
};

/**
 * Validate responder GPS location update payload
 */
exports.validateUpdateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || latitude === null || latitude === '') {
    return next(new AppError('Latitude is required', 400));
  }

  if (longitude === undefined || longitude === null || longitude === '') {
    return next(new AppError('Longitude is required', 400));
  }

  const lat = Number(latitude);
  if (isNaN(lat) || typeof latitude === 'boolean' || (typeof latitude === 'object' && latitude !== null)) {
    return next(new AppError('Latitude must be a valid numeric coordinate', 400));
  }

  const lng = Number(longitude);
  if (isNaN(lng) || typeof longitude === 'boolean' || (typeof longitude === 'object' && longitude !== null)) {
    return next(new AppError('Longitude must be a valid numeric coordinate', 400));
  }

  if (lat < -90 || lat > 90) {
    return next(new AppError('Latitude must be between -90 and 90 degrees', 400));
  }

  if (lng < -180 || lng > 180) {
    return next(new AppError('Longitude must be between -180 and 180 degrees', 400));
  }

  req.body.latitude = lat;
  req.body.longitude = lng;

  next();
};

/**
 * Validate adding a single skill
 */
exports.validateAddSkill = (req, res, next) => {
  const { skill } = req.body;

  if (skill === undefined || skill === null || typeof skill !== 'string' || skill.trim() === '') {
    return next(new AppError('Skill is required and must be a non-empty string', 400));
  }

  req.body.skill = skill.trim();
  next();
};

/**
 * Validate updating entire skills collection
 */
exports.validateUpdateSkills = (req, res, next) => {
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    return next(new AppError('Skills must be provided as an array of strings', 400));
  }

  for (const s of skills) {
    if (typeof s !== 'string' || s.trim() === '') {
      return next(new AppError('Each skill item must be a non-empty string', 400));
    }
  }

  next();
};

/**
 * Validate certification creation
 */
exports.validateCreateCertification = (req, res, next) => {
  const { name, issuedDate, expiryDate, issuingOrg, certificateNumber, isVerified } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Certification name is required and must be a non-empty string', 400));
  }

  if (issuedDate !== undefined && issuedDate !== null && issuedDate !== '') {
    const d = new Date(issuedDate);
    if (isNaN(d.getTime())) {
      return next(new AppError('Invalid issuedDate format. Must be a valid date', 400));
    }
  }

  if (expiryDate !== undefined && expiryDate !== null && expiryDate !== '') {
    const d = new Date(expiryDate);
    if (isNaN(d.getTime())) {
      return next(new AppError('Invalid expiryDate format. Must be a valid date', 400));
    }
  }

  if (issuedDate && expiryDate) {
    const iDate = new Date(issuedDate);
    const eDate = new Date(expiryDate);
    if (!isNaN(iDate.getTime()) && !isNaN(eDate.getTime()) && eDate < iDate) {
      return next(new AppError('Expiry date cannot be earlier than issue date', 400));
    }
  }

  if (issuingOrg !== undefined && typeof issuingOrg !== 'string') {
    return next(new AppError('issuingOrg must be a string', 400));
  }

  if (certificateNumber !== undefined && typeof certificateNumber !== 'string') {
    return next(new AppError('certificateNumber must be a string', 400));
  }

  next();
};

/**
 * Validate certification update
 */
exports.validateUpdateCertification = (req, res, next) => {
  const { name, issuedDate, expiryDate, issuingOrg, certificateNumber, isVerified } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return next(new AppError('Certification name must be a non-empty string', 400));
  }

  if (issuedDate !== undefined && issuedDate !== null && issuedDate !== '') {
    const d = new Date(issuedDate);
    if (isNaN(d.getTime())) {
      return next(new AppError('Invalid issuedDate format. Must be a valid date', 400));
    }
  }

  if (expiryDate !== undefined && expiryDate !== null && expiryDate !== '') {
    const d = new Date(expiryDate);
    if (isNaN(d.getTime())) {
      return next(new AppError('Invalid expiryDate format. Must be a valid date', 400));
    }
  }

  if (issuedDate && expiryDate) {
    const iDate = new Date(issuedDate);
    const eDate = new Date(expiryDate);
    if (!isNaN(iDate.getTime()) && !isNaN(eDate.getTime()) && eDate < iDate) {
      return next(new AppError('Expiry date cannot be earlier than issue date', 400));
    }
  }

  if (issuingOrg !== undefined && typeof issuingOrg !== 'string') {
    return next(new AppError('issuingOrg must be a string', 400));
  }

  if (certificateNumber !== undefined && typeof certificateNumber !== 'string') {
    return next(new AppError('certificateNumber must be a string', 400));
  }

  next();
};

/**
 * Validate adding a single equipment item
 */
exports.validateAddEquipment = (req, res, next) => {
  const item = req.body.equipment || req.body.item;

  if (item === undefined || item === null || typeof item !== 'string' || item.trim() === '') {
    return next(new AppError('Equipment item is required and must be a non-empty string', 400));
  }

  req.body.equipment = item.trim();
  req.body.item = item.trim();
  next();
};

/**
 * Validate updating entire equipment collection
 */
exports.validateUpdateEquipment = (req, res, next) => {
  const items = req.body.equipment || req.body.items;

  if (!Array.isArray(items)) {
    return next(new AppError('Equipment must be provided as an array of strings', 400));
  }

  for (const item of items) {
    if (typeof item !== 'string' || item.trim() === '') {
      return next(new AppError('Each equipment item must be a non-empty string', 400));
    }
  }

  req.body.equipment = items;
  next();
};

/**
 * Validate fatigue recalculation parameters
 */
exports.validateRecalculateFatigue = (req, res, next) => {
  const { dutyHours, consecutiveShifts, incidentsCount } = req.body;

  if (dutyHours !== undefined && dutyHours !== null) {
    const num = Number(dutyHours);
    if (isNaN(num) || num < 0 || typeof dutyHours === 'boolean') {
      return next(new AppError('dutyHours must be a non-negative number', 400));
    }
  }

  if (consecutiveShifts !== undefined && consecutiveShifts !== null) {
    const num = Number(consecutiveShifts);
    if (isNaN(num) || num < 0 || typeof consecutiveShifts === 'boolean') {
      return next(new AppError('consecutiveShifts must be a non-negative number', 400));
    }
  }

  if (incidentsCount !== undefined && incidentsCount !== null) {
    const num = Number(incidentsCount);
    if (isNaN(num) || num < 0 || typeof incidentsCount === 'boolean') {
      return next(new AppError('incidentsCount must be a non-negative number', 400));
    }
  }

  next();
};

/**
 * Validate fatigue snapshot record parameters
 */
exports.validateRecordFatigue = (req, res, next) => {
  const { hoursActive, incidentsCount } = req.body;

  if (hoursActive !== undefined && hoursActive !== null) {
    const num = Number(hoursActive);
    if (isNaN(num) || num < 0 || typeof hoursActive === 'boolean') {
      return next(new AppError('hoursActive must be a non-negative number', 400));
    }
  }

  if (incidentsCount !== undefined && incidentsCount !== null) {
    const num = Number(incidentsCount);
    if (isNaN(num) || num < 0 || typeof incidentsCount === 'boolean') {
      return next(new AppError('incidentsCount must be a non-negative number', 400));
    }
  }

  next();
};
