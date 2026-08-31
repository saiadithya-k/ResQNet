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

module.exports = {
  calculatePriorityScore
};
