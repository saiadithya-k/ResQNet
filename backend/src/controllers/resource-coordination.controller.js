const coordinationService = require('../services/hospital/resource-coordination.service');

/**
 * Discover available external resources across all hospitals/districts
 * GET /api/resources/available
 */
exports.discoverAvailableResources = async (req, res, next) => {
  try {
    const requestingHospitalId = req.query.hospitalId || req.query.requestingHospitalId;
    const resources = await coordinationService.discoverAvailableResources(
      requestingHospitalId,
      req.query
    );
    res.json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a cross-agency resource coordination request
 * POST /api/resources/coordination-requests
 */
exports.createCoordinationRequest = async (req, res, next) => {
  try {
    const transfer = await coordinationService.createCoordinationRequest(req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:coordination_requested', {
        requestId: transfer.id,
        resourceId: transfer.resourceId,
        resourceName: transfer.resource?.name,
        fromHospitalId: transfer.fromHospitalId,
        toHospitalId: transfer.toHospitalId,
        quantity: transfer.quantity,
        status: transfer.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Resource coordination request created successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single coordination request by ID
 * GET /api/resources/coordination-requests/:id
 */
exports.getCoordinationRequest = async (req, res, next) => {
  try {
    const transfer = await coordinationService.getCoordinationRequest(
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
 * Get hospital coordination requests (sent and received)
 * GET /api/hospitals/:hospitalId/coordination-requests
 */
exports.getHospitalCoordinationRequests = async (req, res, next) => {
  try {
    const requests = await coordinationService.getHospitalCoordinationRequests(
      req.params.hospitalId,
      req.query
    );
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update coordination request status (Approve / Reject / Cancel)
 * PATCH /api/resources/coordination-requests/:id/status
 */
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const actingHospitalId = req.body.actingHospitalId || req.query.hospitalId;
    const updated = await coordinationService.updateRequestStatus(
      req.params.id,
      req.body.status,
      actingHospitalId,
      req.body.reason
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('resource:coordination_updated', {
        requestId: updated.id,
        resourceId: updated.resourceId,
        fromHospitalId: updated.fromHospitalId,
        toHospitalId: updated.toHospitalId,
        status: updated.status,
        reason: updated.reason,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Coordination request ${updated.status.toLowerCase()} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
