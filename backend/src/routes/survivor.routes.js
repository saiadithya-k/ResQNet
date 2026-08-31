const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

router.get('/checkins', (req, res) => {
  res.json({ success: true, count: mockState.survivorCheckins.length, data: mockState.survivorCheckins });
});

router.post('/checkin', (req, res) => {
  const { fullName, phone, status, district, shelterName, familyMemberId } = req.body;
  const newCheckin = {
    id: `SURV-${Date.now().toString().slice(-4)}`,
    fullName: fullName || 'Anonymous Citizen',
    phone: phone || '',
    status: status || 'SAFE',
    district: district || 'Central Zone',
    shelterName: shelterName || 'Self / Family Home',
    familyMemberId: familyMemberId || null,
    time: new Date().toLocaleTimeString().slice(0, 5)
  };
  mockState.survivorCheckins.unshift(newCheckin);

  // Update family safety record if match
  if (familyMemberId) {
    const fam = mockState.familyMembers.find(f => f.id === familyMemberId);
    if (fam) {
      fam.status = newCheckin.status;
      fam.location = newCheckin.shelterName;
      fam.time = newCheckin.time;
    }
  } else if (fullName) {
    const fam = mockState.familyMembers.find(f => f.name.toLowerCase().includes(fullName.toLowerCase()));
    if (fam) {
      fam.status = newCheckin.status;
      fam.location = newCheckin.shelterName;
      fam.time = newCheckin.time;
    }
  }

  const io = req.app.get('io');
  if (io) io.emit('survivor:checkin', newCheckin);

  res.status(201).json({ success: true, data: newCheckin });
});

module.exports = router;
