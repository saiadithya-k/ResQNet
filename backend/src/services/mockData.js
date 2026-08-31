/**
 * Shared in-memory operational state for ResQNet demo
 */
const mockState = {
  disasterMode: false,
  activeDisaster: null,
  incidents: [
    {
      id: 'INC-1042',
      title: 'Commercial Building Structural Collapse',
      description: 'Multiple storeys collapsed following foundation failure. Several workers trapped on ground floor.',
      incidentType: 'COLLAPSE',
      status: 'DISPATCHING',
      severity: 'CRITICAL',
      priorityScore: 96,
      latitude: 13.0827,
      longitude: 80.2707,
      district: 'Central Zone',
      address: '42 Harbour Road, Sector 4',
      victimCount: 8,
      hasInjuries: true,
      hasTrapped: true,
      hasFire: false,
      hasHazmat: false,
      vulnerableGroups: ['Elderly (1)', 'Workers (7)'],
      aiEmotionState: 'PANICKED',
      aiEmotionScore: 0.94,
      aiUrgencyScore: 0.96,
      targetHospitalId: 'HOSP-1',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      timeline: [
        { time: '10:31', title: 'Reported', description: 'Emergency call received in Tamil' },
        { time: '10:31', title: 'AI Extraction', description: 'Extracted: COLLAPSE, 8 victims, PANICKED' },
        { time: '10:32', title: 'Prioritized', description: 'Dynamic Priority Score computed: 96' },
        { time: '10:33', title: 'Dispatch Alert', description: 'Finding nearest responder and hospital' }
      ]
    },
    {
      id: 'INC-1043',
      title: 'Chemical Factory Toxic Vapor Leak & Fire',
      description: 'Secondary explosion reported in solvent storage chamber. Heavy toxic plume drifting south-east.',
      incidentType: 'HAZMAT',
      status: 'EN_ROUTE',
      severity: 'CRITICAL',
      priorityScore: 92,
      latitude: 13.0901,
      longitude: 80.2520,
      district: 'North Industrial',
      address: 'Plot 18, Industrial Estate, Gate 2',
      victimCount: 4,
      hasInjuries: true,
      hasTrapped: false,
      hasFire: true,
      hasHazmat: true,
      vulnerableGroups: [],
      aiEmotionState: 'DISTRESSED',
      aiEmotionScore: 0.88,
      aiUrgencyScore: 0.91,
      targetHospitalId: 'HOSP-2',
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      timeline: [
        { time: '10:15', title: 'Reported', description: 'Citizen video upload received' },
        { time: '10:16', title: 'AI Analysis', description: 'HAZMAT toxic smoke detected' },
        { time: '10:18', title: 'Hazmat Unit Dispatched', description: 'Unit F-04 En Route' }
      ]
    },
    {
      id: 'INC-1044',
      title: 'Flash Flood Inundation & Trapped Civilians',
      description: 'Rapid water surge in low-lying residential pocket. 12 residents trapped on rooftop.',
      incidentType: 'FLOOD',
      status: 'VERIFIED',
      severity: 'HIGH',
      priorityScore: 88,
      latitude: 13.0550,
      longitude: 80.2400,
      district: 'Riverbank South',
      address: 'Lowland Colony Block C',
      victimCount: 12,
      hasInjuries: false,
      hasTrapped: true,
      hasFire: false,
      hasHazmat: false,
      vulnerableGroups: ['Children (3)', 'Elderly (2)'],
      aiEmotionState: 'PANICKED',
      aiEmotionScore: 0.91,
      aiUrgencyScore: 0.89,
      targetHospitalId: null,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      timeline: [
        { time: '10:40', title: 'Reported', description: 'Voice report in English' },
        { time: '10:41', title: 'Verified', description: 'Verified via neighborhood sensor' }
      ]
    }
  ],
  responders: [
    {
      id: 'RESP-01',
      name: 'Ambulance Unit Alpha-12',
      badgeNumber: 'AMB-A12',
      type: 'PARAMEDIC',
      vehicle: 'Type III ALS Ambulance',
      isCommunity: false,
      status: 'DISPATCHED',
      latitude: 13.0780,
      longitude: 80.2650,
      assignedIncidentId: 'INC-1042',
      skills: ['Advanced Life Support', 'Trauma Resuscitation', 'Triage'],
      equipment: ['Oxygen', 'Defibrillator', 'Spine Board', 'Ventilator'],
      dutyHours: 4.5,
      fatigueScore: 28,
      etaMinutes: 4
    },
    {
      id: 'RESP-02',
      name: 'Heavy Rescue Fire Unit F-04',
      badgeNumber: 'FIRE-F04',
      type: 'FIREFIGHTER',
      vehicle: 'Heavy Rescue Tender',
      isCommunity: false,
      status: 'EN_ROUTE',
      latitude: 13.0850,
      longitude: 80.2580,
      assignedIncidentId: 'INC-1043',
      skills: ['Hazmat Level A', 'Structural Collapse', 'Extrication'],
      equipment: ['Hydraulic Cutters', 'Thermal Camera', 'Gas Detectors'],
      dutyHours: 6.2,
      fatigueScore: 45,
      etaMinutes: 6
    },
    {
      id: 'RESP-COMM-01',
      name: 'Dr. Priya Sharma (Community Medic)',
      badgeNumber: 'CFR-892',
      type: 'COMMUNITY_FIRST_RESPONDER',
      vehicle: 'Private Vehicle (Equipped)',
      isCommunity: true,
      status: 'ON_SCENE',
      latitude: 13.0820,
      longitude: 80.2700,
      assignedIncidentId: 'INC-1042',
      skills: ['CPR Certified', 'First Aid', 'Emergency Triage'],
      equipment: ['First Responder Medical Kit', 'AED'],
      dutyHours: 1.5,
      fatigueScore: 10,
      etaMinutes: 0
    },
    {
      id: 'RESP-03',
      name: 'Ambulance Unit Bravo-07',
      badgeNumber: 'AMB-B07',
      type: 'PARAMEDIC',
      vehicle: 'Type II BLS Ambulance',
      isCommunity: false,
      status: 'AVAILABLE',
      latitude: 13.0650,
      longitude: 80.2550,
      assignedIncidentId: null,
      skills: ['Basic Life Support', 'CPR', 'Patient Transport'],
      equipment: ['Trauma Kit', 'Oxygen Tank'],
      dutyHours: 2.0,
      fatigueScore: 14,
      etaMinutes: null
    }
  ],
  hospitals: [
    {
      id: 'HOSP-1',
      name: 'Metro Central General Hospital',
      district: 'Central Zone',
      latitude: 13.0750,
      longitude: 80.2780,
      totalBeds: 120,
      availableBeds: 34,
      totalIcu: 20,
      availableIcu: 5,
      totalTrauma: 15,
      availableTrauma: 6,
      ventilators: 12,
      operatingRooms: 4,
      isAccepting: true,
      specializations: ['Level 1 Trauma', 'Burn Unit', 'Neurosurgery', 'Cardiology'],
      matchScore: 94
    },
    {
      id: 'HOSP-2',
      name: 'St. Jude Apex Trauma Center',
      district: 'North Industrial',
      latitude: 13.0980,
      longitude: 80.2450,
      totalBeds: 80,
      availableBeds: 12,
      totalIcu: 10,
      availableIcu: 2,
      totalTrauma: 10,
      availableTrauma: 3,
      ventilators: 8,
      operatingRooms: 3,
      isAccepting: true,
      specializations: ['Hazmat Toxicology', 'Orthopedics', 'Pediatric Trauma'],
      matchScore: 89
    },
    {
      id: 'HOSP-3',
      name: 'Riverside Community Hospital',
      district: 'Riverbank South',
      latitude: 13.0480,
      longitude: 80.2350,
      totalBeds: 60,
      availableBeds: 18,
      totalIcu: 6,
      availableIcu: 1,
      totalTrauma: 5,
      availableTrauma: 2,
      ventilators: 4,
      operatingRooms: 2,
      isAccepting: true,
      specializations: ['General Emergency', 'Hypothermia / Drowning Treatment'],
      matchScore: 82
    }
  ],
  shelters: [
    {
      id: 'SHELTER-1',
      name: 'City Memorial Indoor Stadium',
      district: 'Central Zone',
      latitude: 13.0800,
      longitude: 80.2600,
      capacity: 500,
      currentOccupancy: 184,
      foodSupply: 'ADEQUATE',
      waterSupply: 'ADEQUATE',
      medicalStation: true,
      isAccessible: true
    },
    {
      id: 'SHELTER-2',
      name: 'St. Peter Community Center',
      district: 'Riverbank South',
      latitude: 13.0510,
      longitude: 80.2420,
      capacity: 250,
      currentOccupancy: 210,
      foodSupply: 'LOW',
      waterSupply: 'ADEQUATE',
      medicalStation: true,
      isAccessible: true
    }
  ],
  disasterZones: [
    {
      id: 'ZONE-DANGER-1',
      name: 'Harbour Collapse Danger Perimeter',
      type: 'COLLAPSE',
      riskLevel: 'DANGER',
      coordinates: [
        [13.0845, 80.2685],
        [13.0845, 80.2730],
        [13.0805, 80.2730],
        [13.0805, 80.2685]
      ]
    },
    {
      id: 'ZONE-EVAC-2',
      name: 'Chemical Plume Evacuation Zone',
      type: 'HAZMAT',
      riskLevel: 'EVACUATION',
      coordinates: [
        [13.0930, 80.2480],
        [13.0930, 80.2580],
        [13.0860, 80.2580],
        [13.0860, 80.2480]
      ]
    },
    {
      id: 'ZONE-WARN-3',
      name: 'River Basin Flood Advisory Zone',
      type: 'FLOOD',
      riskLevel: 'WARNING',
      coordinates: [
        [13.0600, 80.2300],
        [13.0600, 80.2480],
        [13.0450, 80.2480],
        [13.0450, 80.2300]
      ]
    }
  ],
  roadBlocks: [
    {
      id: 'RB-01',
      name: 'Harbour Main Flyover Blocked',
      reason: 'Debris & Police Cordon',
      latitude: 13.0815,
      longitude: 80.2690
    },
    {
      id: 'RB-02',
      name: 'North Canal Road Submerged',
      reason: 'Flash Flood Overflow',
      latitude: 13.0530,
      longitude: 80.2380
    }
  ],
  resources: [
    { id: 'RES-01', name: 'ALS Ambulances', category: 'AMBULANCE', district: 'Central Zone', total: 12, available: 2, status: 'SHORTAGE' },
    { id: 'RES-02', name: 'ALS Ambulances', category: 'AMBULANCE', district: 'District B (West)', total: 18, available: 6, status: 'AVAILABLE' },
    { id: 'RES-03', name: 'Heavy Rescue Fire Engines', category: 'FIRE_TRUCK', district: 'North Industrial', total: 8, available: 3, status: 'AVAILABLE' },
    { id: 'RES-04', name: 'Inflatable Rescue Boats', category: 'BOAT', district: 'Riverbank South', total: 10, available: 4, status: 'AVAILABLE' },
    { id: 'RES-05', name: 'Emergency Mobile Ventilators', category: 'VENTILATOR', district: 'Central Zone', total: 15, available: 3, status: 'AVAILABLE' }
  ],
  resourceTransfers: [
    {
      id: 'TRANS-101',
      resourceName: '3 ALS Ambulances',
      fromDistrict: 'District B (West)',
      toDistrict: 'Central Zone (District A)',
      quantity: 3,
      status: 'IN_TRANSIT',
      etaMinutes: 12,
      requestedAt: '10:28',
      approvedAt: '10:30'
    }
  ],
  survivorCheckins: [
    { id: 'SURV-01', fullName: 'Ramesh Sundaram', phone: '+91 98401 23456', status: 'SAFE', district: 'Central Zone', shelterName: 'City Memorial Stadium', time: '10:34' },
    { id: 'SURV-02', fullName: 'Ananya Ramesh', phone: '+91 98401 23457', status: 'SAFE', district: 'Central Zone', shelterName: 'City Memorial Stadium', time: '10:35' },
    { id: 'SURV-03', fullName: 'Kavitha Nathan', phone: '+91 94440 98765', status: 'INJURED', district: 'Central Zone', shelterName: 'Metro Central Triage', time: '10:39' },
    { id: 'SURV-04', fullName: 'Sanjay Nathan', phone: '+91 94440 98766', status: 'MISSING', district: 'Central Zone', shelterName: 'Unknown', time: '10:41' }
  ],
  familyMembers: [
    { id: 'FAM-01', name: 'Father (Ramesh Sundaram)', relationship: 'Father', status: 'SAFE', location: 'City Memorial Stadium Shelter', time: '10:34' },
    { id: 'FAM-02', name: 'Mother (Kavitha Sundaram)', relationship: 'Mother', status: 'INJURED', location: 'Metro General Hospital Triage', time: '10:39' },
    { id: 'FAM-03', name: 'Brother (Sanjay Sundaram)', relationship: 'Brother', status: 'MISSING', location: 'Near Harbour Road Sector 4', time: '10:41' }
  ],
  evidenceRecords: [
    {
      id: 'EV-1092',
      incidentId: 'INC-1042',
      fileName: 'collapse_rubble_cam01.mp4',
      fileType: 'video/mp4',
      fileSize: '14.8 MB',
      uploader: 'Citizen Kumar',
      sha256Hash: '9e107d9d372bb6826bd81d3542a419d6bc405f631aec8d0e74f4b1e5a539b69d',
      status: 'VERIFIED',
      timestamp: '2026-08-31T10:31:45Z'
    },
    {
      id: 'EV-1093',
      incidentId: 'INC-1043',
      fileName: 'chemical_smoke_plume.jpg',
      fileType: 'image/jpeg',
      fileSize: '3.2 MB',
      uploader: 'Security Gate 2',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'VERIFIED',
      timestamp: '2026-08-31T10:15:20Z'
    }
  ],
  auditLogs: [
    { id: 'AUD-01', user: 'Admin Miller', action: 'DISPATCH_APPROVED', entity: 'Incident INC-1042', details: 'Assigned Ambulance A12 and CFR-892', time: '10:32:15' },
    { id: 'AUD-02', user: 'Admin Miller', action: 'INCIDENT_ESCALATED', entity: 'Incident INC-1042', details: 'Dynamic Priority raised to 96 (Collapse severity CRITICAL)', time: '10:32:00' },
    { id: 'AUD-03', user: 'System (AI)', action: 'TRIAGE_COMPLETED', entity: 'Incident INC-1043', details: 'Extracted: HAZMAT, 2 victims, Distressed', time: '10:15:30' }
  ],
  citizenProfile: {
    id: 'CIT-9802',
    name: 'Vignesh Kumar',
    email: 'vignesh.kumar@resqnet.org',
    phone: '+91 98401 55678',
    bloodGroup: 'O+',
    address: 'Flat 4B, Emerald Towers, 42 Harbour Road, Central Zone',
    language: 'Tamil & English',
    medicalNotes: 'No known drug allergies. Asthmatic (inhaler carried).',
    emergencyContacts: [
      { id: 'EC-01', name: 'Ramesh Sundaram', relationship: 'Father', phone: '+91 98401 23456', isPrimary: true },
      { id: 'EC-02', name: 'Dr. S. Radhakrishnan', relationship: 'Family Physician', phone: '+91 94440 11223', isPrimary: false }
    ]
  },
  citizenNotifications: [
    {
      id: 'NOTIF-01',
      title: 'RESPONDER UNIT EN ROUTE',
      message: 'Ambulance Unit Alpha-12 has been dispatched to INC-1042.',
      category: 'RESPONDER',
      time: '10:33 AM',
      read: false,
      incidentId: 'INC-1042'
    },
    {
      id: 'NOTIF-02',
      title: 'SURVIVOR STATUS SYNCHRONIZED',
      message: 'Father (Ramesh Sundaram) checked in as SAFE at City Memorial Stadium.',
      category: 'FAMILY_SAFETY',
      time: '10:34 AM',
      read: false,
      incidentId: null
    },
    {
      id: 'NOTIF-03',
      title: 'FLASH FLOOD ADVISORY ISSUED',
      message: 'Civil Defense has issued a CRITICAL Flood Warning for Riverbank South.',
      category: 'PUBLIC_ALERT',
      time: '10:10 AM',
      read: true,
      incidentId: null
    }
  ]
};

module.exports = mockState;
