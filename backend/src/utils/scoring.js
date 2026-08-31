/**
 * Emergency Prioritization & Severity Scoring Algorithms
 */
function calculatePriorityScore({
  severity = 'MEDIUM',
  victimCount = 1,
  hasTrapped = false,
  hasInjuries = false,
  hasFire = false,
  hasHazmat = false,
  emotionalUrgency = 'MEDIUM',
  vulnerableCount = 0
}) {
  let score = 30; // base score

  // Severity Weight
  if (severity === 'CRITICAL') score += 35;
  else if (severity === 'HIGH') score += 25;
  else if (severity === 'MEDIUM') score += 15;
  else score += 5;

  // Victim and Vulnerability Weight
  score += Math.min(20, victimCount * 3);
  score += Math.min(10, vulnerableCount * 2);

  // Critical hazard amplifiers
  if (hasTrapped) score += 12;
  if (hasInjuries) score += 8;
  if (hasFire) score += 10;
  if (hasHazmat) score += 15;

  // Emotional Triage amplifier (Emotion is supplementary)
  if (emotionalUrgency === 'HIGH') score += 5;

  return Math.min(100, Math.max(1, score));
}

/**
 * Calculate skill compatibility score (0 - 100)
 */
function calculateSkillScore(requiredSkills = [], responderSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!responderSkills || responderSkills.length === 0) return 0;

  const matched = requiredSkills.filter(req =>
    responderSkills.some(s => s.trim().toLowerCase() === req.trim().toLowerCase())
  );

  return Math.round((matched.length / requiredSkills.length) * 100);
}

/**
 * Calculate equipment compatibility score (0 - 100)
 */
function calculateEquipmentScore(requiredEquipment = [], responderEquipment = []) {
  if (!requiredEquipment || requiredEquipment.length === 0) return 100;
  if (!responderEquipment || responderEquipment.length === 0) return 0;

  const matched = requiredEquipment.filter(req =>
    responderEquipment.some(e => e.trim().toLowerCase() === req.trim().toLowerCase())
  );

  return Math.round((matched.length / requiredEquipment.length) * 100);
}

/**
 * Calculate distance proximity score (0 - 100)
 */
function calculateDistanceScore(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) return 50;
  return Math.max(0, Math.min(100, Math.round(100 - (Number(distanceKm) * 5))));
}

/**
 * Calculate ETA travel time score (0 - 100)
 */
function calculateEtaScore(etaMinutes) {
  if (etaMinutes === null || etaMinutes === undefined || isNaN(etaMinutes)) return 50;
  return Math.max(0, Math.min(100, Math.round(100 - (Number(etaMinutes) * 2))));
}

/**
 * Calculate active workload score (0 - 100)
 */
function calculateWorkloadScore(activeDispatchesCount = 0) {
  const count = Math.max(0, Number(activeDispatchesCount) || 0);
  return Math.max(0, Math.min(100, 100 - (count * 40)));
}

/**
 * Calculate overall deterministic weighted match score (0 - 100)
 * Weights: Skill 25%, Equipment 20%, Distance 15%, ETA 10%, Fatigue Freshness 15%, Workload 15%
 */
function calculateResponderMatchScore({
  skillScore = 100,
  equipmentScore = 100,
  distanceScore = 50,
  etaScore = 50,
  fatigueScore = 0,
  workloadScore = 100
}) {
  const fatigueFreshness = Math.max(0, Math.min(100, 100 - (Number(fatigueScore) || 0)));

  const weightedSum =
    (Number(skillScore) * 0.25) +
    (Number(equipmentScore) * 0.20) +
    (Number(distanceScore) * 0.15) +
    (Number(etaScore) * 0.10) +
    (fatigueFreshness * 0.15) +
    (Number(workloadScore) * 0.15);

  return Math.min(100, Math.max(0, Math.round(weightedSum * 10) / 10));
}

/**
 * Calculate deterministic hospital match score (0 - 100)
 * Weights:
 * - General Bed Capacity: 30%
 * - ICU Availability: 25%
 * - Specialty Readiness: 25%
 * - Geographic Proximity: 20%
 */
function calculateHospitalMatchScore({
  hospital,
  distanceKm = null,
  requiredSpecialty = null,
  requiresIcu = false
}) {
  const reasons = [];

  // 1. Bed Capacity Factor (0 - 100) -> 30%
  let capacityScore = 0;
  if (hospital.totalBeds > 0) {
    const availRatio = hospital.availableBeds / hospital.totalBeds;
    capacityScore = Math.min(100, Math.max(0, Math.round(availRatio * 100)));
    reasons.push(`Bed capacity: ${hospital.availableBeds}/${hospital.totalBeds} beds available (${capacityScore}%)`);
  } else {
    reasons.push('No bed capacity registered');
  }

  // 2. ICU Availability Factor (0 - 100) -> 25%
  let icuScore = 0;
  if (hospital.totalIcu > 0) {
    const icuRatio = hospital.availableIcu / hospital.totalIcu;
    icuScore = Math.min(100, Math.max(0, Math.round(icuRatio * 100)));
    reasons.push(`ICU capacity: ${hospital.availableIcu}/${hospital.totalIcu} ICU rooms available (${icuScore}%)`);
  } else if (requiresIcu) {
    icuScore = 0;
    reasons.push('No ICU capacity available for critical case');
  } else {
    icuScore = 50; // Neutral baseline if ICU not explicitly required
    reasons.push('Standard case: ICU not strictly required');
  }

  // 3. Specialty Factor (0 - 100) -> 25%
  let specialtyScore = 50; // Baseline
  if (requiredSpecialty) {
    const normReq = requiredSpecialty.trim().toLowerCase();
    const activeSpecialists = (hospital.specialists || []).filter(s =>
      s.isActive &&
      s.status === 'AVAILABLE' &&
      s.specialty &&
      s.specialty.trim().toLowerCase().includes(normReq)
    );

    const hasInSpecList = (hospital.specializations || []).some(sp =>
      sp.trim().toLowerCase().includes(normReq)
    );

    if (activeSpecialists.length > 0) {
      specialtyScore = Math.min(100, 70 + (activeSpecialists.length * 15));
      reasons.push(`Specialty match: ${activeSpecialists.length} on-duty ${requiredSpecialty} specialists available`);
    } else if (hasInSpecList) {
      specialtyScore = 60;
      reasons.push(`Specialty registered in hospital departments (${requiredSpecialty})`);
    } else {
      specialtyScore = 0;
      reasons.push(`Specialty ${requiredSpecialty} not present on active roster`);
    }
  } else {
    specialtyScore = Math.min(100, 50 + ((hospital.specializations || []).length * 10));
    reasons.push(`General emergency readiness (${(hospital.specializations || []).length} departments active)`);
  }

  // 4. Distance Proximity Factor (0 - 100) -> 20%
  let distanceScore = 50; // Default if coordinates missing
  if (distanceKm !== null && distanceKm !== undefined) {
    distanceScore = Math.max(0, Math.min(100, Math.round(100 - (distanceKm * 3.5))));
    reasons.push(`Proximity: ${distanceKm} km straight-line distance (${distanceScore} pts)`);
  } else {
    reasons.push('Distance unavailable; applying neutral proximity baseline');
  }

  // Compute weighted sum
  const weightedSum =
    (capacityScore * 0.30) +
    (icuScore * 0.25) +
    (specialtyScore * 0.25) +
    (distanceScore * 0.20);

  const totalScore = Math.min(100, Math.max(0, Math.round(weightedSum * 10) / 10));

  return {
    score: totalScore,
    factors: {
      capacityScore,
      icuScore,
      specialtyScore,
      distanceScore
    },
    reasons
  };
}

module.exports = {
  calculatePriorityScore,
  calculateSkillScore,
  calculateEquipmentScore,
  calculateDistanceScore,
  calculateEtaScore,
  calculateWorkloadScore,
  calculateResponderMatchScore,
  calculateHospitalMatchScore
};
