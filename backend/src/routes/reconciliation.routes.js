const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliation.controller');
const {
  validateReconcileTransfer,
  validateResolveDiscrepancy
} = require('../middleware/reconciliation.validation');

// ==========================================
// RECONCILIATION ROUTES (P4-09)
// ==========================================

// List all reconciliations
router.get('/', reconciliationController.listAllReconciliations);

// Reconcile a completed transfer
router.post(
  '/transfers/:transferId',
  validateReconcileTransfer,
  reconciliationController.reconcileTransfer
);

// Get single reconciliation by ID
router.get('/:id', reconciliationController.getReconciliationById);

// Resolve a reconciliation discrepancy
router.patch(
  '/:id/resolve',
  validateResolveDiscrepancy,
  reconciliationController.resolveDiscrepancy
);

module.exports = router;
