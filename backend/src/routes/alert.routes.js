const express = require('express');
const router = express.Router();

const alerts = [
  { id: 'ALT-01', title: '⚠️ FLASH FLOOD ALERT', message: 'Riverbank South district experiencing sudden surge. Lowland evacuation active.', severity: 'CRITICAL', district: 'Riverbank South', time: '10:10' },
  { id: 'ALT-02', title: '⚠️ TOXIC FUME ADVISORY', message: 'North Industrial gate perimeter closed. Stay indoors with sealed windows.', severity: 'HIGH', district: 'North Industrial', time: '10:18' }
];

router.get('/', (req, res) => {
  res.json({ success: true, count: alerts.length, data: alerts });
});

router.post('/broadcast', (req, res) => {
  const { title, message, severity, district } = req.body;
  const newAlert = {
    id: `ALT-${Date.now().toString().slice(-4)}`,
    title: title || '⚠️ EMERGENCY BROADCAST',
    message: message || 'Please follow official safety guidelines.',
    severity: severity || 'HIGH',
    district: district || 'All Districts',
    time: new Date().toLocaleTimeString().slice(0, 5)
  };
  alerts.unshift(newAlert);

  const io = req.app.get('io');
  if (io) io.emit('alert:created', newAlert);

  res.status(201).json({ success: true, data: newAlert });
});

module.exports = router;
