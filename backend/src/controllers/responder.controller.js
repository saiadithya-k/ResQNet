const responderService = require('../services/responder/responder.service');
const fatigueService = require('../services/dispatch/fatigue.service');

/**
 * List all responders
 * GET /api/responders
 */
exports.getAllResponders = async (req, res, next) => {
  try {
    const list = await responderService.getAllResponders(req.query);
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get responder by ID
 * GET /api/responders/:id
 */
exports.getResponderById = async (req, res, next) => {
  try {
    const responder = await responderService.getResponderById(req.params.id);
    res.json({
      success: true,
      data: responder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new responder
 * POST /api/responders
 */
exports.createResponder = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity,
      isVerified,
      status,
      skills,
      equipment
    } = req.body;

    const payload = {
      name,
      email,
      password,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity,
      isVerified,
      status,
      skills,
      equipment
    };

    const created = await responderService.createResponder(payload);
    res.status(201).json({
      success: true,
      message: 'Responder created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update responder details
 * PATCH /api/responders/:id
 */
exports.updateResponder = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity,
      isVerified,
      status,
      skills,
      equipment
    } = req.body;

    const payload = {
      name,
      email,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity,
      isVerified,
      status,
      skills,
      equipment
    };

    const updated = await responderService.updateResponder(req.params.id, payload);
    res.json({
      success: true,
      message: 'Responder updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-deactivate responder (sets status to OFF_DUTY)
 * DELETE /api/responders/:id
 */
exports.deactivateResponder = async (req, res, next) => {
  try {
    const deactivated = await responderService.deactivateResponder(req.params.id);
    res.json({
      success: true,
      message: 'Responder deactivated successfully (status set to OFF_DUTY)',
      data: deactivated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update responder GPS location and broadcast via Socket.IO
 * PATCH /api/responders/:id/location
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const updated = await responderService.updateResponderLocation(id, latitude, longitude);

    // Broadcast real-time location update strictly after database persistence succeeds
    const io = req.app.get('io');
    if (io) {
      io.emit('responder:location_updated', {
        responderId: updated.id,
        userId: updated.userId,
        latitude: updated.latitude,
        longitude: updated.longitude,
        lastLocationTime: updated.lastLocationTime,
        timestamp: updated.lastLocationTime,
        responder: updated
      });
    }

    res.json({
      success: true,
      message: 'Responder location updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update responder operational status and broadcast via Socket.IO
 * PATCH /api/responders/:id/status
 */
exports.updateResponderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await responderService.updateResponderStatus(id, status);

    // Broadcast real-time status change strictly after database persistence
    const io = req.app.get('io');
    if (io) {
      io.emit('responder:status_changed', {
        responderId: result.responder.id,
        userId: result.responder.userId,
        status: result.responder.status,
        previousStatus: result.previousStatus,
        timestamp: new Date().toISOString(),
        responder: result.responder
      });
    }

    res.json({
      success: true,
      message: 'Responder status updated successfully',
      data: result.responder
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SKILLS CONTROLLER METHODS
// ==========================================

/**
 * Get responder skills
 * GET /api/responders/:id/skills
 */
exports.getSkills = async (req, res, next) => {
  try {
    const { id } = req.params;
    const skills = await responderService.getResponderSkills(id);
    res.json({
      success: true,
      count: skills.length,
      data: skills
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a skill to responder
 * POST /api/responders/:id/skills
 */
exports.addSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { skill } = req.body;
    const skills = await responderService.addResponderSkill(id, skill);
    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: skills
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Replace/update responder skills
 * PATCH /api/responders/:id/skills
 */
exports.updateSkills = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { skills } = req.body;
    const updated = await responderService.updateResponderSkills(id, skills);
    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a skill from responder
 * DELETE /api/responders/:id/skills/:skill
 */
exports.removeSkill = async (req, res, next) => {
  try {
    const { id, skill } = req.params;
    const skills = await responderService.removeResponderSkill(id, decodeURIComponent(skill));
    res.json({
      success: true,
      message: 'Skill removed successfully',
      data: skills
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CERTIFICATIONS CONTROLLER METHODS
// ==========================================

/**
 * Get all certifications for responder
 * GET /api/responders/:id/certifications
 */
exports.getCertifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const certs = await responderService.getResponderCertifications(id);
    res.json({
      success: true,
      count: certs.length,
      data: certs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single certification by ID
 * GET /api/responders/:id/certifications/:certificationId
 */
exports.getCertificationById = async (req, res, next) => {
  try {
    const { id, certificationId } = req.params;
    const cert = await responderService.getResponderCertification(id, certificationId);
    res.json({
      success: true,
      data: cert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new certification for responder
 * POST /api/responders/:id/certifications
 */
exports.createCertification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cert = await responderService.createResponderCertification(id, req.body);
    res.status(201).json({
      success: true,
      message: 'Certification created successfully',
      data: cert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a certification
 * PATCH /api/responders/:id/certifications/:certificationId
 */
exports.updateCertification = async (req, res, next) => {
  try {
    const { id, certificationId } = req.params;
    const cert = await responderService.updateResponderCertification(id, certificationId, req.body);
    res.json({
      success: true,
      message: 'Certification updated successfully',
      data: cert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a certification
 * DELETE /api/responders/:id/certifications/:certificationId
 */
exports.deleteCertification = async (req, res, next) => {
  try {
    const { id, certificationId } = req.params;
    const result = await responderService.deleteResponderCertification(id, certificationId);
    res.json({
      success: true,
      message: 'Certification deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EQUIPMENT CONTROLLER METHODS
// ==========================================

/**
 * Get responder equipment
 * GET /api/responders/:id/equipment
 */
exports.getEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await responderService.getResponderEquipment(id);
    res.json({
      success: true,
      count: equipment.length,
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an equipment item to responder
 * POST /api/responders/:id/equipment
 */
exports.addEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = req.body.equipment || req.body.item;
    const equipment = await responderService.addResponderEquipment(id, item);
    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      data: equipment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Replace/update responder equipment
 * PATCH /api/responders/:id/equipment
 */
exports.updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = req.body.equipment || req.body.items;
    const updated = await responderService.updateResponderEquipment(id, items);
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an equipment item from responder
 * DELETE /api/responders/:id/equipment/:equipment
 */
exports.removeEquipment = async (req, res, next) => {
  try {
    const { id, equipment } = req.params;
    const updated = await responderService.removeResponderEquipment(id, decodeURIComponent(equipment));
    res.json({
      success: true,
      message: 'Equipment removed successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FATIGUE CONTROLLER METHODS (Phase 6)
// ==========================================

/**
 * Get responder fatigue state and factors
 * GET /api/responders/:id/fatigue
 */
exports.getFatigue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fatigue = await fatigueService.getResponderFatigue(id);
    res.json({
      success: true,
      data: fatigue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recalculate operational fatigue and alert if threshold crossed
 * POST /api/responders/:id/fatigue/recalculate
 */
exports.recalculateFatigue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await fatigueService.recalculateFatigue(id, req.body);

    // Emit real-time fatigue alert strictly on transition into HIGH or CRITICAL risk state
    if (result.shouldAlert) {
      const io = req.app.get('io');
      if (io) {
        io.emit('responder:fatigue_alert', {
          responderId: result.responderId,
          userId: result.userId,
          score: result.score,
          level: result.level,
          previousScore: result.previousScore,
          previousLevel: result.previousLevel,
          timestamp: new Date().toISOString(),
          factors: result.factors
        });
      }
    }

    res.json({
      success: true,
      message: 'Fatigue recalculated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a fatigue snapshot and update current score
 * POST /api/responders/:id/fatigue
 */
exports.recordFatigue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await fatigueService.recordFatigueSnapshot(id, req.body);

    if (result.shouldAlert) {
      const io = req.app.get('io');
      if (io) {
        io.emit('responder:fatigue_alert', {
          responderId: result.responderId,
          userId: result.userId,
          score: result.score,
          level: result.level,
          previousScore: result.previousScore,
          previousLevel: result.previousLevel,
          timestamp: new Date().toISOString(),
          factors: result.factors
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Fatigue record logged successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical fatigue records for a responder
 * GET /api/responders/:id/fatigue/history
 */
exports.getFatigueHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    const history = await fatigueService.getFatigueHistory(id, limit);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};
