const aiService = require('../services/ai/extraction.service');
const mockState = require('../services/mockData');

exports.extract = (req, res) => {
  const { text, language } = req.body;
  const result = aiService.extractEmergency(text, language);
  res.json({ success: true, data: result });
};

exports.checkDuplicates = (req, res) => {
  const result = aiService.detectDuplicates(req.body, mockState.incidents);
  res.json({ success: true, data: result });
};

exports.copilotQuery = (req, res) => {
  const { query } = req.body;
  const criticalCount = mockState.incidents.filter(i => i.severity === 'CRITICAL').length;
  const result = aiService.answerCopilotQuery(query, { criticalCount, incidents: mockState.incidents });
  res.json({ success: true, data: result });
};
