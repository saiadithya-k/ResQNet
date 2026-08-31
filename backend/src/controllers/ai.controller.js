const aiService = require('../services/ai/extraction.service');
const mockState = require('../services/mockData');

exports.extract = (req, res) => {
  const { text, language } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Valid emergency text is required for AI parameter extraction'
    });
  }
  const result = aiService.extractEmergency(text, language);
  res.json({ success: true, data: result });
};

exports.checkDuplicates = (req, res) => {
  const result = aiService.detectDuplicates(req.body, mockState.incidents);
  res.json({ success: true, data: result });
};

exports.copilotQuery = (req, res) => {
  const { query } = req.body;
  // Security Hardening: Never trust client-supplied role in body; strictly derive from authenticated JWT/session
  const userRole = req.user?.role || 'CITIZEN';
  const criticalCount = mockState.incidents.filter(i => i.severity === 'CRITICAL').length;
  const result = aiService.answerCopilotQuery(query, { criticalCount, incidents: mockState.incidents }, userRole);
  res.json({ success: true, data: result });
};
