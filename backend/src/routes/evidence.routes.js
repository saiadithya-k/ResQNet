const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');

router.get('/', evidenceController.getEvidenceList);
router.post('/verify', evidenceController.verifyEvidenceHash);

module.exports = router;
