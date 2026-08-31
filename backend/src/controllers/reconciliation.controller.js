const reconciliationService = require('../services/hospital/reconciliation.service');

/**
 * Reconcile a completed resource transfer
 * POST /api/reconciliation/transfers/:transferId
 */
exports.reconcileTransfer = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const record = await reconciliationService.reconcileTransfer(
      req.params.transferId,
      req.body.actualQuantity,
      actingHospitalId,
      req.body.notes
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:reconciliation_created', {
        reconciliationId: record.id,
        transferId: record.transferId,
        resourceId: record.resourceId,
        expectedQuantity: record.expectedQuantity,
        actualQuantity: record.actualQuantity,
        discrepancyQuantity: record.discrepancyQuantity,
        discrepancyType: record.discrepancyType,
        status: record.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: `Transfer reconciled with status '${record.status}' and result '${record.discrepancyType}'`,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single reconciliation record by ID
 * GET /api/reconciliation/:id
 */
exports.getReconciliationById = async (req, res, next) => {
  try {
    const record = await reconciliationService.getReconciliationById(
      req.params.id,
      req.query.hospitalId
    );
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a reconciliation discrepancy
 * PATCH /api/reconciliation/:id/resolve
 */
exports.resolveDiscrepancy = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const updated = await reconciliationService.resolveDiscrepancy(
      req.params.id,
      req.body,
      actingHospitalId
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:reconciliation_resolved', {
        reconciliationId: updated.id,
        transferId: updated.transferId,
        status: updated.status,
        resolutionReason: updated.resolutionReason,
        resolvedBy: updated.resolvedBy,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Reconciliation discrepancy resolved successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List reconciliations for a hospital
 * GET /api/hospitals/:hospitalId/reconciliations
 */
exports.getHospitalReconciliations = async (req, res, next) => {
  try {
    const records = await reconciliationService.getHospitalReconciliations(
      req.params.hospitalId,
      req.query
    );
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all reconciliation records
 * GET /api/reconciliation
 */
exports.listAllReconciliations = async (req, res, next) => {
  try {
    const records = await reconciliationService.listAllReconciliations(req.query);
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};
