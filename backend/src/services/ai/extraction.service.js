const { calculatePriorityScore } = require('../../utils/scoring');

class AIService {
  extractEmergency(text, language = 'en') {
    const lower = (text || '').toLowerCase();
    
    let incidentType = 'MEDICAL';
    let severity = 'MEDIUM';
    let victimCount = 1;
    let hasTrapped = false;
    let hasInjuries = false;
    let hasFire = false;
    let hasHazmat = false;

    if (lower.includes('fire') || lower.includes('smoke') || lower.includes('flame') || lower.includes('burning') || lower.includes('தீ')) {
      incidentType = 'FIRE';
      hasFire = true;
      severity = 'HIGH';
    } else if (lower.includes('collapse') || lower.includes('crush') || lower.includes('rubble') || lower.includes('trapped') || lower.includes('இடிந்து')) {
      incidentType = 'COLLAPSE';
      hasTrapped = true;
      severity = 'CRITICAL';
    } else if (lower.includes('flood') || lower.includes('water') || lower.includes('drown') || lower.includes('வெள்ளம்')) {
      incidentType = 'FLOOD';
      hasTrapped = true;
      severity = 'HIGH';
    } else if (lower.includes('chemical') || lower.includes('toxic') || lower.includes('gas') || lower.includes('fume')) {
      incidentType = 'HAZMAT';
      hasHazmat = true;
      severity = 'CRITICAL';
    }

    // Number extraction for victims
    const numMatch = lower.match(/\b(\d+)\s*(people|persons|victims|trapped|individuals)?\b/);
    if (numMatch) {
      victimCount = parseInt(numMatch[1], 10);
      if (victimCount >= 5) severity = 'CRITICAL';
    }

    if (lower.includes('injur') || lower.includes('bleed') || lower.includes('hurt') || lower.includes('unconscious') || lower.includes('காயம்')) {
      hasInjuries = true;
    }

    // Emotional Triage (Independent from actual severity)
    let emotionalUrgency = 'MEDIUM';
    let emotionState = 'DISTRESSED';
    let emotionScore = 0.82;

    if (lower.includes('help') || lower.includes('please') || lower.includes('hurry') || lower.includes('urgent') || lower.includes('screaming')) {
      emotionalUrgency = 'HIGH';
      emotionState = 'PANICKED';
      emotionScore = 0.94;
    }

    const priorityScore = calculatePriorityScore({
      severity,
      victimCount,
      hasTrapped,
      hasInjuries,
      hasFire,
      hasHazmat,
      emotionalUrgency
    });

    return {
      incidentType,
      severity,
      victimCount,
      hasTrapped,
      hasInjuries,
      hasFire,
      hasHazmat,
      language,
      emotion: {
        state: emotionState,
        score: emotionScore,
        urgency: emotionalUrgency
      },
      priorityScore,
      extractedAt: new Date().toISOString()
    };
  }

  detectDuplicates(newIncident, existingIncidents = []) {
    // Simple spatial-temporal distance and type matcher
    const duplicates = existingIncidents.filter(inc => {
      const isSameType = inc.incidentType === newIncident.incidentType;
      // Rough distance check
      const dLat = Math.abs(inc.latitude - newIncident.latitude);
      const dLon = Math.abs(inc.longitude - newIncident.longitude);
      const isNear = dLat < 0.01 && dLon < 0.01; // ~1km
      return isSameType && isNear && inc.status !== 'RESOLVED';
    });

    return {
      isDuplicate: duplicates.length > 0,
      matches: duplicates.map(d => ({ id: d.id, title: d.title, similarity: 0.92 }))
    };
  }

  answerCopilotQuery(query, operationalState) {
    const q = (query || '').toLowerCase();
    
    if (q.includes('critical') || q.includes('urgent') || q.includes('attention')) {
      return {
        answer: `There are currently ${operationalState.criticalCount || 2} CRITICAL incidents active. Priority #1 is the Building Collapse at Harbour Road with 8 trapped victims. Paramedic units have been dispatched.`,
        suggestedActions: [
          'Pre-alert Metro General ICU trauma wing',
          'Deploy secondary heavy rescue crane unit',
          'Issue localized evacuation alert'
        ]
      };
    } else if (q.includes('hospital') || q.includes('bed') || q.includes('icu') || q.includes('trauma')) {
      return {
        answer: 'Metro Central Hospital has 4/10 ICU beds and 6/10 Trauma beds available (Accepting). St. Jude Hospital is nearing 85% capacity.',
        suggestedActions: [
          'Route next trauma patient to Metro Central General',
          'Monitor Apollo Trauma Center bed release schedule'
        ]
      };
    } else if (q.includes('shortage') || q.includes('resource') || q.includes('ambulance')) {
      return {
        answer: 'Resource warning: District A (Central Zone) ambulance availability is at 18%. District B has 3 surplus ambulances ready for cross-agency loan.',
        suggestedActions: [
          'Initiate cross-district transfer request to District B',
          'Mobilize verified Community First Responders within 500m'
        ]
      };
    }

    return {
      answer: `Operations are currently stable. 27 total active incidents monitored across 4 districts. All response meshes are connected and tracking via GPS.`,
      suggestedActions: [
        'Review high-priority incidents',
        'Check responder fatigue levels',
        'Inspect GIS road blockages'
      ]
    };
  }
}

module.exports = new AIService();
