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

async function runLocationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 3: P3-03 Responder GPS / Location Tests');
  console.log('🧪 ========================================================\n');

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
    // SETUP: Create a test responder
    // ----------------------------------------------------
    const uniqueEmail = `gps.tester.${Date.now()}@resqnet.org`;
    const uniqueBadge = `GPS-${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/responders', {
      name: 'Sergeant Sarah Connor',
      email: uniqueEmail,
      badgeNumber: uniqueBadge,
      responderType: 'PARAMEDIC',
      status: 'AVAILABLE'
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — VALID LOCATION
    // ----------------------------------------------------
    console.log('▶ TEST 1 — VALID LOCATION: PATCH /api/responders/:id/location');
    const resValidLoc = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0827,
      longitude: 80.2707
    });
    assert(resValidLoc.status === 200, `Returns 200 OK (got ${resValidLoc.status})`);
    assert(resValidLoc.body.success === true, 'Response has success: true');
    assert(resValidLoc.body.data.latitude === 13.0827, 'Latitude matches 13.0827');
    assert(resValidLoc.body.data.longitude === 80.2707, 'Longitude matches 80.2707');
    assert(Boolean(resValidLoc.body.data.lastLocationTime), 'lastLocationTime is present');

    // ----------------------------------------------------
    // TEST 2 — SOUTHERN / WESTERN COORDINATES
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — SOUTHERN/WESTERN COORDINATES (Sydney: -33.8688, 151.2093)');
    const resNegative = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: -33.8688,
      longitude: 151.2093
    });
    assert(resNegative.status === 200, `Returns 200 OK (got ${resNegative.status})`);
    assert(resNegative.body.data.latitude === -33.8688, 'Negative latitude persisted correctly');
    assert(resNegative.body.data.longitude === 151.2093, 'Longitude persisted correctly');

    // ----------------------------------------------------
    // TEST 3 — BOUNDARY COORDINATES (90, 180) and (-90, -180)
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — BOUNDARY COORDINATES (90, 180) and (-90, -180)');
    const resBoundUpper = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 90,
      longitude: 180
    });
    assert(resBoundUpper.status === 200, `Upper boundary (90, 180) accepted with 200 OK`);

    const resBoundLower = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: -90,
      longitude: -180
    });
    assert(resBoundLower.status === 200, `Lower boundary (-90, -180) accepted with 200 OK`);

    // ----------------------------------------------------
    // TEST 4 — INVALID LATITUDE ABOVE RANGE (latitude = 91)
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — INVALID LATITUDE ABOVE RANGE (latitude = 91)');
    const resLatAbove = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 91,
      longitude: 80.2707
    });
    assert(resLatAbove.status === 400, `Returns 400 Bad Request (got ${resLatAbove.status})`);
    assert(resLatAbove.body.success === false, 'Response has success: false');

    const dbRecordAfterLatAbove = await prisma.responderProfile.findUnique({ where: { id: responderId } });
    assert(dbRecordAfterLatAbove.latitude === -90, 'Database latitude remained unchanged at previous valid value (-90)');

    // ----------------------------------------------------
    // TEST 5 — INVALID LATITUDE BELOW RANGE (latitude = -91)
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — INVALID LATITUDE BELOW RANGE (latitude = -91)');
    const resLatBelow = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: -91,
      longitude: 80.2707
    });
    assert(resLatBelow.status === 400, `Returns 400 Bad Request (got ${resLatBelow.status})`);
    assert(resLatBelow.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 6 — INVALID LONGITUDE ABOVE RANGE (longitude = 181)
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — INVALID LONGITUDE ABOVE RANGE (longitude = 181)');
    const resLngAbove = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0827,
      longitude: 181
    });
    assert(resLngAbove.status === 400, `Returns 400 Bad Request (got ${resLngAbove.status})`);
    assert(resLngAbove.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 7 — INVALID LONGITUDE BELOW RANGE (longitude = -181)
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — INVALID LONGITUDE BELOW RANGE (longitude = -181)');
    const resLngBelow = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0827,
      longitude: -181
    });
    assert(resLngBelow.status === 400, `Returns 400 Bad Request (got ${resLngBelow.status})`);
    assert(resLngBelow.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 8 — NON-NUMERIC LATITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — NON-NUMERIC LATITUDE (latitude = "abc")');
    const resNonNumLat = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 'abc',
      longitude: 80.2707
    });
    assert(resNonNumLat.status === 400, `Returns 400 Bad Request (got ${resNonNumLat.status})`);
    assert(resNonNumLat.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 9 — NON-NUMERIC LONGITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NON-NUMERIC LONGITUDE (longitude = "abc")');
    const resNonNumLng = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0827,
      longitude: 'abc'
    });
    assert(resNonNumLng.status === 400, `Returns 400 Bad Request (got ${resNonNumLng.status})`);
    assert(resNonNumLng.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 10 — MISSING LATITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — MISSING LATITUDE');
    const resMissLat = await request('PATCH', `/api/responders/${responderId}/location`, {
      longitude: 80.2707
    });
    assert(resMissLat.status === 400, `Returns 400 Bad Request (got ${resMissLat.status})`);
    assert(resMissLat.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 11 — MISSING LONGITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — MISSING LONGITUDE');
    const resMissLng = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0827
    });
    assert(resMissLng.status === 400, `Returns 400 Bad Request (got ${resMissLng.status})`);
    assert(resMissLng.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 12 — EMPTY BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — EMPTY BODY');
    const resEmpty = await request('PATCH', `/api/responders/${responderId}/location`, {});
    assert(resEmpty.status === 400, `Returns 400 Bad Request (got ${resEmpty.status})`);
    assert(resEmpty.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 13 — NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — NONEXISTENT RESPONDER');
    const resNonExistent = await request('PATCH', '/api/responders/nonexistent-uuid-9999/location', {
      latitude: 13.0827,
      longitude: 80.2707
    });
    assert(resNonExistent.status === 404, `Returns 404 Not Found (got ${resNonExistent.status})`);
    assert(resNonExistent.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 14 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — DATABASE PERSISTENCE');
    const resUpdateDirect = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 12.9716,
      longitude: 77.5946
    });
    assert(resUpdateDirect.status === 200, 'Location update succeeded with 200 OK');

    const dbProfileDirect = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbProfileDirect.latitude === 12.9716, 'PostgreSQL latitude matches 12.9716');
    assert(dbProfileDirect.longitude === 77.5946, 'PostgreSQL longitude matches 77.5946');
    assert(dbProfileDirect.lastLocationTime !== null, 'PostgreSQL lastLocationTime is populated');

    // ----------------------------------------------------
    // TEST 15 — TIMESTAMP UPDATE
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — TIMESTAMP UPDATE');
    const initialTimestamp = dbProfileDirect.lastLocationTime.getTime();

    // Sleep 15ms so timestamp advances
    await new Promise(resolve => setTimeout(resolve, 20));

    const resTimeUpdate = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 12.9720,
      longitude: 77.5950
    });
    const updatedDbProfile = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    const newTimestamp = updatedDbProfile.lastLocationTime.getTime();
    assert(newTimestamp > initialTimestamp, `lastLocationTime was advanced by server on update (${newTimestamp} > ${initialTimestamp})`);

    // ----------------------------------------------------
    // TEST 16 — SOCKET EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — SOCKET EVENT: Verify responder:location_updated is broadcast');
    let socketLocationEvent = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.responderId === responderId) {
          socketLocationEvent = data;
          socketClient.off('responder:location_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('responder:location_updated', handler);
    });

    const resSocketTrigger = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 13.0850,
      longitude: 80.2600
    });
    assert(resSocketTrigger.status === 200, 'Location update request returned 200 OK');

    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket location event timeout')), 3000))
    ]);

    assert(socketLocationEvent !== null, 'Received responder:location_updated event via Socket.IO');
    assert(socketLocationEvent.responderId === responderId, 'Event responderId matches');
    assert(socketLocationEvent.latitude === 13.0850, 'Event latitude matches 13.0850');
    assert(socketLocationEvent.longitude === 80.2600, 'Event longitude matches 80.2600');
    assert(Boolean(socketLocationEvent.timestamp), 'Event timestamp is present');

    // ----------------------------------------------------
    // TEST 17 — NO SOCKET EVENT ON VALIDATION FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — NO SOCKET EVENT ON VALIDATION FAILURE');
    let unwantedEventReceived = false;
    const unwantedHandler = (data) => {
      if (data.responderId === responderId) {
        unwantedEventReceived = true;
      }
    };
    socketClient.on('responder:location_updated', unwantedHandler);

    const resFail = await request('PATCH', `/api/responders/${responderId}/location`, {
      latitude: 999,
      longitude: 999
    });
    assert(resFail.status === 400, 'Validation failure returns 400 Bad Request');

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('responder:location_updated', unwantedHandler);
    assert(unwantedEventReceived === false, 'No responder:location_updated event was emitted on validation failure');

    // ----------------------------------------------------
    // TEST 18 — NO SOCKET EVENT FOR NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — NO SOCKET EVENT FOR NONEXISTENT RESPONDER');
    let nonExistentEventReceived = false;
    const nonExistentHandler = (data) => {
      if (data.responderId === 'nonexistent-uuid-9999') {
        nonExistentEventReceived = true;
      }
    };
    socketClient.on('responder:location_updated', nonExistentHandler);

    const resNonExistentLoc = await request('PATCH', '/api/responders/nonexistent-uuid-9999/location', {
      latitude: 13.08,
      longitude: 80.27
    });
    assert(resNonExistentLoc.status === 404, 'Nonexistent responder returns 404');

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('responder:location_updated', nonExistentHandler);
    assert(nonExistentEventReceived === false, 'No location event emitted for nonexistent responder');

    // ----------------------------------------------------
    // TEST 19 — PHASE 2 REGRESSION (Status endpoint & event)
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — PHASE 2 REGRESSION (Status Management)');
    const resStatus = await request('PATCH', `/api/responders/${responderId}/status`, {
      status: 'DISPATCHED'
    });
    assert(resStatus.status === 200, 'Status update to DISPATCHED returns 200');
    assert(resStatus.body.data.status === 'DISPATCHED', 'Returned status is DISPATCHED');

    // ----------------------------------------------------
    // TEST 20 — PHASE 1 REGRESSION (CRUD)
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — PHASE 1 REGRESSION (Responder CRUD)');
    const listRes = await request('GET', '/api/responders');
    assert(listRes.status === 200, 'GET /api/responders returns 200');

    const getRes = await request('GET', `/api/responders/${responderId}`);
    assert(getRes.status === 200, 'GET /api/responders/:id returns 200');

    const patchRes = await request('PATCH', `/api/responders/${responderId}`, {
      name: 'Sarah Connor (Special Unit)'
    });
    assert(patchRes.status === 200, 'PATCH /api/responders/:id returns 200');

    const deleteRes = await request('DELETE', `/api/responders/${responderId}`);
    assert(deleteRes.status === 200, 'DELETE /api/responders/:id returns 200');
    assert(deleteRes.body.data.status === 'OFF_DUTY', 'Soft-deactivated to OFF_DUTY');

    console.log('\n========================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runLocationTests().catch(err => {
  console.error('💥 Location test error:', err);
  process.exit(1);
});
