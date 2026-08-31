const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatch.controller');

// ==========================================
// DISPATCH & MATCHING ROUTES (Phase 7)
// ==========================================

// Get ranked matches for an incident (GET or POST with custom filter overrides)
router.get('/:incidentId/matches', dispatchController.getMatches);
router.post('/:incidentId/matches', dispatchController.getMatches);

// Dispatch / assign a responder to an incident
router.post('/', dispatchController.dispatchResponder);

// Get specific dispatch by ID
router.get('/:id', dispatchController.getDispatchById);

module.exports = router;
