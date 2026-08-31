const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');

router.get('/', resourceController.getResources);
router.get('/transfers', resourceController.getTransfers);
router.post('/transfers', resourceController.requestTransfer);

module.exports = router;
