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
    mediaUrl: mediaUrl || (req.body.evidenceFiles && req.body.evidenceFiles[0]?.url) || null,
    evidenceFiles: [],
    createdAt: new Date().toISOString(),
    timeline: [
      { time: new Date().toLocaleTimeString().slice(0, 5), title: 'Reported', description: 'Submitted by citizen' },
      { time: new Date().toLocaleTimeString().slice(0, 5), title: 'AI Enriched', description: `Priority Score computed: ${aiEnrichment.priorityScore}` }
    ]
  };

  // Associate attached evidence files
  if (req.body.evidenceFiles && Array.isArray(req.body.evidenceFiles)) {
    newIncident.evidenceFiles = req.body.evidenceFiles.map(ev => {
      const match = mockState.evidenceRecords.find(e => e.id === ev.id || e.fileName === ev.fileName);
      if (match) {
        match.incidentId = newIncident.id;
        return match;
      }
      return { ...ev, incidentId: newIncident.id };
    });

    if (newIncident.evidenceFiles.length > 0) {
      newIncident.timeline.push({
        time: new Date().toLocaleTimeString().slice(0, 5),
        title: 'Evidence Attached',
        description: `${newIncident.evidenceFiles.length} media file(s) sealed with SHA-256 chain of custody`
      });
    }
  }

  // Duplicate Analysis & Spatial-Temporal Clustering
  const dupCheck = aiService.detectDuplicates(newIncident, mockState.incidents);
  if (dupCheck.isDuplicate && dupCheck.primaryIncidentId) {
    const primary = mockState.incidents.find(i => i.id === dupCheck.primaryIncidentId);
    if (primary) {
      newIncident.status = 'DUPLICATE';
      newIncident.duplicateOf = primary.id;
      newIncident.similarityScore = dupCheck.similarityScore;
      newIncident.similarityFactors = dupCheck.factors;

      newIncident.timeline.push({
        time: new Date().toLocaleTimeString().slice(0, 5),
        title: 'Duplicate Linked',
        description: `Linked to primary emergency ${primary.id} (Similarity: ${Math.round(dupCheck.similarityScore * 100)}%)`
      });

      // Attach as supporting report to primary incident without deleting original report
      if (!primary.supportingReports) primary.supportingReports = [];
      primary.supportingReports.push({
        id: newIncident.id,
        reportedAt: newIncident.createdAt,
        title: newIncident.title,
        description: newIncident.description,
        evidenceFiles: newIncident.evidenceFiles || [],
        similarityScore: dupCheck.similarityScore,
        factors: dupCheck.factors
      });

      // Merge evidence files into primary incident's evidence collection
      if (newIncident.evidenceFiles && newIncident.evidenceFiles.length > 0) {
        if (!primary.evidenceFiles) primary.evidenceFiles = [];
        primary.evidenceFiles.push(...newIncident.evidenceFiles);
      }

      primary.timeline.push({
        time: new Date().toLocaleTimeString().slice(0, 5),
        title: 'Supporting Report Linked',
        description: `Citizen report ${newIncident.id} linked (${dupCheck.factors.slice(0, 2).join(', ')})`
      });
    }
  }

  mockState.incidents.unshift(newIncident);

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.emit('incident:created', newIncident);
    if (newIncident.duplicateOf) {
      const primary = mockState.incidents.find(i => i.id === newIncident.duplicateOf);
      if (primary) io.emit('incident:updated', primary);
    }
  }

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

  const io = req.app.get('io');
  if (io) io.emit('incident:updated', incident);

  res.json({ success: true, data: incident });
};
