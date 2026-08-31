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

exports.copilotQuery = async (req, res, next) => {
  try {
    const { query, clientContext } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    // Derive role securely from authenticated user or request
    const userRole = req.user?.role || req.body?.userRole || (clientContext?.isAdmin ? 'ADMIN' : 'CITIZEN');
    const criticalCount = mockState.incidents ? mockState.incidents.filter(i => i.severity === 'CRITICAL').length : 0;
    
    const result = await aiService.answerCopilotQuery(
      query,
      {
        criticalCount,
        incidents: mockState.incidents || [],
        responders: mockState.responders || [],
        hospitals: mockState.hospitals || [],
        shelters: mockState.shelters || [],
        disasterMode: mockState.disasterMode || false,
        ...(clientContext || {})
      },
      userRole
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
