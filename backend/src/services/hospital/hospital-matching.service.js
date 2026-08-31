const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');
const { calculateDistance } = require('../../utils/geo');
const { calculateHospitalMatchScore } = require('../../utils/scoring');

class HospitalMatchingService {
  /**
   * Deterministically match and rank candidate hospitals for an incident
   */
  async matchHospitalsForIncident(incidentId, options = {}) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    // 1. Derive incident requirements
    const requiredBeds = Math.max(1, Number(options.requiredBeds) || (incident.victimCount || 1));
    const requiresIcu = options.requiresIcu !== undefined
      ? Boolean(options.requiresIcu)
      : (incident.severity === 'CRITICAL' || incident.hasHazmat || incident.hasTrapped);

    let requiredSpecialty = options.requiredSpecialty || null;
    if (!requiredSpecialty) {
      if (incident.incidentType === 'MEDICAL') requiredSpecialty = 'Emergency Medicine';
      else if (incident.incidentType === 'FIRE') requiredSpecialty = 'Burn Unit';
      else if (incident.incidentType === 'HAZMAT') requiredSpecialty = 'Toxicology';
      else if (incident.hasInjuries) requiredSpecialty = 'Trauma';
    }

    const strictSpecialty = Boolean(options.strictSpecialty || options.requiredSpecialty);

    // 2. Fetch all hospitals from PostgreSQL
    const allHospitals = await prisma.hospitalProfile.findMany({
      include: {
        specialists: {
          where: { isActive: true }
        }
      }
    });

    const evaluatedHospitals = [];

    for (const hospital of allHospitals) {
      const ineligibilityReasons = [];

      // Hard Filter 1: Active accepting status
      if (!hospital.isAccepting) {
        ineligibilityReasons.push('Hospital is inactive or currently not accepting incoming patients');
      }

      // Hard Filter 2: General bed capacity
      if (hospital.availableBeds < requiredBeds || hospital.availableBeds === 0) {
        ineligibilityReasons.push(`Insufficient available beds (${hospital.availableBeds} available, ${requiredBeds} required)`);
      }

      // Hard Filter 3: ICU capacity
      if (requiresIcu && (hospital.availableIcu <= 0 || hospital.totalIcu <= 0)) {
        ineligibilityReasons.push('Critical case requires ICU, but hospital has 0 available ICU rooms');
      }

      // Hard Filter 4: Required specialty
      if (strictSpecialty && requiredSpecialty) {
        const normSpecialty = requiredSpecialty.trim().toLowerCase();
        const hasMatchingSpecialist = (hospital.specialists || []).some(s =>
          s.isActive &&
          s.status === 'AVAILABLE' &&
          s.specialty &&
          s.specialty.trim().toLowerCase().includes(normSpecialty)
        );

        const hasInSpecArray = (hospital.specializations || []).some(sp =>
          sp.trim().toLowerCase().includes(normSpecialty)
        );

        if (!hasMatchingSpecialist && !hasInSpecArray) {
          ineligibilityReasons.push(`Required specialty '${requiredSpecialty}' is not available at this hospital`);
        } else if (!hasMatchingSpecialist && hasInSpecArray) {
          // Has specialty department, but no on-duty available specialist
          const hasAnySpecialist = (hospital.specialists || []).some(s =>
            s.specialty && s.specialty.trim().toLowerCase().includes(normSpecialty)
          );
          if (hasAnySpecialist) {
            ineligibilityReasons.push(`Specialist in '${requiredSpecialty}' is on roster but currently unavailable/busy`);
          }
        }
      }

      const isEligible = ineligibilityReasons.length === 0;

      // Calculate straight-line geographic distance
      let distanceKm = null;
      if (
        incident.latitude !== null && incident.latitude !== undefined &&
        incident.longitude !== null && incident.longitude !== undefined &&
        hospital.latitude !== null && hospital.latitude !== undefined &&
        hospital.longitude !== null && hospital.longitude !== undefined
      ) {
        distanceKm = calculateDistance(
          incident.latitude,
          incident.longitude,
          hospital.latitude,
          hospital.longitude
        );
      }

      // Calculate explainable multi-factor match score
      const scoringResult = calculateHospitalMatchScore({
        hospital,
        distanceKm,
        requiredSpecialty,
        requiresIcu
      });

      evaluatedHospitals.push({
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName,
        district: hospital.district,
        eligible: isEligible,
        ineligibilityReasons,
        score: isEligible ? scoringResult.score : 0,
        distanceKm,
        factors: scoringResult.factors,
        reasons: isEligible ? scoringResult.reasons : ineligibilityReasons,
        capacity: {
          totalBeds: hospital.totalBeds,
          availableBeds: hospital.availableBeds,
          totalIcu: hospital.totalIcu,
          availableIcu: hospital.availableIcu
        },
        availableSpecialists: (hospital.specialists || [])
          .filter(s => s.status === 'AVAILABLE')
          .map(s => ({ id: s.id, name: s.name, specialty: s.specialty }))
      });
    }

    // Filter only eligible hospitals for match output
    const matches = evaluatedHospitals.filter(h => h.eligible);

    // Deterministic tie-breaking:
    // 1) score DESC
    // 2) distanceKm ASC
    // 3) hospitalId ASC
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const distA = a.distanceKm !== null ? a.distanceKm : Infinity;
      const distB = b.distanceKm !== null ? b.distanceKm : Infinity;
      if (distA !== distB) {
        return distA - distB;
      }
      return a.hospitalId.localeCompare(b.hospitalId);
    });

    return {
      incident: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        incidentType: incident.incidentType,
        latitude: incident.latitude,
        longitude: incident.longitude
      },
      requirements: {
        requiredBeds,
        requiresIcu,
        requiredSpecialty
      },
      eligibleCount: matches.length,
      totalEvaluated: allHospitals.length,
      matches
    };
  }
}

module.exports = new HospitalMatchingService();
