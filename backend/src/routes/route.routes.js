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

  const sLat = Number(startLat) || 13.0780;
  const sLng = Number(startLng) || 80.2650;
  const eLat = Number(endLat) || 13.0827;
  const eLng = Number(endLng) || 80.2707;

  // Calculate straight-line distance
  const latDiff = Math.abs(eLat - sLat) * 111;
  const lngDiff = Math.abs(eLng - sLng) * 111;
  const directDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // Standard congested route (travels directly through Harbour Flyover Roadblock)
  const standardPath = [
    [sLat, sLng],
    [sLat + (eLat - sLat) * 0.3, sLng + (eLng - sLng) * 0.25],
    [13.0800, 80.2680], // Roadblock bottleneck
    [sLat + (eLat - sLat) * 0.75, sLng + (eLng - sLng) * 0.8],
    [eLat, eLng]
  ];
  const standardDistanceKm = parseFloat((directDistance * 1.35).toFixed(1));
  const standardEtaMinutes = Math.max(18, Math.round(standardDistanceKm * 6.5)); // delay through closure

  // Emergency Green Corridor (Bypasses Roadblocks & Flood perimeters)
  const emergencyPath = [
    [sLat, sLng],
    [13.0786, 80.2656],
    [13.0795, 80.2665],
    [13.0808, 80.2678],
    [13.0818, 80.2692],
    [eLat, eLng]
  ];
  const emergencyDistanceKm = parseFloat((directDistance * 1.15).toFixed(1));
  const emergencyEtaMinutes = Math.max(8, Math.round(emergencyDistanceKm * 3.8)); // 50% faster

  res.json({
    success: true,
    data: {
      standardRoute: {
        type: 'STANDARD',
        distanceKm: standardDistanceKm,
        etaMinutes: standardEtaMinutes,
        trafficDelayMinutes: standardEtaMinutes - emergencyEtaMinutes,
        path: standardPath,
        warning: 'Passes through active roadblock on Harbour Flyover'
      },
      emergencyRoute: {
        type: 'EMERGENCY',
        distanceKm: emergencyDistanceKm,
        etaMinutes: emergencyEtaMinutes,
        path: emergencyPath,
        bypassedRoadblocks: ['Harbour Main Flyover Blocked'],
        corridorActive: true
      },
      activeType: avoidHazards ? 'EMERGENCY' : 'STANDARD'
    }
  });
});

module.exports = router;
