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

async function runTransferTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 16: P4-08 Resource Transfers Tests');
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
    // 1. Setup Hospital A (Source)
    const resHospA = await request('POST', '/api/hospitals', {
      name: `Source Hospital Center ${Date.now()}`,
      district: 'North Zone',
      latitude: 13.0800,
      longitude: 80.2700
    });
    const hospAId = resHospA.body.data.id;

    // 2. Setup Hospital B (Destination)
    const resHospB = await request('POST', '/api/hospitals', {
      name: `Destination Regional Clinic ${Date.now()}`,
      district: 'South Zone',
      latitude: 13.0200,
      longitude: 80.2400
    });
    const hospBId = resHospB.body.data.id;

    // 3. Setup Hospital C (Unrelated)
    const resHospC = await request('POST', '/api/hospitals', {
      name: `Unrelated Third Hospital ${Date.now()}`,
      district: 'West Zone',
      latitude: 13.0500,
      longitude: 80.2100
    });
    const hospCId = resHospC.body.data.id;

    // 4. Create Resource under Hospital A (50 total, 50 available)
    const resResource = await request('POST', `/api/hospitals/${hospAId}/resources`, {
      name: 'Portable Transport Ventilators',
      category: 'VENTILATOR',
      quantity: 50,
      availableQty: 50,
      unit: 'units'
    });
    const resourceId = resResource.body.data.id;

    // 5. Create Coordination Request (Hospital B requesting 10 ventilators from Hospital A)
    const resCoordReq = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 10,
      notes: 'Emergency transport surge'
    });
    const transferId = resCoordReq.body.data.id;

    // ----------------------------------------------------
    // TEST 2 — UNAPPROVED TRANSFER BLOCKED
    // ----------------------------------------------------
    console.log('▶ TEST 2 — UNAPPROVED TRANSFER BLOCKED: Attempting to start in REQUESTED state');
    const resBlockedStart = await request('POST', `/api/resource-transfers/${transferId}/start`, {
      actingHospitalId: hospAId
    });
    assert(resBlockedStart.status === 400, `Unapproved transfer start blocked with 400 (got ${resBlockedStart.status})`);

    // Approve the coordination request
    const resApprove = await request('PATCH', `/api/resources/coordination-requests/${transferId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });
    assert(resApprove.status === 200, 'Coordination request approved (200 OK)');

    // ----------------------------------------------------
    // TEST 1 — APPROVED TRANSFER STARTS
    // ----------------------------------------------------
    console.log('\n▶ TEST 1 — APPROVED TRANSFER STARTS: POST /api/resource-transfers/:id/start');
    const resStart = await request('POST', `/api/resource-transfers/${transferId}/start`, {
      actingHospitalId: hospAId
    });
    assert(resStart.status === 200, `Returns 200 OK (got ${resStart.status})`);
    assert(resStart.body.data.status === 'IN_TRANSIT', 'Status updated to IN_TRANSIT');
    assert(Boolean(resStart.body.data.inTransitAt), 'inTransitAt timestamp stamped');

    // ----------------------------------------------------
    // TEST 3 — VALID IN_TRANSIT TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — VALID IN_TRANSIT STATE');
    const resGetTransit = await request('GET', `/api/resource-transfers/${transferId}`);
    assert(resGetTransit.status === 200, 'GET transfer returns 200');
    assert(resGetTransit.body.data.status === 'IN_TRANSIT', 'Transfer confirmed IN_TRANSIT');

    // ----------------------------------------------------
    // TEST 15 — ATOMIC SOURCE INVENTORY UPDATE
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — ATOMIC SOURCE INVENTORY UPDATE');
    const dbSourceRes = await prisma.resource.findUnique({ where: { id: resourceId } });
    assert(dbSourceRes.availableQty === 40, `Source available quantity decremented to 40 (50 - 10, got ${dbSourceRes.availableQty})`);

    // ----------------------------------------------------
    // TEST 4 — INVALID TRANSITION
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — INVALID TRANSITION: Re-starting in-transit transfer');
    const resRestart = await request('POST', `/api/resource-transfers/${transferId}/start`, {
      actingHospitalId: hospAId
    });
    assert(resRestart.status === 400, `Re-starting in-transit transfer rejected with 400 (got ${resRestart.status})`);

    // ----------------------------------------------------
    // TEST 5 — DELIVERY
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — DELIVERY: POST /api/resource-transfers/:id/deliver');
    const resDeliver = await request('POST', `/api/resource-transfers/${transferId}/deliver`, {
      actingHospitalId: hospAId
    });
    assert(resDeliver.status === 200, `Returns 200 OK (got ${resDeliver.status})`);
    assert(resDeliver.body.data.status === 'DELIVERED', 'Status updated to DELIVERED');
    assert(Boolean(resDeliver.body.data.deliveredAt), 'deliveredAt timestamp stamped');

    // ----------------------------------------------------
    // TEST 6 — RECEIPT
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — RECEIPT: POST /api/resource-transfers/:id/receive');
    const resReceive = await request('POST', `/api/resource-transfers/${transferId}/receive`, {
      actingHospitalId: hospBId
    });
    assert(resReceive.status === 200, `Returns 200 OK (got ${resReceive.status})`);
    assert(resReceive.body.data.status === 'RECEIVED', 'Status updated to RECEIVED');
    assert(Boolean(resReceive.body.data.receivedAt), 'receivedAt timestamp stamped');

    // ----------------------------------------------------
    // TEST 16 — DESTINATION INVENTORY UPDATE ON RECEIPT
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — DESTINATION INVENTORY CREDITED');
    const destRes = await prisma.resource.findFirst({
      where: { hospitalId: hospBId, name: 'Portable Transport Ventilators' }
    });
    assert(destRes !== null, 'Resource registered in destination hospital inventory');
    assert(destRes.availableQty === 10, `Destination hospital has 10 available ventilators (got ${destRes.availableQty})`);

    // ----------------------------------------------------
    // TEST 7 — DUPLICATE RECEIPT REJECTED
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — DUPLICATE RECEIPT PROTECTION');
    const resDupReceive = await request('POST', `/api/resource-transfers/${transferId}/receive`, {
      actingHospitalId: hospBId
    });
    assert(resDupReceive.status === 400, `Duplicate receipt rejected with 400 (got ${resDupReceive.status})`);
    const destResAfterDup = await prisma.resource.findFirst({
      where: { hospitalId: hospBId, name: 'Portable Transport Ventilators' }
    });
    assert(destResAfterDup.availableQty === 10, 'Destination inventory count NOT duplicated (still 10)');

    // ----------------------------------------------------
    // TEST 8 — INVALID TRANSFER ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — INVALID TRANSFER ID');
    const resNonTransfer = await request('GET', '/api/resource-transfers/nonexistent-transfer-id-000');
    assert(resNonTransfer.status === 404, `Invalid transfer returns 404 (got ${resNonTransfer.status})`);

    // ----------------------------------------------------
    // TEST 9 — SOURCE HOSPITAL AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — SOURCE HOSPITAL AUTHORIZATION');
    const resReqForAuth = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 5
    });
    const authTransferId = resReqForAuth.body.data.id;
    await request('PATCH', `/api/resources/coordination-requests/${authTransferId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });

    const resUnauthStart = await request('POST', `/api/resource-transfers/${authTransferId}/start`, {
      actingHospitalId: hospBId // Destination hospital attempting to start
    });
    assert(resUnauthStart.status === 403, `Non-source start rejected with 403 Forbidden (got ${resUnauthStart.status})`);

    // ----------------------------------------------------
    // TEST 10 — DESTINATION RECEIPT AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — DESTINATION RECEIPT AUTHORIZATION');
    await request('POST', `/api/resource-transfers/${authTransferId}/start`, {
      actingHospitalId: hospAId
    });
    const resUnauthReceive = await request('POST', `/api/resource-transfers/${authTransferId}/receive`, {
      actingHospitalId: hospAId // Source hospital attempting to receive
    });
    assert(resUnauthReceive.status === 403, `Non-destination receipt rejected with 403 Forbidden (got ${resUnauthReceive.status})`);

    // ----------------------------------------------------
    // TEST 11 — UNRELATED HOSPITAL REJECTED
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — UNRELATED HOSPITAL REJECTED');
    const resReqForC = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 3
    });
    const transferForCId = resReqForC.body.data.id;
    await request('PATCH', `/api/resources/coordination-requests/${transferForCId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });

    const resThirdStart = await request('POST', `/api/resource-transfers/${transferForCId}/start`, {
      actingHospitalId: hospCId
    });
    assert(resThirdStart.status === 403, `Third hospital start rejected with 403 (got ${resThirdStart.status})`);

    const resThirdReceive = await request('POST', `/api/resource-transfers/${authTransferId}/receive`, {
      actingHospitalId: hospCId
    });
    assert(resThirdReceive.status === 403, `Third hospital receive rejected with 403 (got ${resThirdReceive.status})`);

    // ----------------------------------------------------
    // TEST 12 — OWNERSHIP PROTECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — OWNERSHIP PROTECTION');
    const dbTransferRecord = await prisma.resourceTransfer.findUnique({ where: { id: authTransferId } });
    assert(dbTransferRecord.fromHospitalId === hospAId, 'fromHospitalId immutable (remains Hospital A)');
    assert(dbTransferRecord.toHospitalId === hospBId, 'toHospitalId immutable (remains Hospital B)');

    // ----------------------------------------------------
    // TEST 13 — QUANTITY VALIDATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — QUANTITY VALIDATION');
    assert(dbTransferRecord.quantity > 0, 'Transfer quantity verified positive');

    // ----------------------------------------------------
    // TEST 14 — INSUFFICIENT QUANTITY REJECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — INSUFFICIENT QUANTITY REJECTION');
    // Source currently has 35 available (50 - 10 - 5 = 35)
    // Create coordination request for 100 units
    const resReqExcess = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 100
    });
    const excessTransferId = resReqExcess.body.data.id;
    await request('PATCH', `/api/resources/coordination-requests/${excessTransferId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });

    const resExcessStart = await request('POST', `/api/resource-transfers/${excessTransferId}/start`, {
      actingHospitalId: hospAId
    });
    assert(resExcessStart.status === 400, `Excess quantity transfer rejected with 400 (got ${resExcessStart.status})`);

    // ----------------------------------------------------
    // TEST 17 — NO NEGATIVE INVENTORY
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — NO NEGATIVE INVENTORY');
    const dbSourceResCheck = await prisma.resource.findUnique({ where: { id: resourceId } });
    assert(dbSourceResCheck.availableQty >= 0, `Source availableQty non-negative (${dbSourceResCheck.availableQty})`);

    // ----------------------------------------------------
    // TEST 18 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbFinalTransfer = await prisma.resourceTransfer.findUnique({ where: { id: transferId } });
    assert(dbFinalTransfer.status === 'RECEIVED', 'Transfer record in PostgreSQL is RECEIVED');
    assert(dbFinalTransfer.inTransitAt !== null, 'inTransitAt persisted in DB');
    assert(dbFinalTransfer.deliveredAt !== null, 'deliveredAt persisted in DB');
    assert(dbFinalTransfer.receivedAt !== null, 'receivedAt persisted in DB');

    // ----------------------------------------------------
    // TEST 19 — SOCKET START EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — SOCKET EVENT: resource:transfer_started');
    const resReqSocket = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 2
    });
    const socketTransferId = resReqSocket.body.data.id;
    await request('PATCH', `/api/resources/coordination-requests/${socketTransferId}/status`, {
      status: 'APPROVED',
      actingHospitalId: hospAId
    });

    let receivedStartEvent = null;
    const socketStartPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.transferId === socketTransferId) {
          receivedStartEvent = data;
          socketClient.off('resource:transfer_started', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:transfer_started', handler);
    });

    await request('POST', `/api/resource-transfers/${socketTransferId}/start`, {
      actingHospitalId: hospAId
    });

    await Promise.race([
      socketStartPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket start timeout')), 3000))
    ]);

    assert(receivedStartEvent !== null, 'Received resource:transfer_started via Socket.IO');
    assert(receivedStartEvent.status === 'IN_TRANSIT', 'Socket event status is IN_TRANSIT');

    // ----------------------------------------------------
    // TEST 20 — SOCKET STATUS EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — SOCKET EVENT: resource:transfer_updated');
    let receivedUpdateEvent = null;
    const socketUpdatePromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.transferId === socketTransferId) {
          receivedUpdateEvent = data;
          socketClient.off('resource:transfer_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:transfer_updated', handler);
    });

    await request('POST', `/api/resource-transfers/${socketTransferId}/deliver`, {
      actingHospitalId: hospAId
    });

    await Promise.race([
      socketUpdatePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket update timeout')), 3000))
    ]);

    assert(receivedUpdateEvent !== null, 'Received resource:transfer_updated via Socket.IO');
    assert(receivedUpdateEvent.status === 'DELIVERED', 'Socket event status is DELIVERED');

    // ----------------------------------------------------
    // TEST 21 — SOCKET RECEIPT EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 21 — SOCKET EVENT: resource:transfer_received');
    let receivedReceiptEvent = null;
    const socketReceiptPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.transferId === socketTransferId) {
          receivedReceiptEvent = data;
          socketClient.off('resource:transfer_received', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:transfer_received', handler);
    });

    await request('POST', `/api/resource-transfers/${socketTransferId}/receive`, {
      actingHospitalId: hospBId
    });

    await Promise.race([
      socketReceiptPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket receipt timeout')), 3000))
    ]);

    assert(receivedReceiptEvent !== null, 'Received resource:transfer_received via Socket.IO');
    assert(receivedReceiptEvent.status === 'RECEIVED', 'Socket event status is RECEIVED');

    // ----------------------------------------------------
    // TEST 22 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 22 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('resource:transfer_received', unwantedHandler);

    // Attempt duplicate receive which should fail
    await request('POST', `/api/resource-transfers/${socketTransferId}/receive`, {
      actingHospitalId: hospBId
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('resource:transfer_received', unwantedHandler);
    assert(unwantedEvent === false, 'No socket event emitted on failure');

    console.log('\n========================================================');
    console.log(`📊 RESOURCE TRANSFER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runTransferTests().catch(err => {
  console.error('💥 Resource transfer test error:', err);
  process.exit(1);
});
