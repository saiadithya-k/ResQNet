const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');
const { calculateDistance, estimateEtaMinutes } = require('../../utils/geo');
const {
  calculateSkillScore,
  calculateEquipmentScore,
  calculateDistanceScore,
  calculateEtaScore,
  calculateWorkloadScore,
  calculateResponderMatchScore
} = require('../../utils/scoring');

class ResponderMatchingService {
  /**
   * Derive operational skill and equipment requirements from incident characteristics
   */
  deriveRequirements(incident, overrideSkills = null, overrideEquipment = null) {
    if (overrideSkills && Array.isArray(overrideSkills)) {
      return {
        requiredSkills: overrideSkills.map(s => s.trim()).filter(Boolean),
        requiredEquipment: (overrideEquipment && Array.isArray(overrideEquipment))
          ? overrideEquipment.map(e => e.trim()).filter(Boolean)
          : []
      };
    }

    const skills = new Set();
    const equipment = new Set();

    const type = (incident.incidentType || '').toUpperCase();

    switch (type) {
      case 'COLLAPSE':
        skills.add('Search and Rescue');
        skills.add('Trauma Triage');
        equipment.add('Rescue Equipment');
        equipment.add('Trauma Kit');
        break;
      case 'FIRE':
        skills.add('Fire Rescue');
        skills.add('Search and Rescue');
        equipment.add('Breathing Apparatus');
        equipment.add('Rescue Equipment');
        break;
      case 'HAZMAT':
        skills.add('Hazmat');
        skills.add('Decontamination');
        equipment.add('Hazmat Suit');
        equipment.add('Oxygen');
        break;
      case 'FLOOD':
        skills.add('Flood Rescue');
        skills.add('Water Rescue');
        equipment.add('Boat');
        equipment.add('Life Jacket');
        break;
      case 'MEDICAL':
      case 'ACCIDENT':
      default:
        skills.add('CPR');
        skills.add('Trauma');
        equipment.add('Trauma Kit');
        equipment.add('Oxygen');
        break;
    }

    if (incident.hasInjuries) {
      skills.add('CPR');
      skills.add('Trauma');
      equipment.add('Trauma Kit');
    }
    if (incident.hasTrapped) {
      skills.add('Search and Rescue');
      equipment.add('Rescue Equipment');
    }
    if (incident.hasHazmat) {
      skills.add('Hazmat');
      equipment.add('Hazmat Suit');
    }

    if (overrideEquipment && Array.isArray(overrideEquipment)) {
      return {
        requiredSkills: Array.from(skills),
        requiredEquipment: overrideEquipment.map(e => e.trim()).filter(Boolean)
      };
    }

    return {
      requiredSkills: Array.from(skills),
      requiredEquipment: Array.from(equipment)
    };
  }

  /**
   * Find and rank candidate responders for an incident
   */
  async findMatchesForIncident(incidentId, options = {}) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const { requiredSkills, requiredEquipment } = this.deriveRequirements(
      incident,
      options.requiredSkills,
      options.requiredEquipment
    );

    // Load candidate professional responders with active dispatches
    const candidateProfiles = await prisma.responderProfile.findMany({
      where: {
        status: {
          notIn: ['OFF_DUTY', 'UNAVAILABLE']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true
          }
        },
        dispatches: {
          where: {
            status: {
              in: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE']
            }
          }
        }
      }
    });

    const matches = candidateProfiles.map(profile => {
      // 1. Proximity & ETA calculations
      let distanceKm = null;
      let etaMinutes = null;

      if (
        profile.latitude !== null && profile.latitude !== undefined &&
        profile.longitude !== null && profile.longitude !== undefined &&
        incident.latitude !== null && incident.latitude !== undefined &&
        incident.longitude !== null && incident.longitude !== undefined
      ) {
        distanceKm = calculateDistance(
          incident.latitude,
          incident.longitude,
          profile.latitude,
          profile.longitude
        );
        etaMinutes = estimateEtaMinutes(distanceKm, 40);
      }

      // 2. Component scores
      const skillScore = calculateSkillScore(requiredSkills, profile.skills || []);
      const equipmentScore = calculateEquipmentScore(requiredEquipment, profile.equipment || []);
      const distanceScore = calculateDistanceScore(distanceKm);
      const etaScore = calculateEtaScore(etaMinutes);
      const fatigueScore = profile.fatigueScore || 0;
      const fatigueFreshnessScore = Math.max(0, 100 - fatigueScore);
      const workloadScore = calculateWorkloadScore(profile.dispatches.length);

      // 3. Deterministic weighted score
      const matchScore = calculateResponderMatchScore({
        skillScore,
        equipmentScore,
        distanceScore,
        etaScore,
        fatigueScore,
        workloadScore
      });

      // 4. Matched components
      const matchedSkills = (profile.skills || []).filter(s =>
        requiredSkills.some(req => req.trim().toLowerCase() === s.trim().toLowerCase())
      );
      const matchedEquipment = (profile.equipment || []).filter(e =>
        requiredEquipment.some(req => req.trim().toLowerCase() === e.trim().toLowerCase())
      );

      let fatigueLevel = 'LOW';
      if (fatigueScore >= 80) fatigueLevel = 'CRITICAL';
      else if (fatigueScore >= 60) fatigueLevel = 'HIGH';
      else if (fatigueScore >= 30) fatigueLevel = 'MODERATE';

      return {
        responderId: profile.id,
        userId: profile.userId,
        name: profile.user ? profile.user.name : null,
        badgeNumber: profile.badgeNumber,
        responderType: profile.responderType,
        status: profile.status,
        matchScore,
        distanceKm,
        etaMinutes,
        breakdown: {
          skillScore,
          equipmentScore,
          distanceScore,
          etaScore,
          fatigueScore,
          fatigueFreshnessScore,
          workloadScore
        },
        matchedSkills,
        matchedEquipment,
        fatigueLevel,
        activeDispatchesCount: profile.dispatches.length,
        isAvailable: profile.status === 'AVAILABLE'
      };
    });

    // Sort descending by matchScore
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return {
      incident: {
        id: incident.id,
        title: incident.title,
        incidentType: incident.incidentType,
        severity: incident.severity,
        priorityScore: incident.priorityScore,
        latitude: incident.latitude,
        longitude: incident.longitude,
        requiredSkills,
        requiredEquipment
      },
      count: matches.length,
      matches
    };
  }
}

module.exports = new ResponderMatchingService();
