const mockState = require('../services/mockData');

exports.dispatchResponder = (req, res) => {
  const { incidentId, responderId } = req.body;
  const incident = mockState.incidents.find(i => i.id === incidentId);
  const responder = mockState.responders.find(r => r.id === responderId);

  if (!incident || !responder) {
    return res.status(404).json({ success: false, message: 'Incident or responder not found' });
  }

  responder.status = 'DISPATCHED';
  responder.assignedIncidentId = incident.id;
  responder.etaMinutes = 5;

  incident.status = 'ASSIGNED';
  incident.timeline.push({
    time: new Date().toLocaleTimeString().slice(0, 5),
    title: 'Dispatched',
    description: `Assigned to ${responder.name} (${responder.badgeNumber})`
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('incident:assigned', { incident, responder });
    io.emit('responder:location_updated', responder);
  }

  res.json({
    success: true,
    message: 'Responder successfully dispatched',
    data: { incident, responder }
  });
};
