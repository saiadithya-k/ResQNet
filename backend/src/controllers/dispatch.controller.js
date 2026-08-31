const dispatchService = require('../services/dispatch/dispatch.service');
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

    const result = await dispatchService.assignResponder(incidentId.trim(), responderId.trim(), notes);

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
