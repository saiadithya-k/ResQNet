const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.post('/extract', aiController.extract);
router.post('/duplicates', aiController.checkDuplicates);
router.post('/copilot', aiController.copilotQuery);

module.exports = router;
