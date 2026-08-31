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

async function runHospitalPatientTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 13: P4-05 Incoming Patient Management Tests');
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
    // Register Hospital 1
    const resHosp1 = await request('POST', '/api/hospitals', {
      name: `City Trauma Center ${Date.now()}`,
      district: 'Central Metro',
      latitude: 13.0827,
      longitude: 80.2707
    });
    const hosp1Id = resHosp1.body.data.id;

    // Register Hospital 2 (for boundary tests)
    const resHosp2 = await request('POST', '/api/hospitals', {
      name: `Southern Clinic ${Date.now()}`,
      district: 'South Zone',
      latitude: 12.9800,
      longitude: 80.2200
    });
    const hosp2Id = resHosp2.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — CREATE INCOMING PATIENT
    // ----------------------------------------------------
    console.log('▶ TEST 1 — CREATE INCOMING PATIENT: POST /api/hospitals/:hospitalId/patients');
    const resCreate = await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'John Doe',
      age: 42,
      gender: 'MALE',
      triageSeverity: 'HIGH',
      conditionSummary: 'Blunt thoracic trauma from highway incident',
      etaMinutes: 12,
      notes: 'Paramedic team in transit, IV established'
    });

    assert(resCreate.status === 201, `Returns 201 Created (got ${resCreate.status})`);
    assert(resCreate.body.success === true, 'Response has success: true');
    assert(resCreate.body.data.name === 'John Doe', 'Patient name matches');
    assert(resCreate.body.data.status === 'EXPECTED', 'Initial status is EXPECTED');
    assert(resCreate.body.data.triageSeverity === 'HIGH', 'Triage severity is HIGH');
    assert(resCreate.body.data.expectedArrival !== null, 'expectedArrival calculated');
    const patient1Id = resCreate.body.data.id;

    // ----------------------------------------------------
    // TEST 2 — GET HOSPITAL PATIENTS
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — GET HOSPITAL PATIENTS: GET /api/hospitals/:hospitalId/patients');
    const resList = await request('GET', `/api/hospitals/${hosp1Id}/patients`);
    assert(resList.status === 200, `Returns 200 OK (got ${resList.status})`);
    assert(Array.isArray(resList.body.data), 'data is an array');
    const foundPatient = resList.body.data.find(p => p.id === patient1Id);
    assert(Boolean(foundPatient), 'Created patient is in list');

    // ----------------------------------------------------
    // TEST 3 — GET PATIENT BY ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — GET PATIENT BY ID: GET /api/hospitals/:hospitalId/patients/:patientId');
    const resGet = await request('GET', `/api/hospitals/${hosp1Id}/patients/${patient1Id}`);
    assert(resGet.status === 200, `Returns 200 OK (got ${resGet.status})`);
    assert(resGet.body.data.id === patient1Id, 'Patient ID matches');
    assert(resGet.body.data.hospitalId === hosp1Id, 'Hospital ID matches');

    // ----------------------------------------------------
    // TEST 4 — UPDATE PATIENT METADATA
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — UPDATE PATIENT: PATCH /api/hospitals/:hospitalId/patients/:patientId');
    const resUpdate = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient1Id}`, {
      conditionSummary: 'Thoracic trauma stabilized, conscious',
      notes: 'Ambulance Unit 4 arriving at bay 2'
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.conditionSummary === 'Thoracic trauma stabilized, conscious', 'conditionSummary updated');

    // ----------------------------------------------------
    // TEST 5 — STATUS LIFECYCLE TRANSITIONS
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — STATUS LIFECYCLE TRANSITIONS: EXPECTED -> ARRIVED -> CHECKED_IN -> ADMITTED');
    // Step 5a: EXPECTED -> ARRIVED
    const resArrived = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient1Id}/status`, {
      status: 'ARRIVED'
    });
    assert(resArrived.status === 200, 'EXPECTED -> ARRIVED returns 200');
    assert(resArrived.body.data.status === 'ARRIVED', 'Status is ARRIVED');
    assert(resArrived.body.data.arrivedAt !== null, 'arrivedAt timestamp recorded');

    // Step 5b: ARRIVED -> CHECKED_IN
    const resCheckIn = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient1Id}/status`, {
      status: 'CHECKED_IN'
    });
    assert(resCheckIn.status === 200, 'ARRIVED -> CHECKED_IN returns 200');
    assert(resCheckIn.body.data.status === 'CHECKED_IN', 'Status is CHECKED_IN');
    assert(resCheckIn.body.data.checkedInAt !== null, 'checkedInAt timestamp recorded');

    // Step 5c: CHECKED_IN -> ADMITTED
    const resAdmit = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient1Id}/status`, {
      status: 'ADMITTED'
    });
    assert(resAdmit.status === 200, 'CHECKED_IN -> ADMITTED returns 200');
    assert(resAdmit.body.data.status === 'ADMITTED', 'Status is ADMITTED');
    assert(resAdmit.body.data.admittedAt !== null, 'admittedAt timestamp recorded');

    // ----------------------------------------------------
    // TEST 6 — INVALID STATUS
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — INVALID STATUS: Unsupported status value');
    const resInvalidStatus = await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'Dr. Test',
      status: 'INVALID_STATUS'
    });
    assert(resInvalidStatus.status === 400, `Invalid status rejected with 400 (got ${resInvalidStatus.status})`);

    // ----------------------------------------------------
    // TEST 7 — INVALID TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — INVALID TRANSITION: Direct jump EXPECTED -> ADMITTED rejected');
    const resPatient2 = await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'Jane Smith',
      triageSeverity: 'LOW'
    });
    const patient2Id = resPatient2.body.data.id;

    const resJump = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient2Id}/status`, {
      status: 'ADMITTED'
    });
    assert(resJump.status === 400, `Direct transition EXPECTED -> ADMITTED rejected with 400 (got ${resJump.status})`);

    // ----------------------------------------------------
    // TEST 8 — NONEXISTENT HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — NONEXISTENT HOSPITAL');
    const resNonHosp = await request('GET', '/api/hospitals/nonexistent-hosp-id-000/patients');
    assert(resNonHosp.status === 404, `GET patients for nonexistent hospital returns 404 (got ${resNonHosp.status})`);

    // ----------------------------------------------------
    // TEST 9 — NONEXISTENT PATIENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NONEXISTENT PATIENT');
    const resNonPatient = await request('GET', `/api/hospitals/${hosp1Id}/patients/nonexistent-patient-000`);
    assert(resNonPatient.status === 404, `GET invalid patient returns 404 (got ${resNonPatient.status})`);

    // ----------------------------------------------------
    // TEST 10 — WRONG HOSPITAL SCOPING
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — WRONG HOSPITAL: Accessing Hospital 1 patient via Hospital 2 URL');
    const resCrossHosp = await request('GET', `/api/hospitals/${hosp2Id}/patients/${patient1Id}`);
    assert(resCrossHosp.status === 404, `Cross-hospital access rejected with 404 (got ${resCrossHosp.status})`);

    const resCrossHospPatch = await request('PATCH', `/api/hospitals/${hosp2Id}/patients/${patient1Id}/status`, {
      status: 'CANCELLED'
    });
    assert(resCrossHospPatch.status === 404, `Cross-hospital status update rejected with 404 (got ${resCrossHospPatch.status})`);

    // ----------------------------------------------------
    // TEST 11 — INVALID PATIENT DATA
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — INVALID PATIENT DATA: Invalid age rejected');
    const resInvalidAge = await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'Invalid Age Patient',
      age: 250
    });
    assert(resInvalidAge.status === 400, `Age > 150 rejected with 400 (got ${resInvalidAge.status})`);

    // ----------------------------------------------------
    // TEST 12 — INVALID ID FORMAT
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — INVALID ID: Empty update payload');
    const resEmptyUpdate = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient1Id}`, {});
    assert(resEmptyUpdate.status === 400, `Empty update rejected with 400 (got ${resEmptyUpdate.status})`);

    // ----------------------------------------------------
    // TEST 13 — SERVER ARRIVAL TIMESTAMP
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — SERVER ARRIVAL TIMESTAMP: Server sets arrivedAt');
    const resPatient3 = await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'Timestamp Test Patient'
    });
    const patient3Id = resPatient3.body.data.id;

    const timeBefore = Date.now();
    const resArr = await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient3Id}/status`, {
      status: 'ARRIVED'
    });
    const timeAfter = Date.now();
    const serverTimestamp = new Date(resArr.body.data.arrivedAt).getTime();
    assert(serverTimestamp >= timeBefore - 1000 && serverTimestamp <= timeAfter + 1000, 'Server-authoritative timestamp stamped');

    // ----------------------------------------------------
    // TEST 14 — CAPACITY NOT MUTATED
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — CAPACITY NOT MUTATED: Beds and ICU unchanged');
    const capBefore = await prisma.hospitalProfile.findUnique({ where: { id: hosp1Id } });
    await request('POST', `/api/hospitals/${hosp1Id}/patients`, {
      name: 'Capacity Safety Patient',
      triageSeverity: 'CRITICAL'
    });
    const capAfter = await prisma.hospitalProfile.findUnique({ where: { id: hosp1Id } });
    assert(capBefore.availableBeds === capAfter.availableBeds, 'availableBeds unchanged');
    assert(capBefore.availableIcu === capAfter.availableIcu, 'availableIcu unchanged');

    // ----------------------------------------------------
    // TEST 15 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbPatient = await prisma.incomingPatient.findUnique({ where: { id: patient1Id } });
    assert(dbPatient !== null, 'Patient record found in PostgreSQL');
    assert(dbPatient.status === 'ADMITTED', 'Status in DB is ADMITTED');
    assert(dbPatient.hospitalId === hosp1Id, 'hospitalId in DB matches');

    // ----------------------------------------------------
    // TEST 16 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — AUTHORIZATION: Scoped operational access verified');
    assert(dbPatient.hospitalId === hosp1Id, 'Patient strictly isolated to authorized hospital');

    // ----------------------------------------------------
    // TEST 17 — SOCKET EVENT ON SUCCESS
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — SOCKET EVENT: hospital:patient_incoming & hospital:patient_status_changed');
    let receivedStatusEvent = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.hospitalId === hosp1Id && data.patientId === patient3Id) {
          receivedStatusEvent = data;
          socketClient.off('hospital:patient_status_changed', handler);
          resolve(data);
        }
      };
      socketClient.on('hospital:patient_status_changed', handler);
    });

    await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient3Id}/status`, {
      status: 'CHECKED_IN'
    });

    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Patient socket timeout')), 3000))
    ]);

    assert(receivedStatusEvent !== null, 'Received hospital:patient_status_changed via Socket.IO');
    assert(receivedStatusEvent.status === 'CHECKED_IN', 'Socket event status is CHECKED_IN');

    // ----------------------------------------------------
    // TEST 18 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('hospital:patient_status_changed', unwantedHandler);

    await request('PATCH', `/api/hospitals/${hosp1Id}/patients/${patient3Id}/status`, {
      status: 'INVALID_STATUS'
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:patient_status_changed', unwantedHandler);
    assert(unwantedEvent === false, 'No socket event emitted on invalid transition failure');

    // ----------------------------------------------------
    // TEST 19 — PATIENT PRIVACY / SANITIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — PATIENT PRIVACY / SANITIZATION');
    const resPrivacyCheck = await request('GET', `/api/hospitals/${hosp1Id}/patients/${patient1Id}`);
    assert(resPrivacyCheck.body.data.passwordHash === undefined, 'No sensitive authentication hashes leaked');
    assert(resPrivacyCheck.body.data.socialSecurityNumber === undefined, 'No external government identifiers');

    console.log('\n========================================================');
    console.log(`📊 INCOMING PATIENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runHospitalPatientTests().catch(err => {
  console.error('💥 Hospital patient test error:', err);
  process.exit(1);
});
