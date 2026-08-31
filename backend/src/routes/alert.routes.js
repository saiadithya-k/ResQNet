const express = require('express');
const router = express.Router();

const alerts = [
  {
    id: 'ALT-101',
    title: 'FLASH FLOOD & INUNDATION WARNING',
    category: 'FLOOD WARNING',
    severity: 'CRITICAL',
    affectedArea: 'Riverbank South Sector 3 & Lowland Pocket',
    district: 'Riverbank South',
    issuedTime: '10:10 AM',
    updatedTime: '10:35 AM',
    message: 'Rapid river surge exceeding danger mark by 1.8 meters. Ground floor structures at severe risk of flooding.',
    recommendedAction: 'Move to higher ground immediately or proceed to City Memorial Stadium Shelter. Avoid low-lying underpasses and river banks.',
    status: 'ACTIVE',
    latitude: 13.0550,
    longitude: 80.2400,
    radiusKm: 2.5
  },
  {
    id: 'ALT-102',
    title: 'TOXIC CHEMICAL VAPOR ADVISORY',
    category: 'HAZMAT WARNING',
    severity: 'HIGH',
    affectedArea: 'North Industrial Sector, Gate 2 to 6 Perimeter',
    district: 'North Industrial',
    issuedTime: '10:18 AM',
    updatedTime: '10:40 AM',
    message: 'Solvent vapor leak detected following secondary explosion. Dense plume drifting south-east with prevailing winds.',
    recommendedAction: 'Stay indoors, close all windows and shut off air ventilation units. Wear wet cloth masks if outdoors.',
    status: 'ACTIVE',
    latitude: 13.0901,
    longitude: 80.2520,
    radiusKm: 1.8
  },
  {
    id: 'ALT-103',
    title: 'COASTAL STORM SURGE & HIGH WINDS',
    category: 'SEVERE WEATHER',
    severity: 'MEDIUM',
    affectedArea: 'East Coastal Belt & Harbour Corridors',
    district: 'Harbour Zone',
    issuedTime: '09:45 AM',
    updatedTime: '10:15 AM',
    message: 'Wind gusts reaching 65 km/h. Sea swells active along shoreline roads.',
    recommendedAction: 'Fishermen and coastal residents avoid shoreline. Secure loose outdoor fixtures and avoid parking under large trees.',
    status: 'ACTIVE',
    latitude: 13.0827,
    longitude: 80.2707,
    radiusKm: 4.0
  }
];

const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/', (req, res) => {
  const { status, severity } = req.query;
  let results = [...alerts];
  if (status) results = results.filter(a => a.status === status);
  if (severity) results = results.filter(a => a.severity === severity);
  res.json({ success: true, count: results.length, data: results });
});

router.get('/:id', (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ success: false, message: 'Public disaster alert not found' });
  }
  res.json({ success: true, data: alert });
});

router.post('/broadcast', authMiddleware, roleMiddleware('ADMIN', 'DISPATCHER'), (req, res) => {
  const { title, category, message, severity, district, affectedArea, recommendedAction, latitude, longitude } = req.body;
  const newAlert = {
    id: `ALT-${104 + alerts.length}`,
    title: title || 'EMERGENCY DISASTER BROADCAST',
    category: category || 'DISASTER WARNING',
    severity: severity || 'HIGH',
    affectedArea: affectedArea || district || 'Citywide Emergency Zone',
    district: district || 'Central Zone',
    issuedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    message: message || 'Please follow official safety guidelines and responder instructions.',
    recommendedAction: recommendedAction || 'Follow instructions from civil defense authorities.',
    status: 'ACTIVE',
    latitude: latitude || 13.0827,
    longitude: longitude || 80.2707,
    radiusKm: 2.0
  };
  alerts.unshift(newAlert);

  const io = req.app.get('io');
  if (io) io.emit('alert:created', newAlert);

  res.status(201).json({ success: true, data: newAlert });
});

module.exports = router;

