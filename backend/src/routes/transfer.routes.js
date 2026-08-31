const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { validateUpdateTransferStatus } = require('../middleware/transfer.validation');

// ==========================================
// RESOURCE TRANSFER EXECUTION ROUTES (P4-08)
// ==========================================

// List all transfers
router.get('/', transferController.listTransfers);

// Get single transfer by ID
router.get('/:id', transferController.getTransferById);

// Start / dispatch approved transfer into transit
router.post('/:id/start', transferController.startTransfer);

// Mark transfer as delivered
router.post('/:id/deliver', transferController.deliverTransfer);

// Acknowledge and receive transfer at destination
router.post('/:id/receive', transferController.receiveTransfer);

// General status transition endpoint
router.patch('/:id/status', validateUpdateTransferStatus, transferController.updateTransferStatus);

module.exports = router;
