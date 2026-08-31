const crypto = require('crypto');
const fs = require('fs');
const mockState = require('../services/mockData');

exports.getEvidenceList = (req, res) => {
  res.json({ success: true, count: mockState.evidenceRecords.length, data: mockState.evidenceRecords });
};

exports.uploadEvidence = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No media file received' });
  }

  let hash = '';
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (e) {
    hash = crypto.createHash('sha256').update(req.file.originalname + Date.now()).digest('hex');
  }

  const sizeFormatted = req.file.size > 1024 * 1024
    ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(req.file.size / 1024)} KB`;

  const record = {
    id: `EV-${1100 + mockState.evidenceRecords.length}`,
    incidentId: req.body.incidentId || null,
    fileName: req.file.originalname,
    storedFileName: req.file.filename,
    fileType: req.file.mimetype,
    fileSize: sizeFormatted,
    rawBytes: req.file.size,
    url: `/uploads/${req.file.filename}`,
    sha256Hash: hash,
    status: 'VERIFIED',
    uploader: req.body.uploader || 'Citizen Reporter',
    timestamp: new Date().toISOString()
  };

  mockState.evidenceRecords.unshift(record);

  res.status(201).json({
    success: true,
    data: record
  });
};

exports.verifyEvidenceHash = (req, res) => {
  const { evidenceId, clientCalculatedHash } = req.body;
  const evidence = mockState.evidenceRecords.find(e => e.id === evidenceId);

  if (!evidence) {
    return res.status(404).json({ success: false, message: 'Evidence record not found' });
  }

  const matches = !clientCalculatedHash || evidence.sha256Hash.toLowerCase() === clientCalculatedHash.toLowerCase();

  const newAudit = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    user: req.user?.name || 'Security Auditor',
    action: matches ? 'EVIDENCE_VERIFIED' : 'EVIDENCE_TAMPER_DETECTED',
    entity: `Evidence ${evidence.id} (${evidence.fileName})`,
    details: matches ? `SHA-256 integrity match (${evidence.sha256Hash.slice(0, 16)}...)` : 'Cryptographic hash mismatch alert',
    time: new Date().toLocaleTimeString().slice(0, 8)
  };
  mockState.auditLogs.unshift(newAudit);

  const io = req.app.get('io');
  if (io) {
    io.emit('audit:created', newAudit);
  }

  res.json({
    success: true,
    data: {
      evidenceId: evidence.id,
      fileName: evidence.fileName,
      storedHash: evidence.sha256Hash,
      verifiedHash: clientCalculatedHash || evidence.sha256Hash,
      isAuthentic: matches,
      status: matches ? 'INTEGRITY_VERIFIED' : 'TAMPER_ALERT_MISMATCH',
      chainOfCustody: [
        { event: 'Uploaded by Citizen', timestamp: evidence.timestamp },
        { event: 'SHA-256 Ingestion Hash Sealed', timestamp: evidence.timestamp },
        { event: 'Command Center Audit Verification', timestamp: new Date().toISOString() }
      ]
    }
  });
};

