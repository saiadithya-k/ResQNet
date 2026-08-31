/**
 * Seed file for ResQNet database initialization
 */
console.log('🌱 Seeding ResQNet demo database...');

const mockData = {
  users: [
    { email: 'admin@resqnet.org', name: 'Command Chief Sarah Miller', role: 'ADMIN' },
    { email: 'dispatcher@resqnet.org', name: 'Dispatcher John Davis', role: 'DISPATCHER' },
    { email: 'medic.chen@resqnet.org', name: 'Paramedic Alex Chen', role: 'RESPONDER' },
    { email: 'medic.priya@resqnet.org', name: 'Dr. Priya Sharma', role: 'COMMUNITY_RESPONDER' },
    { email: 'metro.hospital@resqnet.org', name: 'Metro Central General Hospital', role: 'HOSPITAL' },
    { email: 'citizen.kumar@resqnet.org', name: 'Vignesh Kumar', role: 'CITIZEN' }
  ],
  incidents: [
    {
      title: 'Commercial Building Structural Collapse',
      incidentType: 'COLLAPSE',
      severity: 'CRITICAL',
      priorityScore: 96,
      status: 'DISPATCHING',
      victimCount: 8,
      hasTrapped: true,
      hasInjuries: true,
      latitude: 13.0827,
      longitude: 80.2707,
      district: 'Central Zone',
      address: '42 Harbour Road, Sector 4'
    },
    {
      title: 'Chemical Factory Fire & Toxic Fume Leak',
      incidentType: 'HAZMAT',
      severity: 'CRITICAL',
      priorityScore: 92,
      status: 'ASSIGNED',
      victimCount: 4,
      hasFire: true,
      hasHazmat: true,
      latitude: 13.0901,
      longitude: 80.2520,
      district: 'North Industrial',
      address: 'Plot 18, Industrial Estate'
    },
    {
      title: 'Flash Flood Inundation & Trapped Civilians',
      incidentType: 'FLOOD',
      severity: 'HIGH',
      priorityScore: 88,
      status: 'REPORTED',
      victimCount: 12,
      hasTrapped: true,
      latitude: 13.0550,
      longitude: 80.2400,
      district: 'Riverbank South',
      address: 'Lowland Colony Block C'
    }
  ]
};

console.log('✅ Mock seed data prepared successfully.');
