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

  const io = req.app.get('io');
  if (io) {
    io.emit('disaster:activated', {
      active: mockState.disasterMode,
      disaster: mockState.activeDisaster
    });
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

  let severityMultiplier = 1.0;
  if (severity === 'CRITICAL') severityMultiplier = 1.8;
  else if (severity === 'MEDIUM') severityMultiplier = 0.6;
  else if (severity === 'LOW') severityMultiplier = 0.3;

  const popFactor = population / 100000;

  const expectedIncidents = Math.round(147 * popFactor * severityMultiplier);
  const ambulancesNeeded = Math.round(23 * popFactor * severityMultiplier);
  const icuBedsNeeded = Math.round(17 * popFactor * severityMultiplier);
  const respondersNeeded = Math.round(62 * popFactor * severityMultiplier);
  const sheltersNeeded = Math.max(1, Math.round(4 * popFactor * severityMultiplier));

  res.json({
    success: true,
    data: {
      parameters: { disasterType, population, severity },
      impactProjection: {
        expectedIncidents,
        criticalInjuries: Math.round(expectedIncidents * 0.35),
        displacedPeople: Math.round(population * 0.08 * severityMultiplier),
        riskLevel: severity === 'CRITICAL' ? 'SEVERE_SURGE' : 'ELEVATED'
      },
      resourceRequirements: {
        ambulancesNeeded,
        icuBedsNeeded,
        respondersNeeded,
        sheltersNeeded,
        emergencyBoatsNeeded: disasterType === 'FLOOD' ? Math.round(12 * popFactor * severityMultiplier) : 0,
        fireUnitsNeeded: disasterType === 'FIRE' ? Math.round(15 * popFactor * severityMultiplier) : 2
      },
      prepositioningAdvice: [
        'Pre-position 8 standby ALS ambulances near riverbank sector',
        'Clear emergency transit corridors along arterial highways',
        'Activate auxiliary volunteer community responder network in 500m zones'
      ]
    }
  });
};
