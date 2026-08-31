const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

router.get('/', (req, res) => {
  res.json({ success: true, count: mockState.auditLogs.length, data: mockState.auditLogs });
});

module.exports = router;
