const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital.controller');
const resourceCoordinationController = require('../controllers/resource-coordination.controller');
const reconciliationController = require('../controllers/reconciliation.controller');
const {
  validateCreateHospital,
  validateUpdateHospital,
  validateCapacityUpdate,
  validateHospitalMatchParams
} = require('../middleware/hospital.validation');
const {
  validateCreateSpecialist,
  validateUpdateSpecialist
} = require('../middleware/specialist.validation');
const {
  validateCreatePatient,
  validateUpdatePatient,
  validateUpdatePatientStatus
} = require('../middleware/patient.validation');
const {
  validateCreateResource,
  validateUpdateResource
} = require('../middleware/resource.validation');

// ==========================================
// HOSPITAL RESOURCE ROUTES (P4-06)
// ==========================================

// List resources for a hospital
router.get('/:hospitalId/resources', hospitalController.getHospitalResources);

// Get single resource by ID
router.get('/:hospitalId/resources/:resourceId', hospitalController.getResourceById);

// Create / register resource under a hospital
router.post('/:hospitalId/resources', validateCreateResource, hospitalController.createResource);

// Update resource details and quantities
router.patch('/:hospitalId/resources/:resourceId', validateUpdateResource, hospitalController.updateResource);

// Deactivate resource
router.delete('/:hospitalId/resources/:resourceId', hospitalController.deleteResource);

// ==========================================
// HOSPITAL COORDINATION REQUESTS (P4-07)
// ==========================================
router.get('/:hospitalId/coordination-requests', resourceCoordinationController.getHospitalCoordinationRequests);

// ==========================================
// HOSPITAL RECONCILIATION RECORDS (P4-09)
// ==========================================
router.get('/:hospitalId/reconciliations', reconciliationController.getHospitalReconciliations);

// ==========================================
// HOSPITAL MATCHING ROUTES (P4-04)
// ==========================================
router.get('/match/:incidentId', validateHospitalMatchParams, hospitalController.matchHospitals);
router.post('/match/:incidentId', validateHospitalMatchParams, hospitalController.matchHospitals);

// ==========================================
// INCOMING PATIENT ROUTES (P4-05)
// ==========================================

// List incoming patients for a hospital
router.get('/:hospitalId/patients', hospitalController.getHospitalPatients);

// Get single incoming patient
router.get('/:hospitalId/patients/:patientId', hospitalController.getPatientById);

// Register incoming patient
router.post('/:hospitalId/patients', validateCreatePatient, hospitalController.createIncomingPatient);

// Update patient operational metadata
router.patch('/:hospitalId/patients/:patientId', validateUpdatePatient, hospitalController.updateIncomingPatient);

// Update patient intake status lifecycle
router.patch('/:hospitalId/patients/:patientId/status', validateUpdatePatientStatus, hospitalController.updatePatientStatus);

// ==========================================
// HOSPITAL CRUD & CAPACITY ROUTES
// ==========================================

// List all hospitals
router.get('/', hospitalController.getAllHospitals);

// Get hospital capacity (P4-02)
router.get('/:id/capacity', hospitalController.getHospitalCapacity);

// Update hospital capacity (P4-02)
router.patch('/:id/capacity', validateCapacityUpdate, hospitalController.updateCapacity);

// ==========================================
// HOSPITAL SPECIALIST ROUTES (P4-03)
// ==========================================

// List specialists for a hospital
router.get('/:hospitalId/specialists', hospitalController.getHospitalSpecialists);

// Get specialist by ID
router.get('/:hospitalId/specialists/:specialistId', hospitalController.getSpecialistById);

// Create / register specialist
router.post('/:hospitalId/specialists', validateCreateSpecialist, hospitalController.createSpecialist);

// Update specialist
router.patch('/:hospitalId/specialists/:specialistId', validateUpdateSpecialist, hospitalController.updateSpecialist);

// Deactivate specialist
router.delete('/:hospitalId/specialists/:specialistId', hospitalController.deleteSpecialist);

// ==========================================
// HOSPITAL INDIVIDUAL CRUD
// ==========================================

// Get single hospital by ID
router.get('/:id', hospitalController.getHospitalById);

// Create / register a new hospital
router.post('/', validateCreateHospital, hospitalController.createHospital);

// Update hospital details
router.patch('/:id', validateUpdateHospital, hospitalController.updateHospital);

// Deactivate hospital
router.delete('/:id', hospitalController.deleteHospital);

module.exports = router;
