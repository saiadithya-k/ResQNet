const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

class HospitalService {
  /**
   * Format hospital record for consistent API consumption
   */
  _formatHospital(profile) {
    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.hospitalName,
      hospitalName: profile.hospitalName,
      district: profile.district,
      latitude: profile.latitude,
      longitude: profile.longitude,
      status: profile.isAccepting ? 'ACTIVE' : 'INACTIVE',
      isAccepting: profile.isAccepting,
      totalBeds: profile.totalBeds,
      availableBeds: profile.availableBeds,
      totalIcu: profile.totalIcu,
      availableIcu: profile.availableIcu,
      totalTrauma: profile.totalTrauma,
      availableTrauma: profile.availableTrauma,
      ventilators: profile.ventilators,
      operatingRooms: profile.operatingRooms,
      specializations: profile.specializations || [],
      user: profile.user ? {
        id: profile.user.id,
        email: profile.user.email,
        name: profile.user.name,
        phone: profile.user.phone,
        role: profile.user.role
      } : null
    };
  }

  /**
   * Format hospital capacity metrics with derived occupancy
   */
  _formatCapacity(profile) {
    if (!profile) return null;

    const totalBeds = profile.totalBeds;
    const availableBeds = profile.availableBeds;
    const occupiedBeds = totalBeds - availableBeds;

    const totalIcu = profile.totalIcu;
    const availableIcu = profile.availableIcu;
    const occupiedIcu = totalIcu - availableIcu;

    const totalTrauma = profile.totalTrauma;
    const availableTrauma = profile.availableTrauma;
    const occupiedTrauma = totalTrauma - availableTrauma;

    const bedOccupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;
    const icuOccupancyRate = totalIcu > 0 ? Number(((occupiedIcu / totalIcu) * 100).toFixed(1)) : 0;

    return {
      hospitalId: profile.id,
      hospitalName: profile.hospitalName,
      district: profile.district,
      isAccepting: profile.isAccepting,
      status: profile.isAccepting ? 'ACTIVE' : 'INACTIVE',
      totalBeds,
      availableBeds,
      occupiedBeds,
      bedOccupancyRate,
      totalIcu,
      availableIcu,
      occupiedIcu,
      icuOccupancyRate,
      totalTrauma,
      availableTrauma,
      occupiedTrauma,
      ventilators: profile.ventilators,
      operatingRooms: profile.operatingRooms
    };
  }

  /**
   * Internal helper to find hospital profile by ID or User ID
   */
  async _findProfile(id) {
    let profile = await prisma.hospitalProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!profile) {
      profile = await prisma.hospitalProfile.findUnique({
        where: { userId: id },
        include: { user: true }
      });
    }

    return profile;
  }

  /**
   * List all hospitals with optional query filtering
   */
  async getAllHospitals(filters = {}) {
    const where = {};

    if (filters.district) {
      where.district = { contains: filters.district, mode: 'insensitive' };
    }

    if (filters.status) {
      where.isAccepting = (filters.status.toUpperCase() === 'ACTIVE');
    }

    if (filters.isAccepting !== undefined) {
      where.isAccepting = (String(filters.isAccepting) === 'true');
    }

    const profiles = await prisma.hospitalProfile.findMany({
      where,
      include: { user: true },
      orderBy: { hospitalName: 'asc' }
    });

    return profiles.map(p => this._formatHospital(p));
  }

  /**
   * Get single hospital by ID
   */
  async getHospitalById(id) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Hospital not found', 404);
    }

    return this._formatHospital(profile);
  }

  /**
   * Get hospital capacity by ID
   */
  async getHospitalCapacity(id) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Hospital not found', 404);
    }

    return this._formatCapacity(profile);
  }

  /**
   * Update hospital capacity with strict invariant validation
   */
  async updateHospitalCapacity(id, data) {
    if (!data || Object.keys(data).length === 0) {
      throw new AppError('Capacity update payload cannot be empty', 400);
    }

    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Hospital not found', 404);
    }

    const totalBeds = data.totalBeds !== undefined ? Number(data.totalBeds) : profile.totalBeds;
    const availableBeds = data.availableBeds !== undefined ? Number(data.availableBeds) : profile.availableBeds;

    const totalIcu = data.totalIcu !== undefined ? Number(data.totalIcu) :
      (data.totalICUBeds !== undefined ? Number(data.totalICUBeds) : profile.totalIcu);
    const availableIcu = data.availableIcu !== undefined ? Number(data.availableIcu) :
      (data.availableICUBeds !== undefined ? Number(data.availableICUBeds) : profile.availableIcu);

    const totalTrauma = data.totalTrauma !== undefined ? Number(data.totalTrauma) : profile.totalTrauma;
    const availableTrauma = data.availableTrauma !== undefined ? Number(data.availableTrauma) : profile.availableTrauma;

    const ventilators = data.ventilators !== undefined ? Number(data.ventilators) : profile.ventilators;
    const operatingRooms = data.operatingRooms !== undefined ? Number(data.operatingRooms) : profile.operatingRooms;
    const isAccepting = data.isAccepting !== undefined ? Boolean(data.isAccepting) : profile.isAccepting;

    // Enforce Invariants
    if (totalBeds < 0 || availableBeds < 0) {
      throw new AppError('Bed counts cannot be negative', 400);
    }

    if (availableBeds > totalBeds) {
      throw new AppError('Available beds cannot exceed total beds', 400);
    }

    if (totalIcu < 0 || availableIcu < 0) {
      throw new AppError('ICU bed counts cannot be negative', 400);
    }

    if (availableIcu > totalIcu) {
      throw new AppError('Available ICU beds cannot exceed total ICU beds', 400);
    }

    if (totalIcu > totalBeds) {
      throw new AppError('Total ICU beds cannot exceed total hospital beds', 400);
    }

    if (totalTrauma < 0 || availableTrauma < 0) {
      throw new AppError('Trauma bed counts cannot be negative', 400);
    }

    if (availableTrauma > totalTrauma) {
      throw new AppError('Available trauma beds cannot exceed total trauma beds', 400);
    }

    if (ventilators < 0 || operatingRooms < 0) {
      throw new AppError('Ventilators and operating rooms cannot be negative', 400);
    }

    const updated = await prisma.hospitalProfile.update({
      where: { id: profile.id },
      data: {
        totalBeds,
        availableBeds,
        totalIcu,
        availableIcu,
        totalTrauma,
        availableTrauma,
        ventilators,
        operatingRooms,
        isAccepting
      },
      include: { user: true }
    });

    return this._formatCapacity(updated);
  }

  /**
   * Register a new hospital
   */
  async createHospital(data) {
    const {
      name,
      hospitalName,
      district = 'Central',
      latitude = 13.0827,
      longitude = 80.2707,
      isAccepting = true,
      totalBeds = 50,
      availableBeds = 20,
      totalIcu = 10,
      availableIcu = 3,
      totalTrauma = 10,
      availableTrauma = 4,
      ventilators = 8,
      operatingRooms = 4,
      specializations = [],
      email,
      userId,
      phone
    } = data;

    const finalName = (hospitalName || name || '').trim();
    if (!finalName) {
      throw new AppError('Hospital name is required', 400);
    }

    let user;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found for provided userId', 400);
      }
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: finalName,
            phone: phone || null,
            passwordHash: 'DEMO_HOSPITAL_HASH',
            role: 'HOSPITAL'
          }
        });
      }
    } else {
      const generatedEmail = `hospital.${Date.now()}.${Math.floor(Math.random() * 1000)}@resqnet.org`;
      user = await prisma.user.create({
        data: {
          email: generatedEmail,
          name: finalName,
          phone: phone || null,
          passwordHash: 'DEMO_HOSPITAL_HASH',
          role: 'HOSPITAL'
        }
      });
    }

    // Check if user already has a hospital profile
    const existingProfile = await prisma.hospitalProfile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      throw new AppError('Hospital profile already exists for this user', 409);
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    const profile = await prisma.hospitalProfile.create({
      data: {
        userId: user.id,
        hospitalName: finalName,
        district,
        latitude: lat,
        longitude: lon,
        totalBeds: Number(totalBeds),
        availableBeds: Number(availableBeds),
        totalIcu: Number(totalIcu),
        availableIcu: Number(availableIcu),
        totalTrauma: Number(totalTrauma),
        availableTrauma: Number(availableTrauma),
        ventilators: Number(ventilators),
        operatingRooms: Number(operatingRooms),
        isAccepting: Boolean(isAccepting),
        specializations: Array.isArray(specializations) ? specializations : []
      },
      include: { user: true }
    });

    return this._formatHospital(profile);
  }

  /**
   * Update hospital profile metadata or coordinates
   */
  async updateHospital(id, data) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Hospital not found', 404);
    }

    const updateData = {};

    if (data.hospitalName !== undefined || data.name !== undefined) {
      const newName = (data.hospitalName || data.name || '').trim();
      if (!newName) {
        throw new AppError('Hospital name cannot be empty', 400);
      }
      updateData.hospitalName = newName;
    }

    if (data.district !== undefined) {
      updateData.district = String(data.district).trim();
    }

    if (data.latitude !== undefined) {
      updateData.latitude = Number(data.latitude);
    }

    if (data.longitude !== undefined) {
      updateData.longitude = Number(data.longitude);
    }

    if (data.isAccepting !== undefined) {
      updateData.isAccepting = Boolean(data.isAccepting);
    } else if (data.status !== undefined) {
      updateData.isAccepting = (String(data.status).toUpperCase() === 'ACTIVE');
    }

    if (data.specializations !== undefined && Array.isArray(data.specializations)) {
      updateData.specializations = data.specializations;
    }

    // Capacity fields if passed
    if (data.totalBeds !== undefined) updateData.totalBeds = Number(data.totalBeds);
    if (data.availableBeds !== undefined) updateData.availableBeds = Number(data.availableBeds);
    if (data.totalIcu !== undefined) updateData.totalIcu = Number(data.totalIcu);
    if (data.availableIcu !== undefined) updateData.availableIcu = Number(data.availableIcu);

    const updated = await prisma.hospitalProfile.update({
      where: { id: profile.id },
      data: updateData,
      include: { user: true }
    });

    return this._formatHospital(updated);
  }

  /**
   * Soft-deactivate a hospital
   */
  async deactivateHospital(id) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Hospital not found', 404);
    }

    const updated = await prisma.hospitalProfile.update({
      where: { id: profile.id },
      data: {
        isAccepting: false
      },
      include: { user: true }
    });

    return this._formatHospital(updated);
  }
}

module.exports = new HospitalService();
