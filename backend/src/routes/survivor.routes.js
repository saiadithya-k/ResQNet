const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

router.get('/checkins', (req, res) => {
  res.json({ success: true, count: mockState.survivorCheckins.length, data: mockState.survivorCheckins });
});

router.post('/checkin', (req, res) => {
  const { fullName, phone, status, district, shelterName } = req.body;
  const newCheckin = {
    id: `SURV-${Date.now().toString().slice(-4)}`,
    fullName: fullName || 'Anonymous Citizen',
    phone: phone || '',
    status: status || 'SAFE',
    district: district || 'Central Zone',
    shelterName: shelterName || 'Self / Family Home',
    time: new Date().toLocaleTimeString().slice(0, 5)
  };
  mockState.survivorCheckins.unshift(newCheckin);

  const io = req.app.get('io');
  if (io) io.emit('survivor:checkin', newCheckin);

  res.status(201).json({ success: true, data: newCheckin });
});

module.exports = router;
