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

async function runStatusTests() {
  console.log('🧪 =======================================================');
  console.log('🧪 ResQNet Phase 2: P3-02 Responder Status Management Tests');
  console.log('🧪 =======================================================\n');

  // Start HTTP and Socket.IO server
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

  // Connect Socket.IO client
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
    // SETUP: Create a fresh test responder
    // ----------------------------------------------------
    const uniqueEmail = `status.tester.${Date.now()}@resqnet.org`;
    const uniqueBadge = `STAT-${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/responders', {
      name: 'Lieutenant Frank Castle',
      email: uniqueEmail,
      badgeNumber: uniqueBadge,
      responderType: 'PARAMEDIC',
      status: 'AVAILABLE'
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — CURRENT STATUS
    // ----------------------------------------------------
    console.log('▶ TEST 1 — CURRENT STATUS: Verify initial responder status in PostgreSQL');
    const initialDbRecord = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(initialDbRecord !== null, 'Responder profile found in PostgreSQL');
    assert(initialDbRecord.status === 'AVAILABLE', 'Initial status in database is AVAILABLE');

    // ----------------------------------------------------
    // TEST 2 — VALID STATUS UPDATE
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — VALID STATUS UPDATE: PATCH /api/responders/:id/status (AVAILABLE -> DISPATCHED)');
    const resUpdate1 = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'DISPATCHED'
    });
    assert(resUpdate1.status === 200, `Returns 200 OK (got ${resUpdate1.status})`);
    assert(resUpdate1.body.success === true, 'Response has success: true');
    assert(resUpdate1.body.data.status === 'DISPATCHED', 'Returned status is DISPATCHED');

    const dbRecord2 = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbRecord2.status === 'DISPATCHED', 'PostgreSQL status persisted as DISPATCHED');

    // ----------------------------------------------------
    // TEST 3 — SECOND VALID TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — SECOND VALID TRANSITION: PATCH /api/responders/:id/status (DISPATCHED -> EN_ROUTE)');
    const resUpdate2 = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'EN_ROUTE'
    });
    assert(resUpdate2.status === 200, `Returns 200 OK (got ${resUpdate2.status})`);
    assert(resUpdate2.body.data.status === 'EN_ROUTE', 'Returned status is EN_ROUTE');

    const dbRecord3 = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbRecord3.status === 'EN_ROUTE', 'PostgreSQL status persisted as EN_ROUTE');

    // ----------------------------------------------------
    // TEST 4 — INVALID STATUS VALUE
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — INVALID STATUS VALUE: status = "INVALID_STATUS"');
    const resInvalidStatus = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'INVALID_STATUS'
    });
    assert(resInvalidStatus.status === 400, `Returns 400 Bad Request (got ${resInvalidStatus.status})`);
    assert(resInvalidStatus.body.success === false, 'Response has success: false');

    const dbRecordAfterInvalid = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbRecordAfterInvalid.status === 'EN_ROUTE', 'Database status was NOT changed');

    // ----------------------------------------------------
    // TEST 5 — MISSING STATUS
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — MISSING STATUS: empty payload {}');
    const resMissingStatus = await request('PATCH', `/api/responders/${responderId}/status`, {});
    assert(resMissingStatus.status === 400, `Returns 400 Bad Request (got ${resMissingStatus.status})`);
    assert(resMissingStatus.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 6 — NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — NONEXISTENT RESPONDER: nonexistent-id');
    const resNotFound = await request('PATCH', '/api/responders/nonexistent-uuid-9999/status', {
      status: 'AVAILABLE'
    });
    assert(resNotFound.status === 404, `Returns 404 Not Found (got ${resNotFound.status})`);
    assert(resNotFound.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 7 — INVALID TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — INVALID TRANSITION: Attempt OFF_DUTY -> TRANSPORTING');
    // First set responder to OFF_DUTY
    await request('PATCH', `/api/responders/${responderId}/status`, { status: 'OFF_DUTY' });
    const dbOffDuty = await prisma.responderProfile.findUnique({ where: { id: responderId } });
    assert(dbOffDuty.status === 'OFF_DUTY', 'Responder is currently OFF_DUTY');

    // Now attempt invalid transition directly to TRANSPORTING
    const resInvalidTransition = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'TRANSPORTING'
    });
    assert(resInvalidTransition.status === 400, `Returns 400 Bad Request for invalid transition (got ${resInvalidTransition.status})`);
    assert(resInvalidTransition.body.success === false, 'Response has success: false');

    const dbAfterInvalidTransition = await prisma.responderProfile.findUnique({ where: { id: responderId } });
    assert(dbAfterInvalidTransition.status === 'OFF_DUTY', 'Database status remains OFF_DUTY');

    // ----------------------------------------------------
    // TEST 8 — SOCKET EVENT ON SUCCESSFUL STATUS CHANGE
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — SOCKET EVENT: Verify responder:status_changed is broadcast');
    // Set to AVAILABLE first
    await request('PATCH', `/api/responders/${responderId}/status`, { status: 'AVAILABLE' });

    let socketEventReceived = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.responderId === responderId) {
          socketEventReceived = data;
          socketClient.off('responder:status_changed', handler);
          resolve(data);
        }
      };
      socketClient.on('responder:status_changed', handler);
    });

    const resSocketTrigger = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'DISPATCHED'
    });
    assert(resSocketTrigger.status === 200, 'Status update succeeded with 200 OK');

    // Wait for event with timeout
    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket event timeout')), 3000))
    ]);

    assert(socketEventReceived !== null, 'Received responder:status_changed event via Socket.IO');
    assert(socketEventReceived.responderId === responderId, 'Event responderId matches');
    assert(socketEventReceived.status === 'DISPATCHED', 'Event status is DISPATCHED');
    assert(socketEventReceived.previousStatus === 'AVAILABLE', 'Event previousStatus is AVAILABLE');
    assert(Boolean(socketEventReceived.timestamp), 'Event timestamp is present');

    // ----------------------------------------------------
    // TEST 9 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NO SOCKET EVENT ON FAILURE');
    let unwantedEventReceived = false;
    const unwantedHandler = (data) => {
      if (data.responderId === responderId) {
        unwantedEventReceived = true;
      }
    };
    socketClient.on('responder:status_changed', unwantedHandler);

    const resFailedReq = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'INVALID_ENUM_XYZ'
    });
    assert(resFailedReq.status === 400, 'Failed request returned 400 Bad Request');

    // Wait 500ms to ensure no event fires
    await new Promise(resolve => setTimeout(resolve, 500));
    socketClient.off('responder:status_changed', unwantedHandler);

    assert(unwantedEventReceived === false, 'No responder:status_changed event was emitted on failed request');

    // ----------------------------------------------------
    // TEST 10 — DATABASE CONSISTENCY
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — DATABASE CONSISTENCY: Verify PostgreSQL matches API response');
    const finalUpdateRes = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'EN_ROUTE'
    });
    assert(finalUpdateRes.status === 200, 'Update succeeded with 200 OK');

    const finalDbRecord = await prisma.responderProfile.findUnique({
      where: { id: responderId },
      include: { user: true }
    });
    assert(finalDbRecord.status === finalUpdateRes.body.data.status, 'PostgreSQL status matches API response data.status');
    assert(finalDbRecord.status === 'EN_ROUTE', 'PostgreSQL status is EN_ROUTE');

    // ----------------------------------------------------
    // TEST 11 — PHASE 1 REGRESSION
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — PHASE 1 REGRESSION');
    // List
    const regList = await request('GET', '/api/responders');
    assert(regList.status === 200, 'GET /api/responders returns 200');

    // Create
    const regCreate = await request('POST', '/api/responders', {
      name: 'Regression Paramedic',
      email: `reg.${Date.now()}@resqnet.org`,
      responderType: 'PARAMEDIC'
    });
    assert(regCreate.status === 201, 'POST /api/responders returns 201');
    const regId = regCreate.body.data.id;

    // Get
    const regGet = await request('GET', `/api/responders/${regId}`);
    assert(regGet.status === 200, 'GET /api/responders/:id returns 200');

    // Patch general
    const regPatch = await request('PATCH', `/api/responders/${regId}`, { name: 'Regression Unit 2' });
    assert(regPatch.status === 200, 'PATCH /api/responders/:id returns 200');

    // Delete (Deactivate)
    const regDelete = await request('DELETE', `/api/responders/${regId}`);
    assert(regDelete.status === 200, 'DELETE /api/responders/:id returns 200');

    // Preserved Location
    const regLoc = await request('PATCH', `/api/responders/${regId}/location`, { latitude: 13.08, longitude: 80.27 });
    assert(regLoc.status === 200, 'PATCH /api/responders/:id/location returns 200');

    // ----------------------------------------------------
    // TEST 12 — APPLICATION STARTUP
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — APPLICATION STARTUP & HEALTH');
    const resHealth = await request('GET', '/health');
    assert(resHealth.status === 200, 'Health check returns 200 OK');
    assert(resHealth.body.status === 'ONLINE', 'System is ONLINE');

    console.log('\n=======================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=======================================================\n');
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

runStatusTests().catch(err => {
  console.error('💥 Test execution error:', err);
  process.exit(1);
});
