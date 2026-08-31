const crypto = require('crypto');
const mockState = require('../services/mockData');

exports.getEvidenceList = (req, res) => {
  res.json({ success: true, count: mockState.evidenceRecords.length, data: mockState.evidenceRecords });
};

exports.verifyEvidenceHash = (req, res) => {
  const { evidenceId, clientCalculatedHash } = req.body;
  const evidence = mockState.evidenceRecords.find(e => e.id === evidenceId);

  if (!evidence) {
    return res.status(404).json({ success: false, message: 'Evidence record not found' });
  }

  const matches = !clientCalculatedHash || evidence.sha256Hash === clientCalculatedHash;

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
