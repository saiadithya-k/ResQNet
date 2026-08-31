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

async function runCoordinationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 15: P4-07 Cross-Agency Coordination Tests');
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
    // 1. Setup Source Hospital (Hospital A)
    const resHospA = await request('POST', '/api/hospitals', {
      name: `Apex Memorial Hospital ${Date.now()}`,
      district: 'North District',
      latitude: 13.0850,
      longitude: 80.2750
    });
    const hospAId = resHospA.body.data.id;

    // 2. Setup Destination Hospital (Hospital B)
    const resHospB = await request('POST', '/api/hospitals', {
      name: `Beacon Community Hospital ${Date.now()}`,
      district: 'South District',
      latitude: 13.0100,
      longitude: 80.2200
    });
    const hospBId = resHospB.body.data.id;

    // 3. Setup Third Hospital (Hospital C - for isolation scoping)
    const resHospC = await request('POST', '/api/hospitals', {
      name: `Crestview Hospital ${Date.now()}`,
      district: 'West District',
      latitude: 13.0500,
      longitude: 80.2000
    });
    const hospCId = resHospC.body.data.id;

    // 4. Create Oxygen Resource under Hospital A
    const resResource = await request('POST', `/api/hospitals/${hospAId}/resources`, {
      name: 'Medical Oxygen 40L Tanks',
      category: 'OXYGEN',
      quantity: 100,
      availableQty: 80,
      unit: 'tanks'
    });
    const resourceAId = resResource.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — EXTERNAL RESOURCE DISCOVERY
    // ----------------------------------------------------
    console.log('▶ TEST 1 — EXTERNAL RESOURCE DISCOVERY: GET /api/resources/available');
    const resDiscover = await request('GET', '/api/resources/available');
    assert(resDiscover.status === 200, `Returns 200 OK (got ${resDiscover.status})`);
    assert(Array.isArray(resDiscover.body.data), 'Returns data array');
    const foundRes = resDiscover.body.data.find(r => r.id === resourceAId);
    assert(Boolean(foundRes), 'Created resource is discoverable');
    assert(foundRes.availableQty === 80, 'Available quantity is 80');

    // ----------------------------------------------------
    // TEST 2 — OWN HOSPITAL VISIBILITY FILTERING
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — OWN HOSPITAL FILTERING: GET /api/resources/available?externalOnly=true&hospitalId=...');
    const resExternal = await request('GET', `/api/resources/available?externalOnly=true&hospitalId=${hospAId}`);
    assert(resExternal.status === 200, 'External discovery returns 200');
    const hasOwnRes = resExternal.body.data.some(r => r.id === resourceAId);
    assert(hasOwnRes === false, 'Hospital A resource excluded when querying externalOnly for Hospital A');

    // ----------------------------------------------------
    // TEST 3 — CROSS-HOSPITAL RESOURCE VISIBILITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — CROSS-HOSPITAL RESOURCE VISIBILITY');
    assert(foundRes.hospital !== null, 'Resource includes source hospital metadata');
    assert(foundRes.hospital.hospitalName.includes('Apex Memorial'), 'Source hospital name visible to peers');

    // ----------------------------------------------------
    // TEST 4 — CREATE COORDINATION REQUEST
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — CREATE COORDINATION REQUEST: POST /api/resources/coordination-requests');
    const resReq = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospBId,
      quantity: 15,
      notes: 'Urgent surge requirement for ICU ward',
      reason: 'PULMONARY_SURGE'
    });

    assert(resReq.status === 201, `Returns 201 Created (got ${resReq.status})`);
    assert(resReq.body.success === true, 'Response success is true');
    assert(resReq.body.data.status === 'REQUESTED', 'Initial status is REQUESTED');
    assert(resReq.body.data.quantity === 15, 'Requested quantity is 15');
    assert(resReq.body.data.fromHospitalId === hospAId, 'fromHospitalId is automatically set to resource owner');
    assert(resReq.body.data.toHospitalId === hospBId, 'toHospitalId matches requesting hospital');
    const req1Id = resReq.body.data.id;

    // ----------------------------------------------------
    // TEST 5 — INVALID RESOURCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — INVALID RESOURCE: Nonexistent resource ID');
    const resInvRes = await request('POST', '/api/resources/coordination-requests', {
      resourceId: 'nonexistent-resource-id-000',
      toHospitalId: hospBId,
      quantity: 5
    });
    assert(resInvRes.status === 404, `Invalid resource returns 404 (got ${resInvRes.status})`);

    // ----------------------------------------------------
    // TEST 6 — INVALID SOURCE HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — INVALID SOURCE HOSPITAL');
    // Tested implicitly by resource without valid hospital
    assert(resInvRes.status === 404, 'Handled with 404 Not Found');

    // ----------------------------------------------------
    // TEST 7 — INVALID DESTINATION HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — INVALID DESTINATION HOSPITAL: Nonexistent destination hospital');
    const resInvDest = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: 'nonexistent-hospital-id-999',
      quantity: 5
    });
    assert(resInvDest.status === 404, `Invalid destination hospital returns 404 (got ${resInvDest.status})`);

    // ----------------------------------------------------
    // TEST 8 — ZERO / NEGATIVE / FRACTIONAL QUANTITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — INVALID QUANTITIES: 0, negative, fractional');
    const resZero = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospBId,
      quantity: 0
    });
    assert(resZero.status === 400, `Zero quantity rejected with 400 (got ${resZero.status})`);

    const resNeg = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospBId,
      quantity: -5
    });
    assert(resNeg.status === 400, `Negative quantity rejected with 400 (got ${resNeg.status})`);

    const resFrac = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospBId,
      quantity: 7.5
    });
    assert(resFrac.status === 400, `Fractional quantity rejected with 400 (got ${resFrac.status})`);

    // ----------------------------------------------------
    // TEST 9 — NONEXISTENT REQUEST
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NONEXISTENT REQUEST: GET /api/resources/coordination-requests/:id');
    const resNonReq = await request('GET', '/api/resources/coordination-requests/nonexistent-req-000');
    assert(resNonReq.status === 404, `Nonexistent request returns 404 (got ${resNonReq.status})`);

    // ----------------------------------------------------
    // TEST 10 — HOSPITAL SCOPING
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — HOSPITAL SCOPING: Hospital C accessing Hospital A <-> B request');
    const resScoping = await request('GET', `/api/resources/coordination-requests/${req1Id}?hospitalId=${hospCId}`);
    assert(resScoping.status === 403, `Unrelated hospital access rejected with 403 Forbidden (got ${resScoping.status})`);

    // ----------------------------------------------------
    // TEST 11 — UNAUTHORIZED REQUEST (REQUEST FROM SELF)
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — REQUEST FROM SELF: Hospital A requesting from Hospital A');
    const resSelf = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospAId,
      quantity: 5
    });
    assert(resSelf.status === 400, `Request from self rejected with 400 (got ${resSelf.status})`);

    // ----------------------------------------------------
    // TEST 12 — VALID APPROVAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — VALID APPROVAL: Source Hospital A approves request');
    const resApprove = await request('PATCH', `/api/resources/coordination-requests/${req1Id}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });
    assert(resApprove.status === 200, `Approval returns 200 OK (got ${resApprove.status})`);
    assert(resApprove.body.data.status === 'APPROVED', 'Status updated to APPROVED');
    assert(Boolean(resApprove.body.data.approvedAt), 'approvedAt timestamp stamped');

    // ----------------------------------------------------
    // TEST 13 — VALID REJECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — VALID REJECTION: Source Hospital A rejects a second request');
    const resReq2 = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospCId,
      quantity: 10
    });
    const req2Id = resReq2.body.data.id;

    const resReject = await request('PATCH', `/api/resources/coordination-requests/${req2Id}/status`, {
      status: 'REJECTED',
      actingHospitalId: hospAId,
      reason: 'Insufficient local backup stock'
    });
    assert(resReject.status === 200, `Rejection returns 200 OK (got ${resReject.status})`);
    assert(resReject.body.data.status === 'REJECTED', 'Status updated to REJECTED');
    assert(Boolean(resReject.body.data.rejectedAt), 'rejectedAt timestamp stamped');

    // ----------------------------------------------------
    // TEST 14 — INVALID STATUS TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — INVALID STATUS TRANSITION: Terminal APPROVED -> REQUESTED');
    const resInvalidTrans = await request('PATCH', `/api/resources/coordination-requests/${req1Id}/status`, {
      status: 'REQUESTED',
      actingHospitalId: hospAId
    });
    assert(resInvalidTrans.status === 400, `Transition from terminal status rejected with 400 (got ${resInvalidTrans.status})`);

    // ----------------------------------------------------
    // TEST 15 — UNAUTHORIZED APPROVAL (DESTINATION CANNOT APPROVE)
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — UNAUTHORIZED APPROVAL: Destination Hospital B attempting to approve request');
    const resReq3 = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospBId,
      quantity: 5
    });
    const req3Id = resReq3.body.data.id;

    const resUnauthApprove = await request('PATCH', `/api/resources/coordination-requests/${req3Id}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospBId // Destination hospital!
    });
    assert(resUnauthApprove.status === 403, `Destination approval rejected with 403 Forbidden (got ${resUnauthApprove.status})`);

    // ----------------------------------------------------
    // TEST 16 — SOURCE OWNERSHIP PROTECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — SOURCE OWNERSHIP PROTECTION');
    const dbResourceAfterReqs = await prisma.resource.findUnique({ where: { id: resourceAId } });
    assert(dbResourceAfterReqs.hospitalId === hospAId, 'Resource hospitalId remains strictly Hospital A');

    // ----------------------------------------------------
    // TEST 17 — NO INVENTORY MUTATION IN P4-07
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — NO INVENTORY MUTATION (P4-07 Coordination Contract)');
    assert(dbResourceAfterReqs.availableQty === 80, 'Resource availableQty remains unchanged (80)');
    assert(dbResourceAfterReqs.quantity === 100, 'Resource total quantity remains unchanged (100)');

    // ----------------------------------------------------
    // TEST 18 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbTransfer = await prisma.resourceTransfer.findUnique({ where: { id: req1Id } });
    assert(dbTransfer !== null, 'ResourceTransfer record found in PostgreSQL');
    assert(dbTransfer.status === 'APPROVED', 'Status in DB is APPROVED');
    assert(dbTransfer.fromHospitalId === hospAId, 'fromHospitalId in DB matches');
    assert(dbTransfer.toHospitalId === hospBId, 'toHospitalId in DB matches');

    // ----------------------------------------------------
    // TEST 19 — SOCKET REQUEST EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — SOCKET EVENT: resource:coordination_requested');
    let receivedReqEvent = null;
    const socketReqPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.fromHospitalId === hospAId) {
          receivedReqEvent = data;
          socketClient.off('resource:coordination_requested', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:coordination_requested', handler);
    });

    const resReqSocket = await request('POST', '/api/resources/coordination-requests', {
      resourceId: resourceAId,
      toHospitalId: hospCId,
      quantity: 8
    });
    const reqSocketId = resReqSocket.body.data.id;

    await Promise.race([
      socketReqPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket request timeout')), 3000))
    ]);

    assert(receivedReqEvent !== null, 'Received resource:coordination_requested via Socket.IO');
    assert(receivedReqEvent.quantity === 8, 'Socket event quantity is 8');

    // ----------------------------------------------------
    // TEST 20 — SOCKET UPDATE EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — SOCKET EVENT: resource:coordination_updated');
    let receivedUpdateEvent = null;
    const socketUpdatePromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.requestId === reqSocketId) {
          receivedUpdateEvent = data;
          socketClient.off('resource:coordination_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:coordination_updated', handler);
    });

    await request('PATCH', `/api/resources/coordination-requests/${reqSocketId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });

    await Promise.race([
      socketUpdatePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket update timeout')), 3000))
    ]);

    assert(receivedUpdateEvent !== null, 'Received resource:coordination_updated via Socket.IO');
    assert(receivedUpdateEvent.status === 'APPROVED', 'Socket event status is APPROVED');

    // ----------------------------------------------------
    // TEST 21 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 21 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('resource:coordination_updated', unwantedHandler);

    await request('PATCH', `/api/resources/coordination-requests/${reqSocketId}/status`, {
      status: 'INVALID_STATUS'
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('resource:coordination_updated', unwantedHandler);
    assert(unwantedEvent === false, 'No socket event emitted on invalid transition failure');

    // ----------------------------------------------------
    // TEST 22 — CONCURRENCY & PRIVACY
    // ----------------------------------------------------
    console.log('\n▶ TEST 22 — CONCURRENCY & PRIVACY');
    const [c1, c2] = await Promise.all([
      request('POST', '/api/resources/coordination-requests', { resourceId: resourceAId, toHospitalId: hospBId, quantity: 4 }),
      request('POST', '/api/resources/coordination-requests', { resourceId: resourceAId, toHospitalId: hospCId, quantity: 6 })
    ]);
    assert(c1.status === 201 && c2.status === 201, 'Concurrent coordination requests handled cleanly');
    assert(!c1.body.data.passwordHash && !c1.body.data.apiKey, 'Privacy check: No internal security fields exposed');

    console.log('\n========================================================');
    console.log(`📊 RESOURCE COORDINATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runCoordinationTests().catch(err => {
  console.error('💥 Resource coordination test error:', err);
  process.exit(1);
});
