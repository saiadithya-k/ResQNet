const express = require('express');
const router = express.Router();

router.get('/risk-zones', (req, res) => {
  res.json({
    success: true,
    data: [
      { district: 'Riverbank South', riskType: 'FLOOD_SURGE', riskScore: 84, crowdSurgeRisk: 'LOW', weatherSeverity: 'HEAVY_RAIN' },
      { district: 'North Industrial', riskType: 'HAZMAT_DISPERSION', riskScore: 78, crowdSurgeRisk: 'MEDIUM', weatherSeverity: 'WIND_18KTS' },
      { district: 'Central Zone', riskType: 'STRUCTURAL_SECONDARY_COLLAPSE', riskScore: 68, crowdSurgeRisk: 'HIGH', weatherSeverity: 'NORMAL' }
    ]
  });
});

module.exports = router;
