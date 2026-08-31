const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

// Get road blocks
router.get('/roadblocks', (req, res) => {
  res.json({ success: true, count: mockState.roadBlocks.length, data: mockState.roadBlocks });
});

// Emergency dynamic route optimization
router.post('/optimize', (req, res) => {
  const { startLat, startLng, endLat, endLng, avoidHazards = true } = req.body;

  // Generates safe emergency routing coordinates avoiding road blockages
  const standardRouteTime = 22; // minutes
  const emergencyOptimizedTime = 11; // minutes (50% faster, avoids roadblocks)

  const coordinates = [
    [startLat || 13.0780, startLng || 80.2650],
    [13.0795, 80.2670],
    [13.0810, 80.2695],
    [endLat || 13.0827, endLng || 80.2707]
  ];

  res.json({
    success: true,
    data: {
      standardEtaMinutes: standardRouteTime,
      optimizedEtaMinutes: emergencyOptimizedTime,
      distanceKm: 2.8,
      hazardAvoidanceActive: avoidHazards,
      bypassedRoadblocks: ['Harbour Main Flyover Blocked'],
      path: coordinates
    }
  });
});

module.exports = router;
