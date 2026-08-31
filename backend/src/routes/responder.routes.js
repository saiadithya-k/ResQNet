const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responder.controller');
const {
  validateCreateResponder,
  validateUpdateResponder,
  validateUpdateStatus,
  validateUpdateLocation,
  validateAddSkill,
  validateUpdateSkills,
  validateCreateCertification,
  validateUpdateCertification,
  validateAddEquipment,
  validateUpdateEquipment,
  validateRecalculateFatigue,
  validateRecordFatigue
} = require('../middleware/responder.validation');

// ==========================================
// BASE RESPONDER CRUD & STATUS/LOCATION
// ==========================================

// List responders (supports query filters)
router.get('/', responderController.getAllResponders);

// Get single responder by ID
router.get('/:id', responderController.getResponderById);

// Create new responder
router.post('/', validateCreateResponder, responderController.createResponder);

// Update responder operational status (Phase 2)
router.patch('/:id/status', validateUpdateStatus, responderController.updateResponderStatus);

// Update responder GPS location (Phase 3)
router.patch('/:id/location', validateUpdateLocation, responderController.updateLocation);

// Update existing responder general profile
router.patch('/:id', validateUpdateResponder, responderController.updateResponder);

// Soft-deactivate responder (sets status to OFF_DUTY)
router.delete('/:id', responderController.deactivateResponder);

// ==========================================
// SKILLS ROUTES (Phase 4)
// ==========================================

// Get responder skills
router.get('/:id/skills', responderController.getSkills);

// Add single skill
router.post('/:id/skills', validateAddSkill, responderController.addSkill);

// Replace/update entire skills array
router.patch('/:id/skills', validateUpdateSkills, responderController.updateSkills);

// Remove specific skill
router.delete('/:id/skills/:skill', responderController.removeSkill);

// ==========================================
// CERTIFICATIONS ROUTES (Phase 4)
// ==========================================

// Get all certifications for responder
router.get('/:id/certifications', responderController.getCertifications);

// Create new certification
router.post('/:id/certifications', validateCreateCertification, responderController.createCertification);

// Get specific certification by ID
router.get('/:id/certifications/:certificationId', responderController.getCertificationById);

// Update specific certification
router.patch('/:id/certifications/:certificationId', validateUpdateCertification, responderController.updateCertification);

// Delete specific certification
router.delete('/:id/certifications/:certificationId', responderController.deleteCertification);

// ==========================================
// EQUIPMENT ROUTES (Phase 5)
// ==========================================

// Get responder equipment
router.get('/:id/equipment', responderController.getEquipment);

// Add single equipment item
router.post('/:id/equipment', validateAddEquipment, responderController.addEquipment);

// Replace/update entire equipment array
router.patch('/:id/equipment', validateUpdateEquipment, responderController.updateEquipment);

// Remove specific equipment item
router.delete('/:id/equipment/:equipment', responderController.removeEquipment);

// ==========================================
// FATIGUE INTELLIGENCE ROUTES (Phase 6)
// ==========================================

// Get responder fatigue score and factor breakdown
router.get('/:id/fatigue', responderController.getFatigue);

// Recalculate fatigue and evaluate alert threshold
router.post('/:id/fatigue/recalculate', validateRecalculateFatigue, responderController.recalculateFatigue);

// Record a fatigue snapshot and update current fatigue
router.post('/:id/fatigue', validateRecordFatigue, responderController.recordFatigue);

// Get historical fatigue snapshots
router.get('/:id/fatigue/history', responderController.getFatigueHistory);

module.exports = router;
