const mockState = require('../services/mockData');

exports.dispatchResponder = (req, res) => {
  const { incidentId, responderId } = req.body;
  const incident = mockState.incidents.find(i => i.id === incidentId);
  const responder = mockState.responders.find(r => r.id === responderId);

  if (!incident || !responder) {
    return res.status(404).json({ success: false, message: 'Incident or responder not found' });
  }

  if (responder.status === 'DISPATCHED' && responder.assignedIncidentId && responder.assignedIncidentId !== incident.id) {
    return res.status(400).json({
      success: false,
      message: `Unit ${responder.name} (${responder.badgeNumber}) is currently assigned to Incident #${responder.assignedIncidentId}`
    });
  }

  responder.status = 'DISPATCHED';
  responder.assignedIncidentId = incident.id;
  responder.etaMinutes = responder.etaMinutes || 5;

  incident.status = 'ASSIGNED';
  incident.timeline.push({
    time: new Date().toLocaleTimeString().slice(0, 5),
    title: 'Dispatched',
    description: `Assigned to ${responder.name} (${responder.badgeNumber})`
  });

  const newAudit = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    user: req.user?.name || 'Dispatcher Davis',
    action: 'RESPONDER_DISPATCHED',
    entity: `Incident #${incident.id}`,
    details: `Dispatched ${responder.name} (${responder.badgeNumber}) - ETA 5m`,
    time: new Date().toLocaleTimeString().slice(0, 8)
  };
  mockState.auditLogs.unshift(newAudit);

  const io = req.app.get('io');
  if (io) {
    io.emit('incident:assigned', { incident, responder });
    io.emit('responder:location_updated', responder);
    io.emit('audit:created', newAudit);
  }

  res.json({
    success: true,
    message: 'Responder successfully dispatched',
    data: { incident, responder }
  });
};
