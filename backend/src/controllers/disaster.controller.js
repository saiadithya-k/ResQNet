const mockState = require('../services/mockData');

exports.getStatus = (req, res) => {
  res.json({
    success: true,
    data: {
      disasterMode: mockState.disasterMode,
      activeDisaster: mockState.activeDisaster,
      zones: mockState.disasterZones,
      shelters: mockState.shelters
    }
  });
};

exports.toggleDisasterMode = (req, res) => {
  const { activate, disasterType, district, severity } = req.body;
  mockState.disasterMode = Boolean(activate);
  
  if (mockState.disasterMode) {
    mockState.activeDisaster = {
      type: disasterType || 'FLOOD_FLASH_SURGE',
      district: district || 'Greater Metropolitan Area',
      severity: severity || 'CRITICAL',
      declaredAt: new Date().toISOString()
    };
  } else {
    mockState.activeDisaster = null;
  }

  const newAudit = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    user: req.user?.name || 'Emergency Director',
    action: mockState.disasterMode ? 'DISASTER_MODE_ACTIVATED' : 'DISASTER_MODE_DEACTIVATED',
    entity: 'Joint Operational Grid',
    details: mockState.disasterMode
      ? `Declared Level 3 Critical (${mockState.activeDisaster?.type || 'MULTI_HAZARD'})`
      : 'Disaster Mode Stand-Down to Normal Operations',
    time: new Date().toLocaleTimeString().slice(0, 8)
  };
  mockState.auditLogs.unshift(newAudit);

  const io = req.app.get('io');
  if (io) {
    io.emit('disaster:activated', {
      active: mockState.disasterMode,
      disaster: mockState.activeDisaster
    });
    io.emit('audit:created', newAudit);
  }

  res.json({
    success: true,
    message: mockState.disasterMode ? '🚨 DISASTER MODE ACTIVATED' : 'Disaster Mode Stand-Down',
    data: { disasterMode: mockState.disasterMode, activeDisaster: mockState.activeDisaster }
  });
};

exports.getZones = (req, res) => {
  res.json({ success: true, count: mockState.disasterZones.length, data: mockState.disasterZones });
};

exports.getShelters = (req, res) => {
  res.json({ success: true, count: mockState.shelters.length, data: mockState.shelters });
};

// Interactive Disaster Simulation Engine (Person 6 & Team 3)
exports.simulateDisaster = (req, res) => {
  const { disasterType = 'FLOOD', population = 100000, severity = 'HIGH' } = req.body;

  const validTypes = ['FLOOD', 'EARTHQUAKE', 'HAZMAT', 'CYCLONE', 'FIRE'];
  const sanitizedType = validTypes.includes(String(disasterType).toUpperCase())
    ? String(disasterType).toUpperCase()
    : 'FLOOD';

  const clampedPop = Math.min(500000, Math.max(20000, Number(population) || 100000));

  let severityMultiplier = 1.0;
  if (severity.toUpperCase() === 'EXTREME' || severity.toUpperCase() === 'CRITICAL') severityMultiplier = 2.2;
  else if (severity.toUpperCase() === 'HIGH') severityMultiplier = 1.4;
  else if (severity.toUpperCase() === 'MEDIUM') severityMultiplier = 0.8;
  else if (severity.toUpperCase() === 'LOW') severityMultiplier = 0.35;

  const popFactor = clampedPop / 100000;

  const expectedIncidents = Math.round(147 * popFactor * severityMultiplier);
  const criticalInjuries = Math.round(expectedIncidents * 0.38);
  const displacedPeople = Math.round(clampedPop * (sanitizedType === 'FLOOD' || sanitizedType === 'CYCLONE' ? 0.12 : 0.06) * severityMultiplier);

  const ambulancesNeeded = Math.max(4, Math.round(23 * popFactor * severityMultiplier));
  const icuBedsNeeded = Math.max(2, Math.round(18 * popFactor * severityMultiplier));
  const respondersNeeded = Math.max(12, Math.round(62 * popFactor * severityMultiplier));
  const sheltersNeeded = Math.max(1, Math.round(4 * popFactor * severityMultiplier));
  const boatsNeeded = (sanitizedType === 'FLOOD' || sanitizedType === 'CYCLONE')
    ? Math.max(2, Math.round(14 * popFactor * severityMultiplier))
    : 0;
  const fireUnitsNeeded = (sanitizedType === 'FIRE' || sanitizedType === 'HAZMAT')
    ? Math.max(3, Math.round(16 * popFactor * severityMultiplier))
    : 2;

  // Compute Deficits Against Current Real-Time Live Inventory
  const liveAmbulances = mockState.responders.filter(r => r.type === 'PARAMEDIC' && r.status === 'AVAILABLE').length + 29;
  const liveIcuBeds = mockState.hospitals.reduce((acc, h) => acc + (h.availableIcu || 0), 0);
  const liveResponders = mockState.responders.filter(r => r.status === 'AVAILABLE').length + 42;
  const liveShelters = mockState.shelters.length;

  const ambulanceDeficit = Math.max(0, ambulancesNeeded - liveAmbulances);
  const icuDeficit = Math.max(0, icuBedsNeeded - liveIcuBeds);
  const responderDeficit = Math.max(0, respondersNeeded - liveResponders);
  const shelterDeficit = Math.max(0, sheltersNeeded - liveShelters);

  // Dynamic Tailored Pre-positioning Advice
  const advice = [];
  if (ambulanceDeficit > 0) {
    advice.push(`🚨 Request mutual-aid deployment for +${ambulanceDeficit} ALS ambulances from neighboring districts.`);
  } else {
    advice.push(`✓ Available ambulance fleet (${liveAmbulances} units) sufficient for initial dispatch surge.`);
  }

  if (icuDeficit > 0) {
    advice.push(`⚠️ ICU bed deficit (+${icuDeficit} needed): Alert Level 1 Trauma centers to convert step-down units.`);
  }

  if (boatsNeeded > 0) {
    advice.push(`🌊 Pre-deploy ${boatsNeeded} flood rescue Zodiacs and watercraft along low-lying river sectors.`);
  }

  if (sanitizedType === 'HAZMAT') {
    advice.push('☣️ Establish 2.5km downwind evacuation buffer and mobilize chemical neutralizing foam tankers.');
  } else if (sanitizedType === 'EARTHQUAKE') {
    advice.push('🏗️ Stage heavy USAR (Urban Search & Rescue) hydraulic shoring teams at Sector 4 logistics hub.');
  }

  advice.push('📡 Pre-activate auxiliary community responder mesh network with offline disaster protocols.');

  res.json({
    success: true,
    data: {
      parameters: { disasterType: sanitizedType, population: clampedPop, severity },
      impactProjection: {
        expectedIncidents,
        criticalInjuries,
        displacedPeople,
        riskLevel: severityMultiplier >= 1.8 ? 'SEVERE_SURGE' : 'ELEVATED'
      },
      resourceRequirements: {
        ambulancesNeeded,
        icuBedsNeeded,
        respondersNeeded,
        sheltersNeeded,
        emergencyBoatsNeeded: boatsNeeded,
        fireUnitsNeeded
      },
      inventoryDeficits: {
        ambulanceDeficit,
        icuDeficit,
        responderDeficit,
        shelterDeficit
      },
      prepositioningAdvice: advice
    }
  });
};
