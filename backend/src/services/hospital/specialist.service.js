const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

class SpecialistService {
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
   * List specialists belonging to a hospital with optional filtering
   */
  async getHospitalSpecialists(hospitalId, filters = {}) {
    const hospital = await this._findHospital(hospitalId);

    const where = {
      hospitalId: hospital.id,
      isActive: true
    };

    if (filters.specialty) {
      where.specialty = {
        contains: filters.specialty.trim(),
        mode: 'insensitive'
      };
    }

    if (filters.status || filters.availability) {
      const statusVal = (filters.status || filters.availability).trim().toUpperCase();
      where.status = statusVal;
    }

    if (filters.includeInactive === 'true') {
      delete where.isActive;
    }

    const specialists = await prisma.hospitalSpecialist.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return specialists;
  }

  /**
   * Get single specialist by ID scoped to hospital
   */
  async getSpecialist(hospitalId, specialistId) {
    const hospital = await this._findHospital(hospitalId);

    const specialist = await prisma.hospitalSpecialist.findUnique({
      where: { id: specialistId }
    });

    if (!specialist || specialist.hospitalId !== hospital.id) {
      throw new AppError('Specialist not found for this hospital', 404);
    }

    return specialist;
  }

  /**
   * Create a new specialist under a hospital
   */
  async createSpecialist(hospitalId, data) {
    const hospital = await this._findHospital(hospitalId);

    const name = (data.name || '').trim();
    const specialty = (data.specialty || '').trim();

    if (!name) {
      throw new AppError('Specialist name is required', 400);
    }

    if (!specialty) {
      throw new AppError('Specialty is required', 400);
    }

    const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'OFF_DUTY'];
    const rawStatus = (data.status || data.availability || 'AVAILABLE').trim().toUpperCase();
    if (!validStatuses.includes(rawStatus)) {
      throw new AppError(`Invalid specialist status. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    const specialist = await prisma.hospitalSpecialist.create({
      data: {
        hospitalId: hospital.id,
        name,
        specialty,
        subSpecialty: data.subSpecialty ? data.subSpecialty.trim() : null,
        status: rawStatus,
        phone: data.phone ? String(data.phone).trim() : null,
        email: data.email ? String(data.email).trim() : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });

    // Ensure specialty is included in hospital-level specializations array
    if (!hospital.specializations.includes(specialty)) {
      await prisma.hospitalProfile.update({
        where: { id: hospital.id },
        data: {
          specializations: {
            push: specialty
          }
        }
      });
    }

    return specialist;
  }

  /**
   * Update specialist details and availability
   */
  async updateSpecialist(hospitalId, specialistId, data) {
    if (!data || Object.keys(data).length === 0) {
      throw new AppError('Update payload cannot be empty', 400);
    }

    const hospital = await this._findHospital(hospitalId);

    const specialist = await prisma.hospitalSpecialist.findUnique({
      where: { id: specialistId }
    });

    if (!specialist || specialist.hospitalId !== hospital.id) {
      throw new AppError('Specialist not found for this hospital', 404);
    }

    const updateData = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) {
        throw new AppError('Specialist name cannot be empty', 400);
      }
      updateData.name = name;
    }

    if (data.specialty !== undefined) {
      const specialty = String(data.specialty).trim();
      if (!specialty) {
        throw new AppError('Specialty cannot be empty', 400);
      }
      updateData.specialty = specialty;
    }

    if (data.subSpecialty !== undefined) {
      updateData.subSpecialty = data.subSpecialty ? String(data.subSpecialty).trim() : null;
    }

    if (data.status !== undefined || data.availability !== undefined) {
      const rawStatus = (data.status || data.availability).trim().toUpperCase();
      const validStatuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'OFF_DUTY'];
      if (!validStatuses.includes(rawStatus)) {
        throw new AppError(`Invalid specialist status. Allowed: ${validStatuses.join(', ')}`, 400);
      }
      updateData.status = rawStatus;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone ? String(data.phone).trim() : null;
    }

    if (data.email !== undefined) {
      updateData.email = data.email ? String(data.email).trim() : null;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    const updated = await prisma.hospitalSpecialist.update({
      where: { id: specialist.id },
      data: updateData
    });

    // If specialty changed, update hospital-level specializations array
    if (updateData.specialty && !hospital.specializations.includes(updateData.specialty)) {
      await prisma.hospitalProfile.update({
        where: { id: hospital.id },
        data: {
          specializations: {
            push: updateData.specialty
          }
        }
      });
    }

    return updated;
  }

  /**
   * Deactivate a specialist
   */
  async deactivateSpecialist(hospitalId, specialistId) {
    const hospital = await this._findHospital(hospitalId);

    const specialist = await prisma.hospitalSpecialist.findUnique({
      where: { id: specialistId }
    });

    if (!specialist || specialist.hospitalId !== hospital.id) {
      throw new AppError('Specialist not found for this hospital', 404);
    }

    const deactivated = await prisma.hospitalSpecialist.update({
      where: { id: specialist.id },
      data: {
        isActive: false,
        status: 'UNAVAILABLE'
      }
    });

    return deactivated;
  }
}

module.exports = new SpecialistService();
