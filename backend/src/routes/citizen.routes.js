const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

router.get('/my-reports', (req, res) => {
  res.json({ success: true, count: mockState.incidents.length, data: mockState.incidents });
});

router.get('/family-safety', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'FAM-01', name: 'Father (Ramesh Sundaram)', relationship: 'Father', status: 'SAFE', location: 'City Memorial Stadium Shelter', time: '10:34' },
      { id: 'FAM-02', name: 'Mother (Kavitha Sundaram)', relationship: 'Mother', status: 'INJURED', location: 'Metro General Hospital Triage', time: '10:39' },
      { id: 'FAM-03', name: 'Brother (Sanjay Sundaram)', relationship: 'Brother', status: 'MISSING', location: 'Near Harbour Road Sector 4', time: '10:41' }
    ]
  });
});

module.exports = router;
