const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responder.controller');

router.get('/', responderController.getAllResponders);
router.patch('/:id/location', responderController.updateLocation);

module.exports = router;
