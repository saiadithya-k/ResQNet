const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidence.controller');
const upload = require('../middleware/upload.middleware');

router.get('/', evidenceController.getEvidenceList);
router.post('/upload', upload.single('file'), evidenceController.uploadEvidence);
router.post('/verify', evidenceController.verifyEvidenceHash);

module.exports = router;

