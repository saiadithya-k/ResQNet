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

  answerCopilotQuery(query, state = {}) {
    const q = (query || '').toLowerCase();
    const incidents = state.incidents || [];
    const hospitals = state.hospitals || [];
    const shelters = state.shelters || [];
    const responders = state.responders || [];

    // Query 1: Which hospitals can accept critical patients / ICU capacity?
    if (q.includes('hospital') || q.includes('icu') || q.includes('accept') || q.includes('trauma') || q.includes('bed')) {
      const accepting = hospitals.filter(h => h.isAccepting && (h.availableIcu || 0) > 0);
      const topHosp = accepting[0] || hospitals[0];
      const details = accepting
        .map(h => `${h.name} (${h.availableIcu}/${h.totalIcu} ICU, ${h.availableTrauma || 4} Trauma)`)
        .join('; ');

      return {
        answer: `Currently, ${accepting.length} hospital(s) can accept critical trauma patients with open ICU beds: ${details}.`,
        actions: [
          {
            type: 'VIEW_HOSPITAL',
            label: `🏥 Focus ${topHosp?.name || 'Hospital'} on Map`,
            payload: { id: topHosp?.id || 'HOSP-1', latitude: topHosp?.latitude, longitude: topHosp?.longitude }
          }
        ]
      };
    }

    // Query 2: Which incidents require immediate attention?
    if (q.includes('incident') || q.includes('critical') || q.includes('immediate') || q.includes('attention') || q.includes('urgent')) {
      const criticals = incidents.filter(i => i.severity === 'CRITICAL' || (i.priorityScore || 0) >= 85);
      const topInc = criticals[0] || incidents[0];

      return {
        answer: `There are currently ${criticals.length} high-priority incident(s) requiring immediate command attention. Highest priority: #${topInc.id} — "${topInc.title}" at ${topInc.address} (Status: ${topInc.status}).`,
        actions: [
          {
            type: 'VIEW_INCIDENT',
            label: `🎯 Inspect Incident #${topInc.id}`,
            payload: { id: topInc.id, latitude: topInc.latitude, longitude: topInc.longitude }
          },
          {
            type: 'DISPATCH',
            label: `⚡ Dispatch Priority Unit to #${topInc.id}`,
            payload: { incidentId: topInc.id, responderId: 'RESP-01' }
          }
        ]
      };
    }

    // Query 3: Where are we short on ambulances? / Ambulance availability
    if (q.includes('shortage') || q.includes('short') || q.includes('ambulance') || q.includes('paramedic')) {
      const availableAmbs = responders.filter(r => r.type === 'PARAMEDIC' && r.status === 'AVAILABLE');
      const busyAmbs = responders.filter(r => r.type === 'PARAMEDIC' && r.status !== 'AVAILABLE');

      return {
        answer: `Ambulance Fleet Status: ${availableAmbs.length} unit(s) available in primary sector (${busyAmbs.length} currently en-route/on-scene). Central Zone fleet is operating near peak capacity.`,
        actions: [
          {
            type: 'VIEW_RESPONDER',
            label: '🚑 Inspect Ambulance A12 Telemetry',
            payload: { id: 'RESP-01', badgeNumber: 'AMB-A12' }
          }
        ]
      };
    }

    // Query 4: Which shelters are nearing capacity?
    if (q.includes('shelter') || q.includes('capacity') || q.includes('evac') || q.includes('occupancy')) {
      const nearCapacity = shelters.filter(s => (s.currentOccupancy / s.capacity) >= 0.75);
      const topShelter = nearCapacity[0] || shelters[0];
      const names = nearCapacity.map(s => `${s.name} (${Math.round((s.currentOccupancy / s.capacity) * 100)}% Full)`).join(', ');

      return {
        answer: nearCapacity.length > 0
          ? `Shelter Alert: ${nearCapacity.length} evacuation shelter(s) are nearing or exceeding critical capacity: ${names}. Recommend routing incoming evacuees to secondary facilities.`
          : 'All evacuation shelters are operating within standard capacity limits (<75% occupancy).',
        actions: topShelter ? [
          {
            type: 'VIEW_SHELTER',
            label: `🏠 View Shelter #${topShelter.id}`,
            payload: { id: topShelter.id, latitude: topShelter.latitude, longitude: topShelter.longitude }
          }
        ] : []
      };
    }

    // Default Operational Overview
    return {
      answer: `ResQNet Command Copilot active. Monitoring ${incidents.length} live incident(s), ${responders.length} tactical response unit(s), and ${hospitals.length} regional trauma centers across Sector 04.`,
      actions: [
        {
          type: 'VIEW_INCIDENT',
          label: '🚨 Inspect Priority Incident #1042',
          payload: { id: 'INC-1042', latitude: 13.0827, longitude: 80.2707 }
        },
        {
          type: 'VIEW_HOSPITAL',
          label: '🏥 Check Trauma Hospital Status',
          payload: { id: 'HOSP-1', latitude: 13.0750, longitude: 80.2780 }
        }
      ]
    };
  }
}

module.exports = new AIService();
