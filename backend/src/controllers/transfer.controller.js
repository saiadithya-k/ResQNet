const transferService = require('../services/hospital/transfer.service');

/**
 * Start an approved resource transfer (APPROVED -> IN_TRANSIT)
 * POST /api/resource-transfers/:id/start
 */
exports.startTransfer = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const transfer = await transferService.startTransfer(req.params.id, actingHospitalId);

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:transfer_started', {
        transferId: transfer.id,
        resourceId: transfer.resourceId,
        fromHospitalId: transfer.fromHospitalId,
        toHospitalId: transfer.toHospitalId,
        quantity: transfer.quantity,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
      io.emit('resource:transfer_updated', {
        transferId: transfer.id,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Resource transfer dispatched into transit successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark transfer as delivered (IN_TRANSIT -> DELIVERED)
 * POST /api/resource-transfers/:id/deliver
 */
exports.deliverTransfer = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const transfer = await transferService.deliverTransfer(req.params.id, actingHospitalId);

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:transfer_updated', {
        transferId: transfer.id,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Resource transfer marked as delivered',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Acknowledge and receive transfer at destination (DELIVERED / IN_TRANSIT -> RECEIVED)
 * POST /api/resource-transfers/:id/receive
 */
exports.receiveTransfer = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const transfer = await transferService.receiveTransfer(req.params.id, actingHospitalId);

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:transfer_received', {
        transferId: transfer.id,
        resourceId: transfer.resourceId,
        toHospitalId: transfer.toHospitalId,
        quantity: transfer.quantity,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
      io.emit('resource:transfer_updated', {
        transferId: transfer.id,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Resource transfer received and inventory credited successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update transfer status
 * PATCH /api/resource-transfers/:id/status
 */
exports.updateTransferStatus = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const transfer = await transferService.updateTransferStatus(
      req.params.id,
      req.body.status,
      actingHospitalId
    );

    const io = req.app.get('io');
    if (io) {
      if (transfer.status === 'IN_TRANSIT') {
        io.emit('resource:transfer_started', {
          transferId: transfer.id,
          resourceId: transfer.resourceId,
          fromHospitalId: transfer.fromHospitalId,
          toHospitalId: transfer.toHospitalId,
          quantity: transfer.quantity,
          status: transfer.status,
          timestamp: new Date().toISOString()
        });
      } else if (transfer.status === 'RECEIVED') {
        io.emit('resource:transfer_received', {
          transferId: transfer.id,
          resourceId: transfer.resourceId,
          toHospitalId: transfer.toHospitalId,
          quantity: transfer.quantity,
          status: transfer.status,
          timestamp: new Date().toISOString()
        });
      }
      io.emit('resource:transfer_updated', {
        transferId: transfer.id,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Resource transfer status updated to ${transfer.status}`,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transfer by ID
 * GET /api/resource-transfers/:id
 */
exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await transferService.getTransferById(
      req.params.id,
      req.query.hospitalId
    );
    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all resource transfers
 * GET /api/resource-transfers
 */
exports.listTransfers = async (req, res, next) => {
  try {
    const transfers = await transferService.listTransfers(req.query);
    res.json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};
