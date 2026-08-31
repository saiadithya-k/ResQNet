const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const resourceCoordinationController = require('../controllers/resource-coordination.controller');
const {
  validateCreateCoordinationRequest,
  validateUpdateCoordinationStatus
} = require('../middleware/coordination.validation');

// ==========================================
// CROSS-AGENCY COORDINATION ROUTES (P4-07)
// ==========================================

// Discover available resources across hospitals/agencies
router.get('/available', resourceCoordinationController.discoverAvailableResources);

// Create cross-agency resource coordination request
router.post(
  '/coordination-requests',
  validateCreateCoordinationRequest,
  resourceCoordinationController.createCoordinationRequest
);

// Get single coordination request by ID
router.get(
  '/coordination-requests/:id',
  resourceCoordinationController.getCoordinationRequest
);

// Update coordination request status (Approve, Reject, Cancel)
router.patch(
  '/coordination-requests/:id/status',
  validateUpdateCoordinationStatus,
  resourceCoordinationController.updateRequestStatus
);

// ==========================================
// GENERAL RESOURCE & TRANSFERS ROUTES
// ==========================================
router.get('/', resourceController.getResources);
router.get('/transfers', resourceController.getTransfers);
router.post('/transfers', resourceController.requestTransfer);

module.exports = router;
