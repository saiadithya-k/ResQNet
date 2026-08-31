const communityService = require('../services/community/community.service');
const prisma = require('../config/database');
const mockState = require('../services/mockData');

/**
 * Register a new community responder
 * POST /api/community-responders / POST /api/community/responders
 */
exports.registerResponder = async (req, res, next) => {
  try {
    const profile = await communityService.createCommunityResponder(req.body);
    res.status(201).json({
      success: true,
      message: 'Community responder registered successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get community responder profile by ID
 * GET /api/community-responders/:id / GET /api/community/responders/:id
 */
exports.getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await communityService.getCommunityResponder(id);
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update community responder availability
 * PATCH /api/community-responders/:id/availability / PATCH /api/community/responders/:id/availability
 */
exports.updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAvailable = req.body.isAvailable !== undefined
      ? req.body.isAvailable
      : (req.body.status === 'AVAILABLE');

    const updated = await communityService.updateAvailability(id, isAvailable);

    const io = req.app.get('io');
    if (io) {
      io.emit('community:responder_available', {
        responderId: updated.id,
        isAvailable: updated.status === 'AVAILABLE',
        status: updated.status,
        timestamp: new Date().toISOString()
      });
      io.emit('responder:status_changed', {
        responderId: updated.id,
        userId: updated.userId,
        status: updated.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Availability updated to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update community responder GPS position
 * PATCH /api/community-responders/:id/location / PATCH /api/community/responders/:id/location
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const updated = await communityService.updateLocation(id, latitude, longitude);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discover nearby safe tasks eligible for community responders
 * GET /api/community-responders/:id/nearby / GET /api/community/responders/:id/nearby
 */
exports.getNearbyTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await communityService.getNearbyTasks(id, req.query);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept a nearby community response task
 * POST /api/community-responders/:id/accept / POST /api/community/responders/:id/accept
 */
exports.acceptTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incidentId = req.body.incidentId || req.body.taskId;

    const result = await communityService.acceptTask(id, incidentId);

    const io = req.app.get('io');
    if (io) {
      io.emit('community:assignment_created', {
        dispatchId: result.dispatch.id,
        responderId: result.responder.id,
        incidentId: result.incident.id,
        status: result.dispatch.status,
        timestamp: new Date().toISOString()
      });
      io.emit('responder:status_changed', {
        responderId: result.responder.id,
        userId: result.responder.userId,
        status: result.responder.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Community task accepted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update status of an accepted task
 * PATCH /api/community-responders/:id/tasks/:taskId/status / PATCH /api/community/responders/:id/tasks/:taskId/status
 */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const { status } = req.body;

    const result = await communityService.updateTaskStatus(id, taskId, status);

    const io = req.app.get('io');
    if (io) {
      io.emit('community:assignment_updated', {
        dispatchId: result.dispatch.id,
        responderId: result.responder.id,
        status: result.dispatch.status,
        timestamp: new Date().toISOString()
      });
      io.emit('responder:status_changed', {
        responderId: result.responder.id,
        userId: result.responder.userId,
        status: result.responder.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Task status updated to ${result.dispatch.status}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline/cancel an accepted task
 * POST /api/community-responders/:id/tasks/:taskId/decline / POST /api/community/responders/:id/tasks/:taskId/decline
 */
exports.declineTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const result = await communityService.declineTask(id, taskId);

    res.json({
      success: true,
      message: 'Task declined/cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backward compatibility: Community Mesh list
 * GET /api/community-responders/mesh / GET /api/community/mesh
 */
exports.getMesh = async (req, res, next) => {
  try {
    const dbResponders = await prisma.responderProfile.findMany({
      where: { isCommunity: true },
      include: { user: true }
    });

    if (dbResponders.length > 0) {
      return res.json({
        success: true,
        count: dbResponders.length,
        data: dbResponders
      });
    }

    const fallback = mockState.responders.filter(r => r.isCommunity);
    res.json({ success: true, count: fallback.length, data: fallback });
  } catch (error) {
    next(error);
  }
};

/**
 * Backward compatibility: Checkin
 * POST /api/community-responders/checkin / POST /api/community/checkin
 */
exports.checkin = (req, res) => {
  const { responderId, incidentId, status } = req.body;
  const responder = mockState.responders.find(r => r.id === responderId);
  if (responder) {
    responder.status = status || 'ON_SCENE';
    responder.assignedIncidentId = incidentId;
  }
  res.json({ success: true, message: 'Community responder checked in on scene', data: responder });
};
