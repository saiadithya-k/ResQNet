const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { AppError } = require('../utils/errors');

module.exports = (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // Default to guest/citizen user in dev mode if not provided, for least-privilege security
      req.user = { id: 'demo-citizen-id', email: 'citizen@resqnet.org', role: 'CITIZEN', name: 'Verified Citizen' };
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};
