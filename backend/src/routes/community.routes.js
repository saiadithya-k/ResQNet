const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

router.get('/mesh', (req, res) => {
  const communityResponders = mockState.responders.filter(r => r.isCommunity);
  res.json({ success: true, count: communityResponders.length, data: communityResponders });
});

router.post('/checkin', (req, res) => {
  const { responderId, incidentId, status } = req.body;
  const responder = mockState.responders.find(r => r.id === responderId);
  if (responder) {
    responder.status = status || 'ON_SCENE';
    responder.assignedIncidentId = incidentId;
  }
  res.json({ success: true, message: 'Community responder checked in on scene', data: responder });
});

module.exports = router;
