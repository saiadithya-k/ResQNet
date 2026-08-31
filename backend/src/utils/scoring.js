/**
 * Emergency Prioritization & Severity Scoring Algorithms
 */

/**
 * Calculates a deterministic multi-factor priority score (1 - 100)
 * strictly prioritizing physical life-safety evidence over emotional signals.
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
} = {}) {
  let score = 30; // Baseline base score

  // 1. Physical Severity Foundation (Dominant Factor)
  const normSeverity = String(severity || 'MEDIUM').toUpperCase();
  if (normSeverity === 'CRITICAL') score += 35;
  else if (normSeverity === 'HIGH') score += 25;
  else if (normSeverity === 'MEDIUM') score += 15;
  else score += 5; // LOW

  // 2. Casualty & Vulnerability Multipliers (Safe & Bounded)
  const safeVictims = Math.max(0, parseInt(victimCount, 10) || 0);
  const safeVulnerable = Math.max(0, parseInt(vulnerableCount, 10) || 0);
  score += Math.min(20, safeVictims * 3);
  score += Math.min(10, safeVulnerable * 2);

  // 3. Physical Hazard Amplifiers
  if (Boolean(hasTrapped)) score += 12;
  if (Boolean(hasInjuries)) score += 8;
  if (Boolean(hasFire)) score += 10;
  if (Boolean(hasHazmat)) score += 15;

  // 4. Emotional Triage Signal (Strictly Supplementary)
  const normUrgency = String(emotionalUrgency || 'MEDIUM').toUpperCase();
  if (normUrgency === 'HIGH') score += 5;

  // Bound strictly within [1, 100]
  return Math.min(100, Math.max(1, score));
}

/**
 * Generates deterministic explainable factor tags explaining why a priority score was assigned.
 */
function generatePriorityFactors({
  severity = 'MEDIUM',
  victimCount = 1,
  hasTrapped = false,
  hasInjuries = false,
  hasFire = false,
  hasHazmat = false,
  emotionalUrgency = 'MEDIUM',
  vulnerableCount = 0
} = {}) {
  const factors = [];
  const normSeverity = String(severity || 'MEDIUM').toUpperCase();
  const safeVictims = Math.max(0, parseInt(victimCount, 10) || 0);
  const safeVulnerable = Math.max(0, parseInt(vulnerableCount, 10) || 0);
  const normUrgency = String(emotionalUrgency || 'MEDIUM').toUpperCase();

  // Deterministic Ordering by Operational Importance:
  // 1. Critical physical danger / structural compromise
  if (normSeverity === 'CRITICAL') {
    factors.push('Critical physical danger / structural compromise');
  }

  // 2. Trapped occupants requiring extraction
  if (Boolean(hasTrapped)) {
    factors.push('Trapped occupants requiring extraction');
  }

  // 3. Severe trauma / injuries
  if (Boolean(hasInjuries)) {
    factors.push('Severe trauma & medical care required');
  }

  // 4. Toxic Hazmat / Chemical vapors
  if (Boolean(hasHazmat)) {
    factors.push('Toxic inhalation / hazardous material risk');
  }

  // 5. Active Fire / Thermal combustion
  if (Boolean(hasFire)) {
    factors.push('Active thermal / combustion hazard');
  }

  // 6. Casualty Count (Only if > 1)
  if (safeVictims > 1) {
    factors.push(`Multiple casualties (${safeVictims} persons)`);
  }

  // 7. Vulnerable populations present
  if (safeVulnerable > 0) {
    factors.push(`Vulnerable occupants present (${safeVulnerable} persons)`);
  }

  // 8. High Emotional distress signal (Supplementary)
  if (normUrgency === 'HIGH') {
    factors.push('High caller emotional distress signal');
  }

  return factors;
}

module.exports = {
  calculatePriorityScore,
  generatePriorityFactors
};
