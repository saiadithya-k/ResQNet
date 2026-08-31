const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const {
  validateRegisterCommunityResponder,
  validateAvailability,
  validateCommunityLocation,
  validateAcceptTask,
  validateTaskStatus
} = require('../middleware/community.validation');

// ==========================================
// LEGACY & MESH ROUTES
// ==========================================
router.get('/mesh', communityController.getMesh);
router.post('/checkin', communityController.checkin);

// ==========================================
// COMMUNITY RESPONDER REGISTRATION & PROFILE
// ==========================================
router.post('/responders', validateRegisterCommunityResponder, communityController.registerResponder);
router.post('/', validateRegisterCommunityResponder, communityController.registerResponder);

router.get('/responders/:id', communityController.getProfile);

// ==========================================
// AVAILABILITY & LOCATION
// ==========================================
router.patch('/responders/:id/availability', validateAvailability, communityController.updateAvailability);
router.patch('/:id/availability', validateAvailability, communityController.updateAvailability);

router.patch('/responders/:id/location', validateCommunityLocation, communityController.updateLocation);
router.patch('/:id/location', validateCommunityLocation, communityController.updateLocation);

// ==========================================
// NEARBY TASK DISCOVERY
// ==========================================
router.get('/responders/:id/nearby', communityController.getNearbyTasks);
router.get('/:id/nearby', communityController.getNearbyTasks);

// ==========================================
// TASK ACCEPTANCE & LIFECYCLE
// ==========================================
router.post('/responders/:id/accept', validateAcceptTask, communityController.acceptTask);
router.post('/:id/accept', validateAcceptTask, communityController.acceptTask);

router.patch('/responders/:id/tasks/:taskId/status', validateTaskStatus, communityController.updateTaskStatus);
router.patch('/:id/tasks/:taskId/status', validateTaskStatus, communityController.updateTaskStatus);

router.post('/responders/:id/tasks/:taskId/decline', communityController.declineTask);
router.post('/:id/tasks/:taskId/decline', communityController.declineTask);

// Direct single profile route
router.get('/:id', communityController.getProfile);

module.exports = router;
