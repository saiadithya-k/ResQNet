const mockState = require('../services/mockData');

exports.getCommandStats = (req, res) => {
  const totalIncidents = mockState.incidents.length;
  const criticalIncidents = mockState.incidents.filter(i => i.severity === 'CRITICAL').length;
  const activeResponders = mockState.responders.length;
  const availableAmbulances = mockState.responders.filter(r => r.type === 'PARAMEDIC' && r.status === 'AVAILABLE').length;

  const totalBeds = mockState.hospitals.reduce((acc, h) => acc + h.totalBeds, 0);
  const availableBeds = mockState.hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const hospitalCapacityPercent = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

  res.json({
    success: true,
    data: {
      activeEmergencies: 27, // Global operational context
      criticalEmergencies: criticalIncidents + 4,
      totalResponders: activeResponders + 80,
      availableResponders: mockState.responders.filter(r => r.status === 'AVAILABLE').length + 42,
      availableAmbulances: availableAmbulances + 29,
      hospitalCapacityPercent,
      averageEtaMinutes: 7.2,
      averageDispatchSeconds: 21,
      peopleRescued: 142,
      responseTimeTrend: [
        { time: '06:00', avgMinutes: 9.2 },
        { time: '07:00', avgMinutes: 8.5 },
        { time: '08:00', avgMinutes: 10.1 },
        { time: '09:00', avgMinutes: 7.8 },
        { time: '10:00', avgMinutes: 7.2 }
      ],
      incidentsByType: [
        { type: 'COLLAPSE', count: mockState.incidents.filter(i => i.incidentType === 'COLLAPSE').length + 5, color: '#ef4444' },
        { type: 'FIRE', count: mockState.incidents.filter(i => i.incidentType === 'FIRE').length + 7, color: '#f97316' },
        { type: 'FLOOD', count: mockState.incidents.filter(i => i.incidentType === 'FLOOD').length + 6, color: '#06b6d4' },
        { type: 'HAZMAT', count: mockState.incidents.filter(i => i.incidentType === 'HAZMAT').length + 3, color: '#a855f7' },
        { type: 'MEDICAL', count: 14, color: '#3b82f6' }
      ],
      hourlyVolume: [
        { hour: '06:00', total: 4, critical: 1 },
        { hour: '07:00', total: 7, critical: 2 },
        { hour: '08:00', total: 11, critical: 4 },
        { hour: '09:00', total: 14, critical: 5 },
        { hour: '10:00', total: 9, critical: 3 },
        { hour: '11:00', total: 6, critical: 2 }
      ],
      lifecyclePerformance: [
        { state: 'VERIFIED', avgDurationMinutes: 1.2, targetMinutes: 2.0, status: 'OPTIMAL' },
        { state: 'ASSIGNED', avgDurationMinutes: 0.8, targetMinutes: 1.5, status: 'OPTIMAL' },
        { state: 'EN_ROUTE', avgDurationMinutes: 4.8, targetMinutes: 6.0, status: 'OPTIMAL' },
        { state: 'ON_SCENE', avgDurationMinutes: 18.5, targetMinutes: 20.0, status: 'NOMINAL' },
        { state: 'TRANSPORTING', avgDurationMinutes: 7.2, targetMinutes: 10.0, status: 'OPTIMAL' },
        { state: 'HOSPITAL_RECEIVED', avgDurationMinutes: 3.1, targetMinutes: 5.0, status: 'OPTIMAL' },
        { state: 'RESOLVED', avgDurationMinutes: 35.6, targetMinutes: 45.0, status: 'OPTIMAL' }
      ]
    }
  });
};

exports.getHeatmapData = (req, res) => {
  // Density coordinates for Leaflet heat layer
  const heatPoints = [
    [13.0827, 80.2707, 0.95], // Harbour collapse (high intensity)
    [13.0835, 80.2715, 0.85],
    [13.0901, 80.2520, 0.9],  // Hazmat leak
    [13.0890, 80.2510, 0.75],
    [13.0550, 80.2400, 0.88], // Flood
    [13.0560, 80.2420, 0.8],
    [13.0650, 80.2600, 0.5],
    [13.0720, 80.2500, 0.4]
  ];

  res.json({ success: true, count: heatPoints.length, data: heatPoints });
};
