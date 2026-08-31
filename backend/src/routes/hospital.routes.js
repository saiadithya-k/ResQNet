const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');

router.get('/', hospitalController.getAllHospitals);
router.patch('/:id/capacity', hospitalController.updateCapacity);

module.exports = router;
