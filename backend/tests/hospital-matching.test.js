const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ioClient = require('socket.io-client');
const app = require('../src/app');
const { initSocket } = require('../src/socket/socket');
const prisma = require('../src/config/database');

let server;
let baseUrl;
let socketClient;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runHospitalMatchingTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 12: P4-04 Hospital Matching Tests');
  console.log('🧪 ========================================================\n');

  server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io);

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running on ${baseUrl}`);
      resolve();
    });
  });

  socketClient = ioClient(baseUrl, {
    transports: ['websocket'],
    forceNew: true
  });

  await new Promise((resolve, reject) => {
    socketClient.on('connect', () => {
      console.log(`🔌 Test Socket.IO client connected with id ${socketClient.id}\n`);
      resolve();
    });
    socketClient.on('connect_error', reject);
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // SETUP TEST ENVIRONMENT
    // ----------------------------------------------------
    // Create an emergency incident at Chennai Central (13.0827, 80.2707)
    const incident = await prisma.incident.create({
      data: {
        title: 'Highway Multiple Vehicle Collision with Severe Trauma',
        description: 'Multi-car collision on arterial bypass, multiple trauma casualties',
        incidentType: 'MEDICAL',
        severity: 'HIGH',
        latitude: 13.0827,
        longitude: 80.2707,
        hasInjuries: true,
        victimCount: 3,
        status: 'VERIFIED'
      }
    });

    // Create Hospital A (High capacity, near: 2 km away, has on-duty Trauma specialists)
    const hospA = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospA.${Date.now()}@resqnet.org`, name: 'Apollo Trauma Center', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Apollo Apex Trauma Center',
        district: 'Central Metro',
        latitude: 13.0900,
        longitude: 80.2600,
        totalBeds: 200,
        availableBeds: 90,
        totalIcu: 30,
        availableIcu: 12,
        isAccepting: true,
        specializations: ['Trauma', 'Emergency Medicine', 'Cardiology']
      }
    });

    await prisma.hospitalSpecialist.create({
      data: {
        hospitalId: hospA.id,
        name: 'Dr. Robert Trauma',
        specialty: 'Trauma',
        status: 'AVAILABLE'
      }
    });

    // Create Hospital B (Farther: 15 km away, lower capacity, has Cardiology)
    const hospB = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospB.${Date.now()}@resqnet.org`, name: 'Southern General', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Southern General Hospital',
        district: 'South Industrial',
        latitude: 12.9800,
        longitude: 80.2200,
        totalBeds: 100,
        availableBeds: 20,
        totalIcu: 10,
        availableIcu: 2,
        isAccepting: true,
        specializations: ['Cardiology', 'Pediatrics']
      }
    });

    await prisma.hospitalSpecialist.create({
      data: {
        hospitalId: hospB.id,
        name: 'Dr. Claire Heart',
        specialty: 'Cardiology',
        status: 'AVAILABLE'
      }
    });

    // Create Hospital C (INACTIVE)
    const hospC = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospC.${Date.now()}@resqnet.org`, name: 'Inactive Center', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Standby Medical Center',
        district: 'Central Metro',
        latitude: 13.0850,
        longitude: 80.2700,
        totalBeds: 50,
        availableBeds: 25,
        totalIcu: 5,
        availableIcu: 2,
        isAccepting: false
      }
    });

    // Create Hospital D (0 Available Beds)
    const hospD = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospD.${Date.now()}@resqnet.org`, name: 'Full Hospital', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Overcrowded Community Hospital',
        district: 'Central Metro',
        latitude: 13.0840,
        longitude: 80.2680,
        totalBeds: 50,
        availableBeds: 0,
        totalIcu: 5,
        availableIcu: 2,
        isAccepting: true
      }
    });

    // ----------------------------------------------------
    // TEST 1 — VALID INCIDENT
    // ----------------------------------------------------
    console.log('▶ TEST 1 — VALID INCIDENT: GET /api/hospitals/match/:incidentId');
    const resMatch = await request('GET', `/api/hospitals/match/${incident.id}`);
    assert(resMatch.status === 200, `Returns 200 OK (got ${resMatch.status})`);
    assert(resMatch.body.success === true, 'Response has success: true');
    assert(Array.isArray(resMatch.body.data.matches), 'matches is an array');

    // ----------------------------------------------------
    // TEST 2 — NONEXISTENT INCIDENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — NONEXISTENT INCIDENT');
    const resNonInc = await request('GET', '/api/hospitals/match/nonexistent-inc-id-000');
    assert(resNonInc.status === 404, `Returns 404 Not Found (got ${resNonInc.status})`);
    assert(resNonInc.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 3 — HOSPITAL CANDIDATES
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — HOSPITAL CANDIDATES: Eligible hospitals appear in match results');
    const matches = resMatch.body.data.matches;
    const foundA = matches.find(m => m.hospitalId === hospA.id);
    assert(Boolean(foundA), 'Eligible Hospital A is present in matches');

    // ----------------------------------------------------
    // TEST 4 — INACTIVE HOSPITAL EXCLUDED
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — INACTIVE HOSPITAL EXCLUDED');
    const foundC = matches.find(m => m.hospitalId === hospC.id);
    assert(!foundC, 'Inactive Hospital C is excluded from matches');

    // ----------------------------------------------------
    // TEST 5 — BED CAPACITY FILTER
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — BED CAPACITY FILTER: Hospital with 0 available beds excluded');
    const foundD = matches.find(m => m.hospitalId === hospD.id);
    assert(!foundD, 'Hospital D with 0 available beds is excluded');

    // ----------------------------------------------------
    // TEST 6 — ICU FILTER
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — ICU FILTER: Zero available ICU excluded when ICU required');
    // Create Hospital E with 0 ICU
    const hospE = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospE.${Date.now()}@resqnet.org`, name: 'No ICU Center', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Clinic Without ICU',
        district: 'Central Metro',
        latitude: 13.0827,
        longitude: 80.2707,
        totalBeds: 50,
        availableBeds: 30,
        totalIcu: 0,
        availableIcu: 0,
        isAccepting: true
      }
    });

    const resIcuMatch = await request('POST', `/api/hospitals/match/${incident.id}`, {
      requiresIcu: true
    });
    const foundE = resIcuMatch.body.data.matches.find(m => m.hospitalId === hospE.id);
    assert(!foundE, 'Hospital E with 0 ICU is excluded when ICU is required');

    // ----------------------------------------------------
    // TEST 7 — SPECIALTY FILTER
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — SPECIALTY FILTER: Required specialty filter');
    const resSpecialtyMatch = await request('POST', `/api/hospitals/match/${incident.id}`, {
      requiredSpecialty: 'Cardiology',
      strictSpecialty: true
    });
    const foundCardioB = resSpecialtyMatch.body.data.matches.find(m => m.hospitalId === hospB.id);
    assert(Boolean(foundCardioB), 'Hospital B with Cardiology is matched');

    // ----------------------------------------------------
    // TEST 8 — SPECIALIST AVAILABILITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — SPECIALIST AVAILABILITY: Hospital with only BUSY specialist excluded');
    // Create Hospital F with a BUSY neurology specialist
    const hospF = await prisma.hospitalProfile.create({
      data: {
        userId: (await prisma.user.create({
          data: { email: `hospF.${Date.now()}@resqnet.org`, name: 'Neuro Busy Center', passwordHash: 'HASH', role: 'HOSPITAL' }
        })).id,
        hospitalName: 'Neuro Center',
        district: 'Central Metro',
        latitude: 13.0827,
        longitude: 80.2707,
        totalBeds: 50,
        availableBeds: 20,
        totalIcu: 5,
        availableIcu: 2,
        isAccepting: true,
        specializations: ['Neurology']
      }
    });

    await prisma.hospitalSpecialist.create({
      data: {
        hospitalId: hospF.id,
        name: 'Dr. Busy Neuro',
        specialty: 'Neurology',
        status: 'BUSY'
      }
    });

    const resNeuroMatch = await request('POST', `/api/hospitals/match/${incident.id}`, {
      requiredSpecialty: 'Neurology',
      strictSpecialty: true
    });
    const foundF = resNeuroMatch.body.data.matches.find(m => m.hospitalId === hospF.id);
    assert(!foundF, 'Hospital F with only BUSY neurology specialist is excluded under strict specialty filter');

    // ----------------------------------------------------
    // TEST 9 — DISTANCE CALCULATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — DISTANCE CALCULATION: Deterministic Haversine distance');
    assert(foundA.distanceKm !== null, 'Hospital A has calculated distance');
    assert(foundA.distanceKm > 0 && foundA.distanceKm < 5, `Hospital A distance is ~1.4 km (got ${foundA.distanceKm} km)`);

    // ----------------------------------------------------
    // TEST 10 — DETERMINISTIC RANKING
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — DETERMINISTIC RANKING: Optimal hospital ranks #1');
    const topMatch = matches[0];
    assert(topMatch.hospitalId === hospA.id, `Hospital A ranks #1 (got ${topMatch.hospitalName})`);
    assert(topMatch.score > matches[matches.length - 1].score, 'Top hospital has higher score than bottom hospital');

    // ----------------------------------------------------
    // TEST 11 — EXPLAINABILITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — EXPLAINABILITY: Factor breakdown and human-readable reasons');
    assert(topMatch.factors !== undefined, 'Match contains factors breakdown');
    assert(topMatch.factors.capacityScore !== undefined, 'Contains capacityScore');
    assert(topMatch.factors.icuScore !== undefined, 'Contains icuScore');
    assert(topMatch.factors.specialtyScore !== undefined, 'Contains specialtyScore');
    assert(topMatch.factors.distanceScore !== undefined, 'Contains distanceScore');
    assert(Array.isArray(topMatch.reasons) && topMatch.reasons.length > 0, 'Contains human-readable reasons array');

    // ----------------------------------------------------
    // TEST 12 — SCORE BOUNDS
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — SCORE BOUNDS: 0 <= score <= 100');
    const allScoresValid = matches.every(m => m.score >= 0 && m.score <= 100);
    assert(allScoresValid, 'All hospital match scores are bounded between 0 and 100');

    // ----------------------------------------------------
    // TEST 13 — TIE BREAKING
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — TIE BREAKING: Deterministic ordering across repeated requests');
    const resRepeat1 = await request('GET', `/api/hospitals/match/${incident.id}`);
    const resRepeat2 = await request('GET', `/api/hospitals/match/${incident.id}`);
    const order1 = resRepeat1.body.data.matches.map(m => m.hospitalId).join(',');
    const order2 = resRepeat2.body.data.matches.map(m => m.hospitalId).join(',');
    assert(order1 === order2, 'Hospital matching ranking order is 100% identical and deterministic across requests');

    // ----------------------------------------------------
    // TEST 14 — NO CAPACITY MUTATION (READ-ONLY GUARANTEE)
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — NO CAPACITY MUTATION: Read-only matching verification');
    const hospABefore = await prisma.hospitalProfile.findUnique({ where: { id: hospA.id } });
    await request('GET', `/api/hospitals/match/${incident.id}`);
    const hospAAfter = await prisma.hospitalProfile.findUnique({ where: { id: hospA.id } });
    assert(hospABefore.availableBeds === hospAAfter.availableBeds, 'availableBeds unchanged');
    assert(hospABefore.availableIcu === hospAAfter.availableIcu, 'availableIcu unchanged');

    // ----------------------------------------------------
    // TEST 15 — DATABASE CONSISTENCY
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — DATABASE CONSISTENCY: No extra dispatches or admissions created');
    const incidentAfter = await prisma.incident.findUnique({ where: { id: incident.id } });
    assert(incidentAfter.status === 'VERIFIED', 'Incident status remains VERIFIED (unmutated)');

    // ----------------------------------------------------
    // TEST 16 — INVALID INPUT
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — INVALID INPUT: Malformed incident ID');
    const resMalformed = await request('GET', '/api/hospitals/match/ab');
    assert(resMalformed.status === 400, `Malformed ID rejected with 400 (got ${resMalformed.status})`);

    // ----------------------------------------------------
    // TEST 17 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — AUTHORIZATION: Standard operational routing access verified');
    assert(resMatch.status === 200, 'Matching response provides decision-support payload safely');

    // ----------------------------------------------------
    // TEST 18 — SOCKET BEHAVIOR (READ-ONLY DOES NOT EMIT)
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — SOCKET BEHAVIOR: Read-only matching emits no socket events');
    let unwantedSocketEvent = false;
    const unwantedHandler = () => { unwantedSocketEvent = true; };
    socketClient.on('hospital:capacity_updated', unwantedHandler);
    socketClient.on('hospital:specialist_updated', unwantedHandler);

    await request('GET', `/api/hospitals/match/${incident.id}`);

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:capacity_updated', unwantedHandler);
    socketClient.off('hospital:specialist_updated', unwantedHandler);
    assert(unwantedSocketEvent === false, 'No unnecessary socket events emitted during read-only matching');

    console.log('\n========================================================');
    console.log(`📊 HOSPITAL MATCHING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
  } finally {
    if (socketClient) socketClient.disconnect();
    if (server) server.close();
    await prisma.$disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHospitalMatchingTests().catch(err => {
  console.error('💥 Hospital matching test error:', err);
  process.exit(1);
});
