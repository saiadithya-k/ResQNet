const mockState = require('../services/mockData');
const aiService = require('../services/ai/extraction.service');

exports.getAllIncidents = (req, res) => {
  const { status, type, severity } = req.query;
  let results = [...mockState.incidents];
  if (status) results = results.filter(i => i.status === status);
  if (type) results = results.filter(i => i.incidentType === type);
  if (severity) results = results.filter(i => i.severity === severity);

  // Sort by priorityScore descending
  results.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  res.json({ success: true, count: results.length, data: results });
};

exports.getIncidentById = (req, res) => {
  const incident = mockState.incidents.find(i => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }
  res.json({ success: true, data: incident });
};

exports.createIncident = (req, res) => {
  const { title, description, incidentType, latitude, longitude, victimCount, language, mediaUrl } = req.body;

  // AI enrichment
  const aiEnrichment = aiService.extractEmergency(description || title, language || 'en');

  const newIncident = {
    id: `INC-${1045 + mockState.incidents.length}`,
    title: title || `${aiEnrichment.incidentType} Emergency`,
    description: description || 'Reported via ResQNet Citizen Portal',
    incidentType: incidentType || aiEnrichment.incidentType,
    status: 'REPORTED',
    severity: aiEnrichment.severity,
    priorityScore: aiEnrichment.priorityScore,
    latitude: latitude || 13.0827,
    longitude: longitude || 80.2707,
    district: req.body.district || 'Central Zone',
    address: req.body.address || 'Reported GPS Location',
    victimCount: victimCount || aiEnrichment.victimCount,
    hasInjuries: aiEnrichment.hasInjuries,
    hasTrapped: aiEnrichment.hasTrapped,
    hasFire: aiEnrichment.hasFire,
    hasHazmat: aiEnrichment.hasHazmat,
    vulnerableGroups: req.body.vulnerableGroups || [],
    aiEmotionState: aiEnrichment.emotion.state,
    aiEmotionScore: aiEnrichment.emotion.score,
    aiUrgencyScore: aiEnrichment.emotion.score,
    mediaUrl: mediaUrl || null,
    createdAt: new Date().toISOString(),
    timeline: [
      { time: new Date().toLocaleTimeString().slice(0, 5), title: 'Reported', description: 'Submitted by citizen' },
      { time: new Date().toLocaleTimeString().slice(0, 5), title: 'AI Enriched', description: `Priority Score computed: ${aiEnrichment.priorityScore}` }
    ]
  };

  mockState.incidents.unshift(newIncident);

  // Emit real-time event
  const io = req.app.get('io');
  if (io) io.emit('incident:created', newIncident);

  res.status(201).json({ success: true, data: newIncident });
};

exports.updateIncidentStatus = (req, res) => {
  const incident = mockState.incidents.find(i => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Incident not found' });
  }

  const { status, note } = req.body;
  if (status) incident.status = status;

  incident.timeline.push({
    time: new Date().toLocaleTimeString().slice(0, 5),
    title: `Status Updated to ${status}`,
    description: note || 'Updated from Command Center'
  });

  // Dynamic Audit Log Record
  const newAudit = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    user: req.user?.name || 'Command Chief',
    action: `STATUS_CHANGED_${status}`,
    entity: `Incident #${incident.id}`,
    details: note || `State transitioned to ${status}`,
    time: new Date().toLocaleTimeString().slice(0, 8)
  };
  mockState.auditLogs.unshift(newAudit);

  const io = req.app.get('io');
  if (io) {
    io.emit('incident:updated', incident);
    io.emit('audit:created', newAudit);
  }

  res.json({ success: true, data: incident });
};
