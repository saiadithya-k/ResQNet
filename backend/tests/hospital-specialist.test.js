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

async function runHospitalSpecialistTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 11: P4-03 Hospital Specialists Tests');
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
    // Register test hospital 1
    const resHosp1 = await request('POST', '/api/hospitals', {
      name: `City General Hospital ${Date.now()}`,
      district: 'Central Zone',
      latitude: 13.0827,
      longitude: 80.2707
    });
    assert(resHosp1.status === 201, 'Test hospital 1 created');
    const hosp1Id = resHosp1.body.data.id;

    // Register test hospital 2 (for wrong hospital boundary tests)
    const resHosp2 = await request('POST', '/api/hospitals', {
      name: `North Trauma Hospital ${Date.now()}`,
      district: 'North Industrial',
      latitude: 13.0980,
      longitude: 80.2450
    });
    assert(resHosp2.status === 201, 'Test hospital 2 created');
    const hosp2Id = resHosp2.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — CREATE SPECIALIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 1 — CREATE SPECIALIST: POST /api/hospitals/:hospitalId/specialists');
    const resCreateSpec = await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Sarah Connor',
      specialty: 'Trauma',
      subSpecialty: 'Emergency Resuscitation',
      status: 'AVAILABLE',
      phone: '+91-9876543210',
      email: 'sarah.connor@hospital.resqnet.org'
    });

    assert(resCreateSpec.status === 201, `Returns 201 Created (got ${resCreateSpec.status})`);
    assert(resCreateSpec.body.success === true, 'Response has success: true');
    assert(resCreateSpec.body.data.name === 'Dr. Sarah Connor', 'Specialist name matches');
    assert(resCreateSpec.body.data.specialty === 'Trauma', 'Specialty matches');
    assert(resCreateSpec.body.data.status === 'AVAILABLE', 'Status is AVAILABLE');
    const spec1Id = resCreateSpec.body.data.id;

    // ----------------------------------------------------
    // TEST 2 — GET SPECIALISTS LIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — GET SPECIALISTS LIST: GET /api/hospitals/:hospitalId/specialists');
    const resList = await request('GET', `/api/hospitals/${hosp1Id}/specialists`);
    assert(resList.status === 200, `Returns 200 OK (got ${resList.status})`);
    assert(resList.body.success === true, 'Response has success: true');
    assert(Array.isArray(resList.body.data), 'data is an array');
    const foundSpec = resList.body.data.find(s => s.id === spec1Id);
    assert(Boolean(foundSpec), 'Created specialist appears in list');

    // ----------------------------------------------------
    // TEST 3 — GET SPECIALIST BY ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — GET SPECIALIST BY ID: GET /api/hospitals/:hospitalId/specialists/:specialistId');
    const resGetSpec = await request('GET', `/api/hospitals/${hosp1Id}/specialists/${spec1Id}`);
    assert(resGetSpec.status === 200, `Returns 200 OK (got ${resGetSpec.status})`);
    assert(resGetSpec.body.data.id === spec1Id, 'Specialist ID matches');
    assert(resGetSpec.body.data.hospitalId === hosp1Id, 'hospitalId matches');
    assert(resGetSpec.body.data.subSpecialty === 'Emergency Resuscitation', 'subSpecialty matches');

    // ----------------------------------------------------
    // TEST 4 — UPDATE SPECIALIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — UPDATE SPECIALIST: PATCH /api/hospitals/:hospitalId/specialists/:specialistId');
    const resUpdate = await request('PATCH', `/api/hospitals/${hosp1Id}/specialists/${spec1Id}`, {
      status: 'BUSY',
      phone: '+91-9999988888'
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.status === 'BUSY', 'Status updated to BUSY');
    assert(resUpdate.body.data.phone === '+91-9999988888', 'Phone updated');

    const dbSpecAfterUpdate = await prisma.hospitalSpecialist.findUnique({ where: { id: spec1Id } });
    assert(dbSpecAfterUpdate.status === 'BUSY', 'Status change persisted in PostgreSQL');

    // ----------------------------------------------------
    // TEST 5 — DELETE/DEACTIVATE SPECIALIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — DELETE/DEACTIVATE SPECIALIST: DELETE /api/hospitals/:hospitalId/specialists/:specialistId');
    // Create another specialist to deactivate
    const resTemp = await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Temporary Staff',
      specialty: 'Orthopedics'
    });
    const tempSpecId = resTemp.body.data.id;

    const resDeact = await request('DELETE', `/api/hospitals/${hosp1Id}/specialists/${tempSpecId}`);
    assert(resDeact.status === 200, `Returns 200 OK (got ${resDeact.status})`);
    assert(resDeact.body.data.isActive === false, 'Specialist isActive set to false');
    assert(resDeact.body.data.status === 'UNAVAILABLE', 'Specialist status set to UNAVAILABLE');

    // ----------------------------------------------------
    // TEST 6 — NONEXISTENT HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — NONEXISTENT HOSPITAL');
    const resNonHospGet = await request('GET', '/api/hospitals/nonexistent-hosp-000/specialists');
    assert(resNonHospGet.status === 404, `GET specialists on invalid hospital returns 404 (got ${resNonHospGet.status})`);

    const resNonHospPost = await request('POST', '/api/hospitals/nonexistent-hosp-000/specialists', {
      name: 'Dr. Ghost',
      specialty: 'Trauma'
    });
    assert(resNonHospPost.status === 404, `POST specialist on invalid hospital returns 404 (got ${resNonHospPost.status})`);

    // ----------------------------------------------------
    // TEST 7 — NONEXISTENT SPECIALIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — NONEXISTENT SPECIALIST');
    const resNonSpecGet = await request('GET', `/api/hospitals/${hosp1Id}/specialists/nonexistent-spec-000`);
    assert(resNonSpecGet.status === 404, `GET invalid specialist returns 404 (got ${resNonSpecGet.status})`);

    // ----------------------------------------------------
    // TEST 8 — WRONG HOSPITAL BOUNDARY PROTECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — WRONG HOSPITAL: Accessing Hospital 1 specialist via Hospital 2 URL');
    const resWrongHosp = await request('GET', `/api/hospitals/${hosp2Id}/specialists/${spec1Id}`);
    assert(resWrongHosp.status === 404, `Cross-hospital access rejected with 404 (got ${resWrongHosp.status})`);

    const resWrongHospPatch = await request('PATCH', `/api/hospitals/${hosp2Id}/specialists/${spec1Id}`, {
      status: 'AVAILABLE'
    });
    assert(resWrongHospPatch.status === 404, `Cross-hospital modification rejected with 404 (got ${resWrongHospPatch.status})`);

    // ----------------------------------------------------
    // TEST 9 — EMPTY SPECIALTY
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — EMPTY SPECIALTY: Empty string specialty rejected');
    const resEmptySpec = await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Empty',
      specialty: '   '
    });
    assert(resEmptySpec.status === 400, `Empty specialty rejected with 400 (got ${resEmptySpec.status})`);

    // ----------------------------------------------------
    // TEST 10 — INVALID STATUS
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — INVALID STATUS: Unsupported status value');
    const resInvalidStatus = await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Invalid Status',
      specialty: 'Cardiology',
      status: 'INVALID_STATUS_VALUE'
    });
    assert(resInvalidStatus.status === 400, `Invalid status rejected with 400 (got ${resInvalidStatus.status})`);

    // ----------------------------------------------------
    // TEST 11 — MALFORMED BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — MALFORMED BODY: Empty update body');
    const resEmptyUpdate = await request('PATCH', `/api/hospitals/${hosp1Id}/specialists/${spec1Id}`, {});
    assert(resEmptyUpdate.status === 400, `Empty update body rejected with 400 (got ${resEmptyUpdate.status})`);

    // ----------------------------------------------------
    // TEST 12 — SPECIALTY FILTER
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — SPECIALTY FILTER: GET ?specialty=Cardiology');
    // Create Cardiology specialist
    await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Bruce Banner',
      specialty: 'Cardiology',
      status: 'AVAILABLE'
    });
    // Create Neurology specialist
    await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: 'Dr. Stephen Strange',
      specialty: 'Neurology',
      status: 'AVAILABLE'
    });

    const resCardioFilter = await request('GET', `/api/hospitals/${hosp1Id}/specialists?specialty=Cardiology`);
    assert(resCardioFilter.status === 200, 'Specialty filter returns 200');
    assert(resCardioFilter.body.data.every(s => s.specialty === 'Cardiology'), 'All returned specialists have specialty Cardiology');

    // ----------------------------------------------------
    // TEST 13 — AVAILABILITY FILTER
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — AVAILABILITY FILTER: GET ?availability=BUSY');
    const resAvailFilter = await request('GET', `/api/hospitals/${hosp1Id}/specialists?availability=BUSY`);
    assert(resAvailFilter.status === 200, 'Availability filter returns 200');
    assert(resAvailFilter.body.data.every(s => s.status === 'BUSY'), 'All returned specialists have status BUSY');

    // ----------------------------------------------------
    // TEST 14 — DUPLICATE SPECIALIST / HOSPITAL SPECIALIZATIONS SYNC
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — DUPLICATE SPECIALIST / SPECIALIZATIONS SYNC');
    const dbHospital = await prisma.hospitalProfile.findUnique({ where: { id: hosp1Id } });
    assert(dbHospital.specializations.includes('Trauma'), 'Hospital specializations array includes Trauma');
    assert(dbHospital.specializations.includes('Cardiology'), 'Hospital specializations array includes Cardiology');
    assert(dbHospital.specializations.includes('Neurology'), 'Hospital specializations array includes Neurology');

    // ----------------------------------------------------
    // TEST 15 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbSpecialist = await prisma.hospitalSpecialist.findUnique({ where: { id: spec1Id } });
    assert(dbSpecialist !== null, 'Specialist record found in PostgreSQL');
    assert(dbSpecialist.hospitalId === hosp1Id, 'hospitalId in DB matches');
    assert(dbSpecialist.name === 'Dr. Sarah Connor', 'name in DB matches');
    assert(dbSpecialist.specialty === 'Trauma', 'specialty in DB matches');

    // ----------------------------------------------------
    // TEST 16 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — AUTHORIZATION: Hospital scoping verified');
    assert(dbSpecialist.hospitalId === hosp1Id, 'Specialist belongs strictly to authorized hospital');

    // ----------------------------------------------------
    // TEST 17 — SOCKET EVENT: hospital:specialist_updated
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — SOCKET EVENT: hospital:specialist_updated');
    let receivedSocketEvent = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.hospitalId === hosp1Id && data.specialistId === spec1Id) {
          receivedSocketEvent = data;
          socketClient.off('hospital:specialist_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('hospital:specialist_updated', handler);
    });

    await request('PATCH', `/api/hospitals/${hosp1Id}/specialists/${spec1Id}`, {
      status: 'AVAILABLE'
    });

    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Specialist socket event timeout')), 3000))
    ]);

    assert(receivedSocketEvent !== null, 'Received hospital:specialist_updated via Socket.IO');
    assert(receivedSocketEvent.status === 'AVAILABLE', 'Socket event status is AVAILABLE');

    // ----------------------------------------------------
    // TEST 18 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('hospital:specialist_updated', unwantedHandler);

    await request('POST', `/api/hospitals/${hosp1Id}/specialists`, {
      name: '',
      specialty: 'Trauma'
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:specialist_updated', unwantedHandler);
    assert(unwantedEvent === false, 'No event emitted on validation failure');

    console.log('\n========================================================');
    console.log(`📊 SPECIALIST TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runHospitalSpecialistTests().catch(err => {
  console.error('💥 Hospital specialist test error:', err);
  process.exit(1);
});
