const express = require('express');
const router = express.Router();
const disasterController = require('../controllers/disaster.controller');

router.get('/status', disasterController.getStatus);
router.post('/toggle', disasterController.toggleDisasterMode);
router.get('/zones', disasterController.getZones);
router.get('/shelters', disasterController.getShelters);
router.post('/simulate', disasterController.simulateDisaster);

module.exports = router;
