const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

const ALLOWED_STATUSES = ['EXPECTED', 'ARRIVED', 'CHECKED_IN', 'ADMITTED', 'CANCELLED'];

const VALID_TRANSITIONS = {
  EXPECTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['ADMITTED', 'CANCELLED'],
  ADMITTED: [], // Terminal
  CANCELLED: [] // Terminal
};

class PatientService {
  /**
   * Internal helper to find and verify hospital existence
   */
  async _findHospital(hospitalId) {
    let hospital = await prisma.hospitalProfile.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      hospital = await prisma.hospitalProfile.findUnique({
        where: { userId: hospitalId }
      });
    }

    if (!hospital) {
      throw new AppError('Hospital not found', 404);
    }

    return hospital;
  }

  /**
   * Create an incoming patient intake record
   */
  async createIncomingPatient(hospitalId, data) {
    const hospital = await this._findHospital(hospitalId);

    // Validate incident if provided
    let validIncidentId = null;
    if (data.incidentId) {
      const incident = await prisma.incident.findUnique({
        where: { id: String(data.incidentId) }
      });
      if (incident) {
        validIncidentId = incident.id;
      }
    }

    const rawStatus = (data.status || 'EXPECTED').toUpperCase();
    if (!ALLOWED_STATUSES.includes(rawStatus)) {
      throw new AppError(`Invalid initial patient status '${data.status}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400);
    }

    let age = null;
    if (data.age !== undefined && data.age !== null) {
      const parsedAge = Number(data.age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150 || !Number.isInteger(parsedAge)) {
        throw new AppError('Age must be an integer between 0 and 150', 400);
      }
      age = parsedAge;
    }

    let expectedArrival = null;
    if (data.expectedArrival) {
      const date = new Date(data.expectedArrival);
      if (!isNaN(date.getTime())) {
        expectedArrival = date;
      }
    } else if (data.etaMinutes && Number(data.etaMinutes) > 0) {
      expectedArrival = new Date(Date.now() + Number(data.etaMinutes) * 60000);
    }

    const patient = await prisma.incomingPatient.create({
      data: {
        hospitalId: hospital.id,
        incidentId: validIncidentId,
        name: data.name ? String(data.name).trim() : 'Unknown Patient',
        age,
        gender: data.gender ? String(data.gender).toUpperCase() : 'UNKNOWN',
        triageSeverity: data.triageSeverity ? String(data.triageSeverity).toUpperCase() : 'MEDIUM',
        conditionSummary: data.conditionSummary ? String(data.conditionSummary).trim() : null,
        status: rawStatus,
        etaMinutes: data.etaMinutes ? Number(data.etaMinutes) : null,
        expectedArrival,
        notes: data.notes ? String(data.notes).trim() : null
      }
    });

    return patient;
  }

  /**
   * List all incoming patients for a hospital
   */
  async getHospitalIncomingPatients(hospitalId, filters = {}) {
    const hospital = await this._findHospital(hospitalId);

    const where = {
      hospitalId: hospital.id
    };

    if (filters.status) {
      where.status = String(filters.status).toUpperCase();
    }

    const patients = await prisma.incomingPatient.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return patients;
  }

  /**
   * Get single incoming patient by ID scoped to hospital
   */
  async getIncomingPatient(hospitalId, patientId) {
    const hospital = await this._findHospital(hospitalId);

    const patient = await prisma.incomingPatient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.hospitalId !== hospital.id) {
      throw new AppError('Patient not found for this hospital', 404);
    }

    return patient;
  }

  /**
   * Update patient operational metadata
   */
  async updateIncomingPatient(hospitalId, patientId, data) {
    if (!data || Object.keys(data).length === 0) {
      throw new AppError('Update payload cannot be empty', 400);
    }

    const hospital = await this._findHospital(hospitalId);

    const patient = await prisma.incomingPatient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.hospitalId !== hospital.id) {
      throw new AppError('Patient not found for this hospital', 404);
    }

    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = String(data.name).trim();
    }

    if (data.age !== undefined && data.age !== null) {
      const parsedAge = Number(data.age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150 || !Number.isInteger(parsedAge)) {
        throw new AppError('Age must be an integer between 0 and 150', 400);
      }
      updateData.age = parsedAge;
    }

    if (data.gender !== undefined) {
      updateData.gender = String(data.gender).toUpperCase();
    }

    if (data.triageSeverity !== undefined) {
      updateData.triageSeverity = String(data.triageSeverity).toUpperCase();
    }

    if (data.conditionSummary !== undefined) {
      updateData.conditionSummary = data.conditionSummary ? String(data.conditionSummary).trim() : null;
    }

    if (data.etaMinutes !== undefined) {
      updateData.etaMinutes = data.etaMinutes !== null ? Number(data.etaMinutes) : null;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes ? String(data.notes).trim() : null;
    }

    const updated = await prisma.incomingPatient.update({
      where: { id: patient.id },
      data: updateData
    });

    return updated;
  }

  /**
   * Update intake status with state machine transition enforcement
   */
  async updateIntakeStatus(hospitalId, patientId, newStatus) {
    const hospital = await this._findHospital(hospitalId);

    const patient = await prisma.incomingPatient.findUnique({
      where: { id: patientId }
    });

    if (!patient || patient.hospitalId !== hospital.id) {
      throw new AppError('Patient not found for this hospital', 404);
    }

    const targetStatus = String(newStatus || '').toUpperCase();
    if (!ALLOWED_STATUSES.includes(targetStatus)) {
      throw new AppError(`Invalid patient intake status '${newStatus}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`, 400);
    }

    const allowedTransitions = VALID_TRANSITIONS[patient.status] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new AppError(`Invalid status transition from '${patient.status}' to '${targetStatus}'`, 400);
    }

    const updateData = {
      status: targetStatus
    };

    const now = new Date();
    if (targetStatus === 'ARRIVED') {
      updateData.arrivedAt = now;
    } else if (targetStatus === 'CHECKED_IN') {
      updateData.checkedInAt = now;
    } else if (targetStatus === 'ADMITTED') {
      updateData.admittedAt = now;
    } else if (targetStatus === 'CANCELLED') {
      updateData.cancelledAt = now;
    }

    const updated = await prisma.incomingPatient.update({
      where: { id: patient.id },
      data: updateData
    });

    return updated;
  }
}

module.exports = new PatientService();
