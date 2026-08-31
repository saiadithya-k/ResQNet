const hospitalService = require('../services/hospital/hospital.service');
const specialistService = require('../services/hospital/specialist.service');
const hospitalMatchingService = require('../services/hospital/hospital-matching.service');
const patientService = require('../services/hospital/patient.service');
const resourceService = require('../services/hospital/resource.service');

/**
 * List all hospitals
 * GET /api/hospitals
 */
exports.getAllHospitals = async (req, res, next) => {
  try {
    const list = await hospitalService.getAllHospitals(req.query);
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
 * Get hospital by ID
 * GET /api/hospitals/:id
 */
exports.getHospitalById = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hospital capacity details
 * GET /api/hospitals/:id/capacity
 */
exports.getHospitalCapacity = async (req, res, next) => {
  try {
    const capacity = await hospitalService.getHospitalCapacity(req.params.id);
    res.json({
      success: true,
      data: capacity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new hospital
 * POST /api/hospitals
 */
exports.createHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.createHospital(req.body);
    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully',
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update hospital profile
 * PATCH /api/hospitals/:id
 */
exports.updateHospital = async (req, res, next) => {
  try {
    const updated = await hospitalService.updateHospital(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update hospital capacity
 * PATCH /api/hospitals/:id/capacity
 */
exports.updateCapacity = async (req, res, next) => {
  try {
    const updated = await hospitalService.updateHospitalCapacity(req.params.id, req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:capacity_updated', {
        hospitalId: updated.hospitalId,
        capacity: updated,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Hospital capacity updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a hospital
 * DELETE /api/hospitals/:id
 */
exports.deleteHospital = async (req, res, next) => {
  try {
    const deactivated = await hospitalService.deactivateHospital(req.params.id);
    res.json({
      success: true,
      message: 'Hospital deactivated successfully',
      data: deactivated
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// SPECIALIST CONTROLLER METHODS (P4-03)
// ====================================================

/**
 * List specialists belonging to a hospital
 * GET /api/hospitals/:hospitalId/specialists
 */
exports.getHospitalSpecialists = async (req, res, next) => {
  try {
    const specialists = await specialistService.getHospitalSpecialists(req.params.hospitalId, req.query);
    res.json({
      success: true,
      count: specialists.length,
      data: specialists
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specialist by ID scoped to hospital
 * GET /api/hospitals/:hospitalId/specialists/:specialistId
 */
exports.getSpecialistById = async (req, res, next) => {
  try {
    const specialist = await specialistService.getSpecialist(req.params.hospitalId, req.params.specialistId);
    res.json({
      success: true,
      data: specialist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new specialist to a hospital
 * POST /api/hospitals/:hospitalId/specialists
 */
exports.createSpecialist = async (req, res, next) => {
  try {
    const specialist = await specialistService.createSpecialist(req.params.hospitalId, req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:specialist_updated', {
        hospitalId: specialist.hospitalId,
        specialistId: specialist.id,
        specialty: specialist.specialty,
        status: specialist.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Specialist registered successfully',
      data: specialist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update specialist details
 * PATCH /api/hospitals/:hospitalId/specialists/:specialistId
 */
exports.updateSpecialist = async (req, res, next) => {
  try {
    const updated = await specialistService.updateSpecialist(
      req.params.hospitalId,
      req.params.specialistId,
      req.body
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:specialist_updated', {
        hospitalId: updated.hospitalId,
        specialistId: updated.id,
        specialty: updated.specialty,
        status: updated.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Specialist updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a specialist
 * DELETE /api/hospitals/:hospitalId/specialists/:specialistId
 */
exports.deleteSpecialist = async (req, res, next) => {
  try {
    const deactivated = await specialistService.deactivateSpecialist(
      req.params.hospitalId,
      req.params.specialistId
    );

    res.json({
      success: true,
      message: 'Specialist deactivated successfully',
      data: deactivated
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// HOSPITAL MATCHING CONTROLLER METHODS (P4-04)
// ====================================================

/**
 * Match and rank candidate hospitals for an incident
 * GET /api/hospitals/match/:incidentId / POST /api/hospitals/match/:incidentId
 */
exports.matchHospitals = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const options = {
      ...(req.query || {}),
      ...(req.body || {})
    };

    const matchResult = await hospitalMatchingService.matchHospitalsForIncident(incidentId, options);

    res.json({
      success: true,
      data: matchResult
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// INCOMING PATIENT CONTROLLER METHODS (P4-05)
// ====================================================

/**
 * List incoming patients for a hospital
 * GET /api/hospitals/:hospitalId/patients
 */
exports.getHospitalPatients = async (req, res, next) => {
  try {
    const patients = await patientService.getHospitalIncomingPatients(
      req.params.hospitalId,
      req.query
    );
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single patient by ID scoped to hospital
 * GET /api/hospitals/:hospitalId/patients/:patientId
 */
exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await patientService.getIncomingPatient(
      req.params.hospitalId,
      req.params.patientId
    );
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new incoming patient
 * POST /api/hospitals/:hospitalId/patients
 */
exports.createIncomingPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createIncomingPatient(
      req.params.hospitalId,
      req.body
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:patient_incoming', {
        hospitalId: patient.hospitalId,
        patientId: patient.id,
        triageSeverity: patient.triageSeverity,
        status: patient.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Incoming patient record created successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient operational metadata
 * PATCH /api/hospitals/:hospitalId/patients/:patientId
 */
exports.updateIncomingPatient = async (req, res, next) => {
  try {
    const updated = await patientService.updateIncomingPatient(
      req.params.hospitalId,
      req.params.patientId,
      req.body
    );

    res.json({
      success: true,
      message: 'Patient metadata updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient intake lifecycle status
 * PATCH /api/hospitals/:hospitalId/patients/:patientId/status
 */
exports.updatePatientStatus = async (req, res, next) => {
  try {
    const updated = await patientService.updateIntakeStatus(
      req.params.hospitalId,
      req.params.patientId,
      req.body.status
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:patient_status_changed', {
        hospitalId: updated.hospitalId,
        patientId: updated.id,
        status: updated.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Patient status updated to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// HOSPITAL RESOURCE CONTROLLER METHODS (P4-06)
// ====================================================

/**
 * List resources belonging to a hospital
 * GET /api/hospitals/:hospitalId/resources
 */
exports.getHospitalResources = async (req, res, next) => {
  try {
    const resources = await resourceService.getHospitalResources(
      req.params.hospitalId,
      req.query
    );
    res.json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single hospital resource by ID
 * GET /api/hospitals/:hospitalId/resources/:resourceId
 */
exports.getResourceById = async (req, res, next) => {
  try {
    const resource = await resourceService.getResourceById(
      req.params.hospitalId,
      req.params.resourceId
    );
    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new hospital resource
 * POST /api/hospitals/:hospitalId/resources
 */
exports.createResource = async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(
      req.params.hospitalId,
      req.body
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:resource_updated', {
        hospitalId: resource.hospitalId,
        resourceId: resource.id,
        category: resource.category,
        quantity: resource.quantity,
        availableQty: resource.availableQty,
        status: resource.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Hospital resource registered successfully',
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a hospital resource
 * PATCH /api/hospitals/:hospitalId/resources/:resourceId
 */
exports.updateResource = async (req, res, next) => {
  try {
    const updated = await resourceService.updateResource(
      req.params.hospitalId,
      req.params.resourceId,
      req.body
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:resource_updated', {
        hospitalId: updated.hospitalId,
        resourceId: updated.id,
        category: updated.category,
        quantity: updated.quantity,
        availableQty: updated.availableQty,
        status: updated.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Hospital resource updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a hospital resource
 * DELETE /api/hospitals/:hospitalId/resources/:resourceId
 */
exports.deleteResource = async (req, res, next) => {
  try {
    const deactivated = await resourceService.deactivateResource(
      req.params.hospitalId,
      req.params.resourceId
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('hospital:resource_updated', {
        hospitalId: deactivated.hospitalId,
        resourceId: deactivated.id,
        category: deactivated.category,
        quantity: deactivated.quantity,
        availableQty: deactivated.availableQty,
        status: deactivated.status,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Hospital resource deactivated successfully',
      data: deactivated
    });
  } catch (error) {
    next(error);
  }
};



