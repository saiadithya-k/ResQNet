const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatch.controller');

router.post('/', dispatchController.dispatchResponder);

module.exports = router;
