const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');

/**
 * Calculates shelter availability metrics from live operational state
 */
function getDistrictShelterMetrics(district) {
  const shelters = (mockState.shelters || []).filter(s => s.district === district);
  if (shelters.length === 0) return null;

  const totalCap = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalOcc = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);
  const remaining = Math.max(0, totalCap - totalOcc);
  const percentFull = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

  let status = 'AVAILABLE';
  if (percentFull >= 95) status = 'FULL';
  else if (percentFull >= 80) status = 'NEAR_CAPACITY';
  else if (percentFull >= 50) status = 'LIMITED';

  return {
    nearestShelterName: shelters[0]?.name || 'District Emergency Shelter',
    capacity: totalCap,
    occupancy: totalOcc,
    remainingCapacity: remaining,
    percentFull,
    status
  };
}

/**
 * Deterministic Emergency Risk & Crowd Surge Prediction Engine
 * Computes live operational risk zones, crowd pressure surges, and evacuation flow metrics
 */
function generateLiveRiskZones() {
  const activeIncidents = (mockState.incidents || []).filter(i => i.status !== 'RESOLVED');
  const primaryIncidents = activeIncidents.filter(i => !i.duplicateOf);
  const roadBlocks = mockState.roadBlocks || [];

  const zones = [];

  // 1. FLOOD SURGE ZONE (Riverbank South) - HIGH Crowd Surge & Congested Flow
  const floodIncidents = primaryIncidents.filter(i => i.incidentType === 'FLOOD' || i.district === 'Riverbank South');
  const floodSeverity = floodIncidents.some(i => i.severity === 'CRITICAL') ? 88 : 74;
  const floodConfidence = Math.min(95, 75 + floodIncidents.length * 5);
  const floodScore = Math.min(100, Math.max(1, floodSeverity + floodIncidents.length * 2));
  const floodShelter = getDistrictShelterMetrics('Riverbank South');
  const floodRoadblocks = roadBlocks.filter(rb => (rb.name + rb.reason).toLowerCase().includes('flood') || (rb.name + rb.reason).toLowerCase().includes('canal'));

  const floodCrowdFactors = [
    'CRITICAL PUBLIC ALERT DIRECTIVE (ALT-101)',
    'RISING WATER DISPLACING LOWLAND CIVILIANS',
    'ROADBLOCK ON NORTH CANAL ARTERIAL ROAD (RB-02)',
    `LOCAL SHELTER PRESSURE (${floodShelter?.nearestShelterName || 'St. Peter CC'} at ${floodShelter?.percentFull || 84}% capacity)`
  ];

  zones.push({
    id: 'PRED-101',
    district: 'Riverbank South',
    riskTitle: 'Riverbank Inundation & Overflow Risk',
    riskType: 'FLOOD_SURGE',
    riskLevel: floodScore >= 80 ? 'CRITICAL' : (floodScore >= 65 ? 'HIGH' : 'MEDIUM'),
    riskScore: floodScore,
    confidence: floodConfidence,
    timeHorizon: 'Next 3 Hours',
    trend: floodIncidents.length > 1 ? 'INCREASING' : 'STABLE',
    crowdSurgeRisk: 'HIGH',
    evacuationFlow: 'CONGESTED',
    evacuationFlowScore: 42,
    shelterStatus: floodShelter,
    roadblockCount: floodRoadblocks.length || 1,
    crowdFactors: floodCrowdFactors,
    weatherSeverity: 'HEAVY_RAIN',
    summary: 'Hydro-meteorological telemetry indicates river water elevation rising at 14 cm/hr, approaching secondary embankments.',
    safetyGuidance: 'Avoid lower ground roads and basement parking structures. Prepare essential supplies and follow official Civil Defense evacuation directives toward High Ground Shelters.',
    latitude: 13.0550,
    longitude: 80.2400,
    radiusKm: 2.5,
    relatedAlertId: 'ALT-101',
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  });

  // 2. HAZMAT DISPERSION ZONE (North Industrial) - MEDIUM Crowd Surge
  const hazmatIncidents = primaryIncidents.filter(i => i.incidentType === 'HAZMAT' || i.hasHazmat);
  if (hazmatIncidents.length > 0) {
    const hazmatScore = Math.min(100, Math.max(1, 75 + hazmatIncidents.length * 3));
    const hazmatShelter = getDistrictShelterMetrics('North Industrial') || {
      nearestShelterName: 'North Industrial Safety Hub',
      capacity: 300,
      occupancy: 90,
      remainingCapacity: 210,
      percentFull: 30,
      status: 'AVAILABLE'
    };

    zones.push({
      id: 'PRED-102',
      district: 'North Industrial',
      riskTitle: 'Atmospheric Toxic Vapor Dispersion',
      riskType: 'HAZMAT_DISPERSION',
      riskLevel: hazmatScore >= 80 ? 'CRITICAL' : (hazmatScore >= 65 ? 'HIGH' : 'MEDIUM'),
      riskScore: hazmatScore,
      confidence: 82,
      timeHorizon: 'Next 2 Hours',
      trend: 'STABLE',
      crowdSurgeRisk: 'MEDIUM',
      evacuationFlow: 'RESTRICTED',
      evacuationFlowScore: 65,
      shelterStatus: hazmatShelter,
      roadblockCount: 0,
      crowdFactors: [
        'TOXIC SOLVENT PLUME DISPERSION PERIMETER (1.8km)',
        'INDUSTRIAL WORKFORCE EVACUATION IN PROGRESS',
        'SHELTER AIR FILTRATION PROTOCOLS ACTIVE'
      ],
      weatherSeverity: 'WIND_18KTS_SE',
      summary: 'Industrial solvent plume dispersion model predicts concentration remaining elevated across a 1.8km radius.',
      safetyGuidance: 'Remain indoors with closed windows. Limit outdoor physical exertion. Follow official hazmat alert instructions.',
      latitude: 13.0901,
      longitude: 80.2520,
      radiusKm: 1.8,
      relatedAlertId: 'ALT-102',
      updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString()
    });
  }

  // 3. STRUCTURAL COLLAPSE ZONE (Central Zone) - MEDIUM Crowd Surge
  const collapseIncidents = primaryIncidents.filter(i => i.incidentType === 'COLLAPSE');
  if (collapseIncidents.length > 0) {
    const collapseScore = Math.min(100, Math.max(1, 65 + collapseIncidents.length * 3));
    const centralShelter = getDistrictShelterMetrics('Central Zone');
    const centralRoadblocks = roadBlocks.filter(rb => (rb.name + rb.reason).toLowerCase().includes('harbour') || (rb.name + rb.reason).toLowerCase().includes('debris'));

    zones.push({
      id: 'PRED-103',
      district: 'Central Zone',
      riskTitle: 'Secondary Structural Vibration Risk',
      riskType: 'STRUCTURAL_SECONDARY_COLLAPSE',
      riskLevel: collapseScore >= 80 ? 'CRITICAL' : (collapseScore >= 65 ? 'HIGH' : 'MEDIUM'),
      riskScore: collapseScore,
      confidence: 75,
      timeHorizon: 'Next 6 Hours',
      trend: 'DECREASING',
      crowdSurgeRisk: 'MEDIUM',
      evacuationFlow: 'CLEAR',
      evacuationFlowScore: 78,
      shelterStatus: centralShelter,
      roadblockCount: centralRoadblocks.length || 1,
      crowdFactors: [
        'PERIMETER ONLOOKER CONVERGENCE NEAR HARBOUR ROAD',
        'ROADBLOCK ON HARBOUR FLYOVER (RB-01)',
        `AMPLE SHELTER CAPACITY AVAILABLE (${centralShelter?.nearestShelterName || 'City Memorial Stadium'} - ${centralShelter?.remainingCapacity || 316} open beds)`
      ],
      weatherSeverity: 'NORMAL',
      summary: 'Acoustic and vibrational telemetry around Harbour Road indicates perimeter stabilization following initial structural collapse.',
      safetyGuidance: 'Do not approach perimeter barricades or block emergency vehicle corridors. Maintain a 300m safety perimeter.',
      latitude: 13.0827,
      longitude: 80.2707,
      radiusKm: 1.2,
      relatedAlertId: null,
      updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
    });
  }

  return zones;
}

/**
 * Deterministic AI Resource Demand & Operational Forecasting Engine
 * Evaluates operational resource pressure, hospital ICU/Trauma load, and shortage risks
 */
function generateResourceDemandForecast() {
  const activeIncidents = (mockState.incidents || []).filter(i => i.status !== 'RESOLVED');
  const primaryIncidents = activeIncidents.filter(i => !i.duplicateOf);
  const resources = mockState.resources || [];
  const hospitals = mockState.hospitals || [];
  const transfers = mockState.resourceTransfers || [];

  const forecasts = [];

  // 1. AMBULANCE DEMAND FORECAST
  const centralAmbulance = resources.find(r => r.category === 'AMBULANCE' && r.district === 'Central Zone') || { total: 12, available: 2 };
  const totalVictimsNeedingTransport = primaryIncidents.reduce((sum, inc) => {
    return sum + (inc.hasInjuries || inc.incidentType === 'MEDICAL' ? Math.max(1, Math.ceil((inc.victimCount || 1) / 2)) : 0);
  }, 0);
  const ambulanceCommitted = Math.max(0, centralAmbulance.total - centralAmbulance.available);
  const ambulanceDemand = Math.max(1, totalVictimsNeedingTransport);
  const ambulanceShortageRisk = centralAmbulance.available < ambulanceDemand ? 'HIGH' : 'LOW';
  const activeTransfer = transfers.find(t => t.status === 'IN_TRANSIT' && t.toDistrict.includes('Central Zone'));

  forecasts.push({
    resourceType: 'AMBULANCE',
    category: 'AMBULANCE',
    district: 'Central Zone',
    currentAvailable: centralAmbulance.available,
    currentCommitted: ambulanceCommitted,
    estimatedDemand: ambulanceDemand,
    shortageRisk: ambulanceShortageRisk,
    demandScore: Math.min(100, Math.max(1, 50 + (ambulanceDemand - centralAmbulance.available) * 8)),
    confidence: 84,
    timeHorizon: 'Next 3 Hours',
    trend: primaryIncidents.some(i => i.severity === 'CRITICAL') ? 'INCREASING' : 'STABLE',
    crossAgencyMitigation: activeTransfer ? `${activeTransfer.resourceName} in-transit from ${activeTransfer.fromDistrict} (ETA ${activeTransfer.etaMinutes}m)` : null,
    factors: [
      'CRITICAL CASUALTY INCIDENTS ACTIVE (INC-1042)',
      `HIGH PATIENT TRANSPORT REQUIREMENTS (${totalVictimsNeedingTransport} projected transports)`,
      `LOCAL FLEET AT ${Math.round((ambulanceCommitted / centralAmbulance.total) * 100)}% UTILIZATION`
    ],
    updatedAt: new Date().toISOString()
  });

  // 2. HEAVY RESCUE / FIRE APPARATUS DEMAND
  const heavyRescueResource = resources.find(r => r.category === 'FIRE_TRUCK') || { total: 8, available: 3 };
  const collapseCount = primaryIncidents.filter(i => i.incidentType === 'COLLAPSE' || i.hasTrapped).length;
  const rescueDemand = Math.max(1, collapseCount * 2);
  const rescueCommitted = Math.max(0, heavyRescueResource.total - heavyRescueResource.available);

  forecasts.push({
    resourceType: 'HEAVY_RESCUE',
    category: 'FIRE_TRUCK',
    district: 'Central Zone',
    currentAvailable: heavyRescueResource.available,
    currentCommitted: rescueCommitted,
    estimatedDemand: rescueDemand,
    shortageRisk: heavyRescueResource.available < rescueDemand ? 'HIGH' : 'MEDIUM',
    demandScore: Math.min(100, Math.max(1, 40 + rescueDemand * 10)),
    confidence: 80,
    timeHorizon: 'Next 4 Hours',
    trend: 'STABLE',
    crossAgencyMitigation: null,
    factors: [
      'STRUCTURAL COLLAPSE WITH TRAPPED CASUALTIES',
      'HYDRAULIC CUTTING, SHORING AND SEARCH TEAMS COMMITTED'
    ],
    updatedAt: new Date().toISOString()
  });

  // 3. HOSPITAL ICU & TRAUMA BED CAPACITY PRESSURE
  const totalIcuAvailable = hospitals.reduce((sum, h) => sum + (h.availableIcu || 0), 0);
  const totalIcuBeds = hospitals.reduce((sum, h) => sum + (h.totalIcu || 0), 0);
  const totalTraumaAvailable = hospitals.reduce((sum, h) => sum + (h.availableTrauma || 0), 0);
  const criticalInjuries = primaryIncidents.filter(i => i.severity === 'CRITICAL' && (i.hasInjuries || i.hasTrapped)).reduce((sum, i) => sum + (i.victimCount || 1), 0);

  const icuDemand = Math.max(1, Math.ceil(criticalInjuries / 2));
  const icuShortage = totalIcuAvailable <= 3 ? 'HIGH' : (totalIcuAvailable <= 8 ? 'MEDIUM' : 'LOW');

  forecasts.push({
    resourceType: 'HOSPITAL_ICU_BEDS',
    category: 'HOSPITAL_BED',
    district: 'All Districts',
    currentAvailable: totalIcuAvailable,
    currentCommitted: Math.max(0, totalIcuBeds - totalIcuAvailable),
    estimatedDemand: icuDemand,
    shortageRisk: icuShortage,
    demandScore: Math.min(100, Math.max(1, 35 + (totalIcuBeds - totalIcuAvailable) * 2)),
    confidence: 88,
    timeHorizon: 'Next 6 Hours',
    trend: criticalInjuries > 5 ? 'INCREASING' : 'STABLE',
    crossAgencyMitigation: null,
    factors: [
      `MULTIPLE SEVERE TRAUMA ADMISSIONS PROJECTED (${criticalInjuries} critical casualties)`,
      `REGIONAL ICU CAPACITY: ${totalIcuAvailable} BEDS REMAINING ACROSS 3 HOSPITALS`
    ],
    updatedAt: new Date().toISOString()
  });

  // 4. WATER RESCUE BOATS DEMAND
  const boatResource = resources.find(r => r.category === 'BOAT') || { total: 10, available: 4 };
  const floodCount = primaryIncidents.filter(i => i.incidentType === 'FLOOD').length;
  const boatDemand = Math.max(1, floodCount * 2);

  forecasts.push({
    resourceType: 'INFLATABLE_BOATS',
    category: 'BOAT',
    district: 'Riverbank South',
    currentAvailable: boatResource.available,
    currentCommitted: Math.max(0, boatResource.total - boatResource.available),
    estimatedDemand: boatDemand,
    shortageRisk: boatResource.available < boatDemand ? 'HIGH' : 'LOW',
    demandScore: Math.min(100, Math.max(1, 30 + boatDemand * 8)),
    confidence: 82,
    timeHorizon: 'Next 3 Hours',
    trend: 'STABLE',
    crossAgencyMitigation: null,
    factors: [
      'FLASH FLOOD ROOFTOP EVACUATION CORRIDORS ACTIVE',
      'CANAL WATER LEVEL ELEVATION CAUSING SUBMERGENCE'
    ],
    updatedAt: new Date().toISOString()
  });

  // 5. HAZMAT SUPPRESSION ASSETS
  const hazmatCount = primaryIncidents.filter(i => i.incidentType === 'HAZMAT' || i.hasHazmat).length;
  forecasts.push({
    resourceType: 'HAZMAT_SUPPRESSION',
    category: 'HAZMAT',
    district: 'North Industrial',
    currentAvailable: 3,
    currentCommitted: 4,
    estimatedDemand: Math.max(1, hazmatCount * 2),
    shortageRisk: hazmatCount > 1 ? 'HIGH' : 'LOW',
    demandScore: Math.min(100, Math.max(1, 25 + hazmatCount * 15)),
    confidence: 85,
    timeHorizon: 'Next 2 Hours',
    trend: 'STABLE',
    crossAgencyMitigation: null,
    factors: [
      'INDUSTRIAL SOLVENT VAPOR PLUME DRIFTING SOUTH-EAST',
      'LEVEL A HAZMAT ENCAPSULATION SUITS AND NEUTRALIZING FOAM COMMITTED'
    ],
    updatedAt: new Date().toISOString()
  });

  return forecasts;
}

// GET /api/predictions/risk-zones and /api/prediction/risk-zones
router.get('/risk-zones', (req, res) => {
  try {
    const zones = generateLiveRiskZones();
    res.json({
      success: true,
      count: zones.length,
      data: zones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate operational risk zones and crowd surge forecasts',
      data: []
    });
  }
});

// GET /api/predictions/risk-zones/:id
router.get('/risk-zones/:id', (req, res) => {
  const zones = generateLiveRiskZones();
  const prediction = zones.find(p => p.id === req.params.id);
  if (!prediction) {
    return res.status(404).json({ success: false, message: 'Risk prediction record not found' });
  }
  res.json({ success: true, data: prediction });
});

// GET /api/predictions/resource-demand and /api/prediction/resource-demand
router.get('/resource-demand', (req, res) => {
  try {
    const demandForecasts = generateResourceDemandForecast();
    res.json({
      success: true,
      count: demandForecasts.length,
      data: demandForecasts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate resource demand forecasts',
      data: []
    });
  }
});

module.exports = router;
