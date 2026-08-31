const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/extract', aiController.extract);
router.post('/duplicates', aiController.checkDuplicates);
router.post('/copilot', authMiddleware, aiController.copilotQuery);

module.exports = router;

