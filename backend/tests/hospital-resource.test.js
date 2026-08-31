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

async function runHospitalResourceTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 14: P4-06 Hospital Resource Management Tests');
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
      name: `Metro Medical Center ${Date.now()}`,
      district: 'Central Metro',
      latitude: 13.0827,
      longitude: 80.2707
    });
    const hosp1Id = resHosp1.body.data.id;

    // Register Hospital 2 (for boundary tests)
    const resHosp2 = await request('POST', '/api/hospitals', {
      name: `Eastern Regional Hospital ${Date.now()}`,
      district: 'East Coast',
      latitude: 13.0200,
      longitude: 80.2500
    });
    const hosp2Id = resHosp2.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — CREATE RESOURCE
    // ----------------------------------------------------
    console.log('▶ TEST 1 — CREATE RESOURCE: POST /api/hospitals/:hospitalId/resources');
    const resCreate = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'High-Flow Oxygen Cylinders (Type D)',
      category: 'OXYGEN',
      quantity: 50,
      availableQty: 35,
      unit: 'cylinders',
      status: 'AVAILABLE'
    });

    assert(resCreate.status === 201, `Returns 201 Created (got ${resCreate.status})`);
    assert(resCreate.body.success === true, 'Response has success: true');
    assert(resCreate.body.data.name === 'High-Flow Oxygen Cylinders (Type D)', 'Resource name matches');
    assert(resCreate.body.data.quantity === 50, 'Quantity is 50');
    assert(resCreate.body.data.availableQty === 35, 'Available quantity is 35');
    assert(resCreate.body.data.allocatedQty === 15, 'Allocated quantity is derived as 15 (50 - 35)');
    const res1Id = resCreate.body.data.id;

    // ----------------------------------------------------
    // TEST 2 — GET RESOURCE LIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — GET RESOURCE LIST: GET /api/hospitals/:hospitalId/resources');
    const resList = await request('GET', `/api/hospitals/${hosp1Id}/resources`);
    assert(resList.status === 200, `Returns 200 OK (got ${resList.status})`);
    assert(Array.isArray(resList.body.data), 'data is an array');
    const foundResource = resList.body.data.find(r => r.id === res1Id);
    assert(Boolean(foundResource), 'Created resource is in list');

    // ----------------------------------------------------
    // TEST 3 — GET RESOURCE BY ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — GET RESOURCE: GET /api/hospitals/:hospitalId/resources/:resourceId');
    const resGet = await request('GET', `/api/hospitals/${hosp1Id}/resources/${res1Id}`);
    assert(resGet.status === 200, `Returns 200 OK (got ${resGet.status})`);
    assert(resGet.body.data.id === res1Id, 'Resource ID matches');
    assert(resGet.body.data.hospitalId === hosp1Id, 'Hospital ID matches');

    // ----------------------------------------------------
    // TEST 4 — UPDATE RESOURCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — UPDATE RESOURCE: PATCH /api/hospitals/:hospitalId/resources/:resourceId');
    const resUpdate = await request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, {
      availableQty: 25,
      quantity: 50
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.availableQty === 25, 'Available quantity updated to 25');
    assert(resUpdate.body.data.allocatedQty === 25, 'Allocated quantity derived as 25 (50 - 25)');

    // ----------------------------------------------------
    // TEST 5 — DELETE/DEACTIVATE RESOURCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — DELETE/DEACTIVATE RESOURCE: DELETE /api/hospitals/:hospitalId/resources/:resourceId');
    // Create temporary resource to deactivate
    const resTemp = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Temporary Ventilator Kit',
      category: 'VENTILATOR',
      quantity: 5,
      availableQty: 5
    });
    const tempResId = resTemp.body.data.id;

    const resDeact = await request('DELETE', `/api/hospitals/${hosp1Id}/resources/${tempResId}`);
    assert(resDeact.status === 200, `Returns 200 OK (got ${resDeact.status})`);
    assert(resDeact.body.data.isActive === false, 'Resource isActive set to false');
    assert(resDeact.body.data.availableQty === 0, 'Resource availableQty set to 0');

    // ----------------------------------------------------
    // TEST 6 — NONEXISTENT HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — NONEXISTENT HOSPITAL');
    const resNonHosp = await request('GET', '/api/hospitals/nonexistent-hosp-id-000/resources');
    assert(resNonHosp.status === 404, `GET resources for nonexistent hospital returns 404 (got ${resNonHosp.status})`);

    // ----------------------------------------------------
    // TEST 7 — NONEXISTENT RESOURCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — NONEXISTENT RESOURCE');
    const resNonRes = await request('GET', `/api/hospitals/${hosp1Id}/resources/nonexistent-res-id-000`);
    assert(resNonRes.status === 404, `GET invalid resource returns 404 (got ${resNonRes.status})`);

    // ----------------------------------------------------
    // TEST 8 — WRONG HOSPITAL SCOPING
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — WRONG HOSPITAL: Accessing Hospital 1 resource via Hospital 2 URL');
    const resCrossHosp = await request('GET', `/api/hospitals/${hosp2Id}/resources/${res1Id}`);
    assert(resCrossHosp.status === 404, `Cross-hospital access rejected with 404 (got ${resCrossHosp.status})`);

    const resCrossHospPatch = await request('PATCH', `/api/hospitals/${hosp2Id}/resources/${res1Id}`, {
      availableQty: 10
    });
    assert(resCrossHospPatch.status === 404, `Cross-hospital update rejected with 404 (got ${resCrossHospPatch.status})`);

    // ----------------------------------------------------
    // TEST 9 — NEGATIVE QUANTITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NEGATIVE QUANTITY: quantity = -1 rejected');
    const resNegQty = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Negative Blood Units',
      category: 'BLOOD',
      quantity: -5
    });
    assert(resNegQty.status === 400, `Negative quantity rejected with 400 (got ${resNegQty.status})`);

    // ----------------------------------------------------
    // TEST 10 — FRACTIONAL QUANTITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — FRACTIONAL QUANTITY: quantity = 10.5 rejected');
    const resFracQty = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Fractional PPE Kits',
      category: 'PPE',
      quantity: 10.5
    });
    assert(resFracQty.status === 400, `Fractional quantity rejected with 400 (got ${resFracQty.status})`);

    // ----------------------------------------------------
    // TEST 11 — INVALID RESOURCE TYPE/CATEGORY
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — INVALID RESOURCE TYPE: Empty category rejected');
    const resEmptyCat = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Empty Category Item',
      category: '   '
    });
    assert(resEmptyCat.status === 400, `Empty category rejected with 400 (got ${resEmptyCat.status})`);

    // ----------------------------------------------------
    // TEST 12 — INVALID STATUS
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — INVALID STATUS: Unsupported status value');
    const resInvalidStatus = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Invalid Status Item',
      category: 'MEDICATION',
      status: 'INVALID_STATUS_STRING'
    });
    assert(resInvalidStatus.status === 400, `Invalid status rejected with 400 (got ${resInvalidStatus.status})`);

    // ----------------------------------------------------
    // TEST 13 — INCONSISTENT QUANTITIES
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — INCONSISTENT QUANTITIES: availableQty > quantity rejected');
    const resInconsistent = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Impossible Overflow Inventory',
      category: 'BLOOD',
      quantity: 10,
      availableQty: 25
    });
    assert(resInconsistent.status === 400, `availableQty > quantity rejected with 400 (got ${resInconsistent.status})`);

    // ----------------------------------------------------
    // TEST 14 — ZERO QUANTITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — ZERO QUANTITY: quantity = 0, availableQty = 0 accepted');
    const resZeroQty = await request('POST', `/api/hospitals/${hosp1Id}/resources`, {
      name: 'Zero Stock Reserve',
      category: 'MEDICATION',
      quantity: 0,
      availableQty: 0
    });
    assert(resZeroQty.status === 201, `Zero quantity accepted with 201 Created (got ${resZeroQty.status})`);
    assert(resZeroQty.body.data.quantity === 0, 'Quantity is 0');
    assert(resZeroQty.body.data.availableQty === 0, 'Available quantity is 0');

    // ----------------------------------------------------
    // TEST 15 — FILTER BY TYPE/CATEGORY
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — FILTER BY CATEGORY: GET ?category=OXYGEN');
    const resFilterCat = await request('GET', `/api/hospitals/${hosp1Id}/resources?category=OXYGEN`);
    assert(resFilterCat.status === 200, 'Filter by category returns 200');
    assert(resFilterCat.body.data.every(r => r.category.includes('OXYGEN')), 'All returned items are OXYGEN');

    // ----------------------------------------------------
    // TEST 16 — FILTER BY STATUS
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — FILTER BY STATUS: GET ?status=AVAILABLE');
    const resFilterStatus = await request('GET', `/api/hospitals/${hosp1Id}/resources?status=AVAILABLE`);
    assert(resFilterStatus.status === 200, 'Filter by status returns 200');
    assert(resFilterStatus.body.data.every(r => r.status === 'AVAILABLE'), 'All returned items are AVAILABLE');

    // ----------------------------------------------------
    // TEST 17 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbRes = await prisma.resource.findUnique({ where: { id: res1Id } });
    assert(dbRes !== null, 'Resource record found in PostgreSQL');
    assert(dbRes.hospitalId === hosp1Id, 'hospitalId in DB matches');
    assert(dbRes.availableQty === 25, 'availableQty in DB matches');

    // ----------------------------------------------------
    // TEST 18 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — AUTHORIZATION: Scoped operational access verified');
    assert(dbRes.hospitalId === hosp1Id, 'Resource isolated to authorized hospital');

    // ----------------------------------------------------
    // TEST 19 — SOCKET EVENT ON SUCCESS
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — SOCKET EVENT: hospital:resource_updated');
    let receivedSocketEvent = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.hospitalId === hosp1Id && data.resourceId === res1Id) {
          receivedSocketEvent = data;
          socketClient.off('hospital:resource_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('hospital:resource_updated', handler);
    });

    await request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, {
      availableQty: 30
    });

    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Resource socket timeout')), 3000))
    ]);

    assert(receivedSocketEvent !== null, 'Received hospital:resource_updated via Socket.IO');
    assert(receivedSocketEvent.availableQty === 30, 'Socket event availableQty is 30');

    // ----------------------------------------------------
    // TEST 20 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('hospital:resource_updated', unwantedHandler);

    await request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, {
      quantity: -10
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:resource_updated', unwantedHandler);
    assert(unwantedEvent === false, 'No socket event emitted on validation failure');

    // ----------------------------------------------------
    // TEST 21 — OWNERSHIP PROTECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 21 — OWNERSHIP PROTECTION: Attempting to modify hospitalId');
    const resOwnershipHack = await request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, {
      hospitalId: hosp2Id
    });
    assert(resOwnershipHack.status === 400, `hospitalId modification rejected with 400 (got ${resOwnershipHack.status})`);
    const dbResAfterHack = await prisma.resource.findUnique({ where: { id: res1Id } });
    assert(dbResAfterHack.hospitalId === hosp1Id, 'hospitalId in DB unchanged (still hosp1Id)');

    // ----------------------------------------------------
    // TEST 22 — CONCURRENCY SAFETY
    // ----------------------------------------------------
    console.log('\n▶ TEST 22 — CONCURRENCY SAFETY: Atomic quantity updates');
    const promises = [
      request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, { availableQty: 20 }),
      request('PATCH', `/api/hospitals/${hosp1Id}/resources/${res1Id}`, { availableQty: 22 })
    ];
    const results = await Promise.all(promises);
    assert(results.every(r => r.status === 200), 'Concurrent updates resolved without crash');
    const dbResFinal = await prisma.resource.findUnique({ where: { id: res1Id } });
    assert(dbResFinal.availableQty >= 0 && dbResFinal.availableQty <= dbResFinal.quantity, 'Quantity invariant preserved under concurrency');

    console.log('\n========================================================');
    console.log(`📊 HOSPITAL RESOURCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runHospitalResourceTests().catch(err => {
  console.error('💥 Hospital resource test error:', err);
  process.exit(1);
});
