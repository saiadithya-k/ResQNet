const dispatchService = require('../services/dispatch/dispatch.service');
const mockState = require('../services/mockData');
const { AppError } = require('../utils/errors');

/**
 * Dispatch a responder to an incident
 * POST /api/dispatch
 */
exports.dispatchResponder = async (req, res, next) => {
  try {
    const { incidentId, responderId, notes } = req.body;

    if (!incidentId || typeof incidentId !== 'string' || incidentId.trim() === '') {
      return next(new AppError('incidentId is required and must be a valid string', 400));
    }

    if (!responderId || typeof responderId !== 'string' || responderId.trim() === '') {
      return next(new AppError('responderId is required and must be a valid string', 400));
    }

    const trimmedIncidentId = incidentId.trim();
    const trimmedResponderId = responderId.trim();

    // Check mockState first if present for local mock synchronization
    const mockIncident = mockState.incidents ? mockState.incidents.find(i => i.id === trimmedIncidentId) : null;
    const mockResponder = mockState.responders ? mockState.responders.find(r => r.id === trimmedResponderId) : null;

    let result;
    try {
      result = await dispatchService.assignResponder(trimmedIncidentId, trimmedResponderId, notes);
    } catch (dbErr) {
      // If error is an explicit application/domain rejection (400, 404, 409), return it directly
      if (dbErr instanceof AppError || dbErr.statusCode) {
        return res.status(dbErr.statusCode).json({
          success: false,
          message: dbErr.message
        });
      }

      // Handle Prisma write conflict / transaction serialization failure (P2034) or unique constraint (P2002) as 409 Conflict
      if (dbErr.code === 'P2034' || dbErr.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Concurrent dispatch conflict: this unit or incident was just assigned by another operator.'
        });
      }

      // If DB fails due to connection/offline error but mock exists, fall back gracefully to mock state
      if (mockIncident && mockResponder) {
        if (mockResponder.status === 'DISPATCHED' && mockResponder.assignedIncidentId) {
          return res.status(409).json({
            success: false,
            message: `Unit ${mockResponder.name} (${mockResponder.badgeNumber}) is currently assigned to Incident #${mockResponder.assignedIncidentId}`
          });
        }

        mockResponder.status = 'DISPATCHED';
        mockResponder.assignedIncidentId = mockIncident.id;
        mockResponder.etaMinutes = mockResponder.etaMinutes || 5;

        mockIncident.status = 'ASSIGNED';
        if (!mockIncident.timeline) mockIncident.timeline = [];
        mockIncident.timeline.push({
          time: new Date().toLocaleTimeString().slice(0, 5),
          title: 'Dispatched',
          description: `Assigned to ${mockResponder.name} (${mockResponder.badgeNumber})`
        });

        result = {
          dispatch: {
            id: `DISP-${Date.now().toString().slice(-4)}`,
            incidentId: mockIncident.id,
            responderId: mockResponder.id,
            status: 'DISPATCHED',
            assignedAt: new Date()
          },
          responder: mockResponder,
          incident: mockIncident,
          previousStatus: 'AVAILABLE'
        };
      } else {
        return next(dbErr);
      }
    }

    // Dynamic Audit Log Creation
    const responderName = result.responder?.user?.name || result.responder?.name || 'Responder Unit';
    const badgeNum = result.responder?.badgeNumber || result.responder?.id || 'UNIT';
    const newAudit = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      user: req.user?.name || 'Dispatcher Davis',
      action: 'RESPONDER_DISPATCHED',
      entity: `Incident #${trimmedIncidentId}`,
      details: `Dispatched ${responderName} (${badgeNum}) - ETA ${result.responder?.etaMinutes || 5}m`,
      time: new Date().toLocaleTimeString().slice(0, 8)
    };
    if (mockState.auditLogs) {
      mockState.auditLogs.unshift(newAudit);
    }

    // Emit real-time status and dispatch events via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('responder:status_changed', {
        responderId: result.responder.id,
        userId: result.responder.userId,
        status: 'DISPATCHED',
        previousStatus: result.previousStatus,
        timestamp: new Date().toISOString(),
        responder: result.responder
      });
      io.emit('incident:assigned', {
        incident: result.incident,
        responder: result.responder,
        dispatch: result.dispatch
      });
      io.emit('responder:location_updated', result.responder);
      io.emit('audit:created', newAudit);
    }

    res.status(201).json({
      success: true,
      message: 'Responder successfully dispatched',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ranked responder matches for an incident
 * GET /api/dispatch/:incidentId/matches or POST /api/dispatch/:incidentId/matches
 */
exports.getMatches = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const options = req.method === 'POST' ? req.body : req.query;
    const matchesResult = await dispatchService.getMatches(incidentId, options);

    res.json({
      success: true,
      data: matchesResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single dispatch by ID
 * GET /api/dispatch/:id
 */
exports.getDispatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dispatch = await dispatchService.getDispatchById(id);

    res.json({
      success: true,
      data: dispatch
    });
  } catch (error) {
    next(error);
  }
};

