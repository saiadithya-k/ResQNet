const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const mockState = require('../mockData');
const { AppError } = require('../../utils/errors');

const VALID_RESPONDER_STATUSES = [
  'AVAILABLE',
  'DISPATCHED',
  'EN_ROUTE',
  'ON_SCENE',
  'TRANSPORTING',
  'UNAVAILABLE',
  'OFF_DUTY'
];

const VALID_STATUS_TRANSITIONS = {
  AVAILABLE: ['DISPATCHED', 'EN_ROUTE', 'UNAVAILABLE', 'OFF_DUTY', 'AVAILABLE'],
  DISPATCHED: ['EN_ROUTE', 'ON_SCENE', 'AVAILABLE', 'UNAVAILABLE', 'OFF_DUTY', 'DISPATCHED'],
  EN_ROUTE: ['ON_SCENE', 'AVAILABLE', 'DISPATCHED', 'UNAVAILABLE', 'OFF_DUTY', 'EN_ROUTE'],
  ON_SCENE: ['TRANSPORTING', 'AVAILABLE', 'UNAVAILABLE', 'OFF_DUTY', 'ON_SCENE'],
  TRANSPORTING: ['AVAILABLE', 'ON_SCENE', 'UNAVAILABLE', 'OFF_DUTY', 'TRANSPORTING'],
  UNAVAILABLE: ['AVAILABLE', 'OFF_DUTY', 'UNAVAILABLE'],
  OFF_DUTY: ['AVAILABLE', 'UNAVAILABLE', 'OFF_DUTY']
};

class ResponderService {
  /**
   * Format responder profile with associated user information, omitting sensitive secrets.
   */
  _formatResponder(profile) {
    if (!profile) return null;
    const user = profile.user || {};
    return {
      id: profile.id,
      userId: profile.userId,
      name: user.name || null,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role || (profile.isCommunity ? 'COMMUNITY_RESPONDER' : 'RESPONDER'),
      avatarUrl: user.avatarUrl || null,
      badgeNumber: profile.badgeNumber || null,
      responderType: profile.responderType,
      type: profile.responderType, // Alias for backward compatibility
      isCommunity: Boolean(profile.isCommunity),
      isVerified: Boolean(profile.isVerified),
      status: profile.status,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      lastLocationTime: profile.lastLocationTime ?? null,
      skills: profile.skills || [],
      equipment: profile.equipment || [],
      dutyHours: profile.dutyHours ?? 0,
      consecutiveShifts: profile.consecutiveShifts ?? 0,
      fatigueScore: profile.fatigueScore ?? 0,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null
    };
  }

  /**
   * Find a responder profile by id or userId
   */
  async _findProfile(id) {
    return await prisma.responderProfile.findFirst({
      where: {
        OR: [
          { id: id },
          { userId: id }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
  }

  /**
   * List all responders matching query filters
   */
  async getAllResponders(filters = {}) {
    try {
      const where = {};

      if (filters.status) {
        where.status = filters.status;
      }

      const typeFilter = filters.responderType || filters.type;
      if (typeFilter) {
        where.responderType = typeFilter;
      }

      if (filters.isCommunity !== undefined) {
        where.isCommunity = String(filters.isCommunity).toLowerCase() === 'true';
      }

      const profiles = await prisma.responderProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });

      if (profiles && profiles.length > 0) {
        return profiles.map(p => this._formatResponder(p));
      }
    } catch (dbErr) {
      // Fallback gracefully to mock data
    }

    let list = mockState.responders ? [...mockState.responders] : [];
    if (filters.status) {
      list = list.filter(r => r.status === filters.status);
    }
    if (filters.isCommunity !== undefined) {
      list = list.filter(r => String(r.isCommunity) === String(filters.isCommunity));
    }
    return list;
  }

  /**
   * Get single responder by ID
   */
  async getResponderById(id) {
    try {
      const profile = await this._findProfile(id);
      if (profile) {
        return this._formatResponder(profile);
      }
    } catch (dbErr) {}

    const mockR = mockState.responders ? mockState.responders.find(r => r.id === id) : null;
    if (mockR) return mockR;

    throw new AppError('Responder not found', 404);
  }

  /**
   * Create a new professional or community responder
   */
  async createResponder(data) {
    const {
      name,
      email,
      password,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity = false,
      isVerified = false,
      status = 'AVAILABLE',
      skills = [],
      equipment = []
    } = data;

    const normalizedEmail = email.trim().toLowerCase();
    const effectiveType = (responderType || type || '').trim();

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Check unique badge number if provided
    if (badgeNumber && badgeNumber.trim() !== '') {
      const existingBadge = await prisma.responderProfile.findUnique({
        where: { badgeNumber: badgeNumber.trim() }
      });
      if (existingBadge) {
        throw new AppError('Responder with this badge number already exists', 409);
      }
    }

    // Hash password
    const rawPassword = password || 'ResQNet@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const userRole = isCommunity ? 'COMMUNITY_RESPONDER' : 'RESPONDER';

    // Atomic transaction creating User and ResponderProfile
    const newProfile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          phone: phone ? phone.trim() : null,
          avatarUrl: avatarUrl || null,
          role: userRole
        }
      });

      const profile = await tx.responderProfile.create({
        data: {
          userId: user.id,
          badgeNumber: badgeNumber ? badgeNumber.trim() : null,
          responderType: effectiveType,
          isCommunity: Boolean(isCommunity),
          isVerified: Boolean(isVerified),
          status: status || 'AVAILABLE',
          skills: Array.isArray(skills) ? skills : [],
          equipment: Array.isArray(equipment) ? equipment : []
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      return profile;
    });

    return this._formatResponder(newProfile);
  }

  /**
   * Update existing responder details
   */
  async updateResponder(id, data) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const {
      name,
      email,
      phone,
      avatarUrl,
      badgeNumber,
      responderType,
      type,
      isCommunity,
      isVerified,
      status,
      skills,
      equipment,
      latitude,
      longitude,
      lastLocationTime
    } = data;

    // Check email conflict if updating email
    if (email && email.trim().toLowerCase() !== existing.user.email.toLowerCase()) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (emailInUse && emailInUse.id !== existing.userId) {
        throw new AppError('Email is already in use by another user', 409);
      }
    }

    // Check badge number conflict if updating badgeNumber
    if (badgeNumber && badgeNumber.trim() !== existing.badgeNumber) {
      const badgeInUse = await prisma.responderProfile.findUnique({
        where: { badgeNumber: badgeNumber.trim() }
      });
      if (badgeInUse && badgeInUse.id !== existing.id) {
        throw new AppError('Badge number is already in use by another responder', 409);
      }
    }

    // Prepare User updates
    const userData = {};
    if (name !== undefined) userData.name = name.trim();
    if (email !== undefined) userData.email = email.trim().toLowerCase();
    if (phone !== undefined) userData.phone = phone ? phone.trim() : null;
    if (avatarUrl !== undefined) userData.avatarUrl = avatarUrl;

    // Prepare Profile updates
    const profileData = {};
    const effectiveType = responderType !== undefined ? responderType : type;
    if (effectiveType !== undefined) profileData.responderType = effectiveType.trim();
    if (badgeNumber !== undefined) profileData.badgeNumber = badgeNumber ? badgeNumber.trim() : null;
    if (isCommunity !== undefined) profileData.isCommunity = Boolean(isCommunity);
    if (isVerified !== undefined) profileData.isVerified = Boolean(isVerified);
    if (status !== undefined) profileData.status = status;
    if (skills !== undefined) profileData.skills = Array.isArray(skills) ? skills : [];
    if (equipment !== undefined) profileData.equipment = Array.isArray(equipment) ? equipment : [];
    if (latitude !== undefined) profileData.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) profileData.longitude = longitude !== null ? Number(longitude) : null;
    if (lastLocationTime !== undefined) profileData.lastLocationTime = lastLocationTime ? new Date(lastLocationTime) : new Date();
    else if (latitude !== undefined || longitude !== undefined) profileData.lastLocationTime = new Date();

    const updatedProfile = await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData
        });
      }

      const profile = await tx.responderProfile.update({
        where: { id: existing.id },
        data: profileData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      return profile;
    });

    return this._formatResponder(updatedProfile);
  }

  /**
   * Soft-deactivate responder by setting status to OFF_DUTY
   */
  async deactivateResponder(id) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        status: 'OFF_DUTY'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    return this._formatResponder(updatedProfile);
  }

  /**
   * Update responder operational status with lifecycle validation
   */
  async updateResponderStatus(id, newStatus) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!newStatus || typeof newStatus !== 'string') {
      throw new AppError('Status is required and must be a valid string', 400);
    }

    const targetStatus = newStatus.trim();

    if (!VALID_RESPONDER_STATUSES.includes(targetStatus)) {
      throw new AppError(`Invalid status. Must be one of: ${VALID_RESPONDER_STATUSES.join(', ')}`, 400);
    }

    const currentStatus = existing.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}.`,
        400
      );
    }

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        status: targetStatus
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    return {
      responder: this._formatResponder(updatedProfile),
      previousStatus: currentStatus
    };
  }

  /**
   * Update responder GPS location and authoritative server timestamp
   */
  async updateResponderLocation(id, latitude, longitude) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const now = new Date();

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        latitude: lat,
        longitude: lng,
        lastLocationTime: now
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    return this._formatResponder(updatedProfile);
  }

  // ==========================================
  // SKILLS MANAGEMENT
  // ==========================================

  /**
   * Get responder skills array
   */
  async getResponderSkills(id) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }
    return existing.skills || [];
  }

  /**
   * Add a single skill to responder's skill list
   */
  async addResponderSkill(id, skill) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!skill || typeof skill !== 'string' || skill.trim() === '') {
      throw new AppError('Skill is required and must be a non-empty string', 400);
    }

    const trimmed = skill.trim();
    const currentSkills = existing.skills || [];

    if (currentSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      throw new AppError(`Skill '${trimmed}' already exists for this responder`, 409);
    }

    const updatedSkills = [...currentSkills, trimmed];

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        skills: updatedSkills
      }
    });

    return updatedProfile.skills;
  }

  /**
   * Replace/update entire skill collection for a responder
   */
  async updateResponderSkills(id, skills) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!Array.isArray(skills)) {
      throw new AppError('Skills must be an array of strings', 400);
    }

    const normalized = [];
    const seen = new Set();

    for (const s of skills) {
      if (typeof s !== 'string' || s.trim() === '') {
        throw new AppError('Each skill must be a non-empty string', 400);
      }
      const trimmed = s.trim();
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        normalized.push(trimmed);
      }
    }

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        skills: normalized
      }
    });

    return updatedProfile.skills;
  }

  /**
   * Remove a specific skill from responder's skill list
   */
  async removeResponderSkill(id, skill) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!skill || typeof skill !== 'string' || skill.trim() === '') {
      throw new AppError('Skill name to remove is required', 400);
    }

    const target = skill.trim().toLowerCase();
    const currentSkills = existing.skills || [];
    const updatedSkills = currentSkills.filter(s => s.trim().toLowerCase() !== target);

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        skills: updatedSkills
      }
    });

    return updatedProfile.skills;
  }

  // ==========================================
  // CERTIFICATIONS MANAGEMENT
  // ==========================================

  /**
   * Helper to validate and parse certification dates
   */
  _validateCertDates(issuedDate, expiryDate, existingIssued = null, existingExpiry = null) {
    let parsedIssued = existingIssued;
    let parsedExpiry = existingExpiry;

    if (issuedDate !== undefined) {
      if (issuedDate === null || issuedDate === '') {
        parsedIssued = null;
      } else {
        const d = new Date(issuedDate);
        if (isNaN(d.getTime())) {
          throw new AppError('Invalid issuedDate format. Must be a valid date', 400);
        }
        parsedIssued = d;
      }
    }

    if (expiryDate !== undefined) {
      if (expiryDate === null || expiryDate === '') {
        parsedExpiry = null;
      } else {
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) {
          throw new AppError('Invalid expiryDate format. Must be a valid date', 400);
        }
        parsedExpiry = d;
      }
    }

    if (parsedIssued && parsedExpiry && parsedExpiry < parsedIssued) {
      throw new AppError('Expiry date cannot be earlier than issue date', 400);
    }

    return { parsedIssued, parsedExpiry };
  }

  /**
   * Get all certifications for a responder
   */
  async getResponderCertifications(id) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    return await prisma.certification.findMany({
      where: { responderId: existing.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get single certification by ID with ownership verification
   */
  async getResponderCertification(id, certificationId) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const cert = await prisma.certification.findFirst({
      where: {
        id: certificationId,
        responderId: existing.id
      }
    });

    if (!cert) {
      throw new AppError('Certification not found for this responder', 404);
    }

    return cert;
  }

  /**
   * Create a new certification for a responder
   */
  async createResponderCertification(id, data) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const { name, issuingOrg, certificateNumber, issuedDate, expiryDate, isVerified } = data;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new AppError('Certification name is required and must be a non-empty string', 400);
    }

    const { parsedIssued, parsedExpiry } = this._validateCertDates(issuedDate, expiryDate);

    const created = await prisma.certification.create({
      data: {
        responderId: existing.id,
        name: name.trim(),
        issuingOrg: issuingOrg ? issuingOrg.trim() : null,
        certificateNumber: certificateNumber ? certificateNumber.trim() : null,
        issuedDate: parsedIssued,
        expiryDate: parsedExpiry,
        isVerified: Boolean(isVerified)
      }
    });

    return created;
  }

  /**
   * Update existing certification for a responder
   */
  async updateResponderCertification(id, certificationId, data) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const cert = await prisma.certification.findFirst({
      where: {
        id: certificationId,
        responderId: existing.id
      }
    });

    if (!cert) {
      throw new AppError('Certification not found for this responder', 404);
    }

    const { name, issuingOrg, certificateNumber, issuedDate, expiryDate, isVerified } = data;

    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Certification name must be a non-empty string', 400);
      }
      updateData.name = name.trim();
    }
    if (issuingOrg !== undefined) updateData.issuingOrg = issuingOrg ? issuingOrg.trim() : null;
    if (certificateNumber !== undefined) updateData.certificateNumber = certificateNumber ? certificateNumber.trim() : null;
    if (isVerified !== undefined) updateData.isVerified = Boolean(isVerified);

    if (issuedDate !== undefined || expiryDate !== undefined) {
      const { parsedIssued, parsedExpiry } = this._validateCertDates(
        issuedDate,
        expiryDate,
        cert.issuedDate,
        cert.expiryDate
      );
      if (issuedDate !== undefined) updateData.issuedDate = parsedIssued;
      if (expiryDate !== undefined) updateData.expiryDate = parsedExpiry;
    }

    const updated = await prisma.certification.update({
      where: { id: cert.id },
      data: updateData
    });

    return updated;
  }

  /**
   * Delete a certification with ownership verification
   */
  async deleteResponderCertification(id, certificationId) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    const cert = await prisma.certification.findFirst({
      where: {
        id: certificationId,
        responderId: existing.id
      }
    });

    if (!cert) {
      throw new AppError('Certification not found for this responder', 404);
    }

    await prisma.certification.delete({
      where: { id: cert.id }
    });

    return { deleted: true, id: certificationId };
  }

  // ==========================================
  // EQUIPMENT MANAGEMENT
  // ==========================================

  /**
   * Get responder equipment array
   */
  async getResponderEquipment(id) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }
    return existing.equipment || [];
  }

  /**
   * Add a single equipment item to responder's inventory
   */
  async addResponderEquipment(id, item) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!item || typeof item !== 'string' || item.trim() === '') {
      throw new AppError('Equipment item is required and must be a non-empty string', 400);
    }

    const trimmed = item.trim();
    const currentEquipment = existing.equipment || [];

    if (currentEquipment.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      throw new AppError(`Equipment item '${trimmed}' already exists for this responder`, 409);
    }

    const updatedEquipment = [...currentEquipment, trimmed];

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        equipment: updatedEquipment
      }
    });

    return updatedProfile.equipment;
  }

  /**
   * Replace/update entire equipment collection for a responder
   */
  async updateResponderEquipment(id, equipment) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!Array.isArray(equipment)) {
      throw new AppError('Equipment must be an array of strings', 400);
    }

    const normalized = [];
    const seen = new Set();

    for (const item of equipment) {
      if (typeof item !== 'string' || item.trim() === '') {
        throw new AppError('Each equipment item must be a non-empty string', 400);
      }
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        normalized.push(trimmed);
      }
    }

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        equipment: normalized
      }
    });

    return updatedProfile.equipment;
  }

  /**
   * Remove a specific equipment item from responder's inventory
   */
  async removeResponderEquipment(id, item) {
    const existing = await this._findProfile(id);
    if (!existing) {
      throw new AppError('Responder not found', 404);
    }

    if (!item || typeof item !== 'string' || item.trim() === '') {
      throw new AppError('Equipment item name to remove is required', 400);
    }

    const target = item.trim().toLowerCase();
    const currentEquipment = existing.equipment || [];
    const updatedEquipment = currentEquipment.filter(e => e.trim().toLowerCase() !== target);

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: existing.id },
      data: {
        equipment: updatedEquipment
      }
    });

    return updatedProfile.equipment;
  }
}

module.exports = new ResponderService();
