const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/stats', analyticsController.getCommandStats);
router.get('/heatmap', analyticsController.getHeatmapData);

module.exports = router;
