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

async function runReconciliationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 17: P4-09 Reconciliation Tests (Final P4)');
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
      name: `St. Jude Medical Hub ${Date.now()}`,
      district: 'Central District',
      latitude: 13.0800,
      longitude: 80.2700
    });
    const hospAId = resHospA.body.data.id;

    // 2. Setup Destination Hospital (Hospital B)
    const resHospB = await request('POST', '/api/hospitals', {
      name: `Mercy Community Hospital ${Date.now()}`,
      district: 'East District',
      latitude: 13.0200,
      longitude: 80.2500
    });
    const hospBId = resHospB.body.data.id;

    // 3. Setup Unrelated Hospital (Hospital C)
    const resHospC = await request('POST', '/api/hospitals', {
      name: `Valley General ${Date.now()}`,
      district: 'West District',
      latitude: 13.0500,
      longitude: 80.2100
    });
    const hospCId = resHospC.body.data.id;

    // 4. Create Resource under Hospital A (100 Blood Units)
    const resResource = await request('POST', `/api/hospitals/${hospAId}/resources`, {
      name: 'O-Negative Blood Units',
      category: 'BLOOD',
      quantity: 100,
      availableQty: 100,
      unit: 'units'
    });
    const resourceId = resResource.body.data.id;

    // Helper to create and complete a transfer to RECEIVED state
    async function createCompletedTransfer(qty) {
      // 1. Request
      const resReq = await request('POST', '/api/resources/coordination-requests', {
        resourceId,
        toHospitalId: hospBId,
        quantity: qty,
        notes: 'Blood bank replenishment'
      });
      const tId = resReq.body.data.id;

      // 2. Approve
      await request('PATCH', `/api/resources/coordination-requests/${tId}/status`, {
        status: 'APPROVED',
        actingHospitalId: hospAId
      });

      // 3. Start
      await request('POST', `/api/resource-transfers/${tId}/start`, {
        actingHospitalId: hospAId
      });

      // 4. Deliver
      await request('POST', `/api/resource-transfers/${tId}/deliver`, {
        actingHospitalId: hospAId
      });

      // 5. Receive
      await request('POST', `/api/resource-transfers/${tId}/receive`, {
        actingHospitalId: hospBId
      });

      return tId;
    }

    // ----------------------------------------------------
    // TEST 6 — NON-RECEIVED TRANSFER BLOCKED
    // ----------------------------------------------------
    console.log('▶ TEST 6 — NON-RECEIVED TRANSFER BLOCKED');
    const resUncompletedReq = await request('POST', '/api/resources/coordination-requests', {
      resourceId,
      toHospitalId: hospBId,
      quantity: 5
    });
    const uncompletedTId = resUncompletedReq.body.data.id;

    const resBlockedReconcile = await request('POST', `/api/reconciliation/transfers/${uncompletedTId}`, {
      actingHospitalId: hospAId
    });
    assert(resBlockedReconcile.status === 400, `Non-received transfer reconciliation rejected with 400 (got ${resBlockedReconcile.status})`);

    // ----------------------------------------------------
    // TEST 1, 2, 5 — RECONCILE WITH EXACT QUANTITY MATCH
    // ----------------------------------------------------
    console.log('\n▶ TEST 1 & 2 & 5 — EXACT QUANTITY MATCH (discrepancy = 0)');
    const transfer1Id = await createCompletedTransfer(10);

    const resMatch = await request('POST', `/api/reconciliation/transfers/${transfer1Id}`, {
      actualQuantity: 10,
      actingHospitalId: hospAId,
      notes: 'All 10 units confirmed in good condition'
    });

    assert(resMatch.status === 201, `Returns 201 Created (got ${resMatch.status})`);
    assert(resMatch.body.data.expectedQuantity === 10, 'Expected quantity is 10');
    assert(resMatch.body.data.actualQuantity === 10, 'Actual quantity is 10');
    assert(resMatch.body.data.discrepancyQuantity === 0, 'Discrepancy quantity is 0');
    assert(resMatch.body.data.discrepancyType === 'MATCH', 'Discrepancy type is MATCH');
    assert(resMatch.body.data.status === 'RECONCILED', 'Status is RECONCILED');
    const recMatchId = resMatch.body.data.id;

    // ----------------------------------------------------
    // TEST 3 — SHORTAGE DETECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — SHORTAGE DETECTION (actual < expected)');
    const transfer2Id = await createCompletedTransfer(15);

    const resShortage = await request('POST', `/api/reconciliation/transfers/${transfer2Id}`, {
      actualQuantity: 12, // Shortage of 3
      actingHospitalId: hospBId,
      notes: '3 units compromised during transport'
    });

    assert(resShortage.status === 201, 'Shortage reconciliation created');
    assert(resShortage.body.data.expectedQuantity === 15, 'Expected quantity is 15');
    assert(resShortage.body.data.actualQuantity === 12, 'Actual quantity is 12');
    assert(resShortage.body.data.discrepancyQuantity === -3, 'Discrepancy is -3');
    assert(resShortage.body.data.discrepancyType === 'SHORTAGE', 'Discrepancy type is SHORTAGE');
    assert(resShortage.body.data.status === 'DISCREPANCY', 'Status is DISCREPANCY');
    const recShortageId = resShortage.body.data.id;

    // ----------------------------------------------------
    // TEST 4 — OVERAGE DETECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — OVERAGE DETECTION (actual > expected)');
    const transfer3Id = await createCompletedTransfer(8);

    const resOverage = await request('POST', `/api/reconciliation/transfers/${transfer3Id}`, {
      actualQuantity: 10, // Overage of 2
      actingHospitalId: hospBId
    });

    assert(resOverage.status === 201, 'Overage reconciliation created');
    assert(resOverage.body.data.expectedQuantity === 8, 'Expected quantity is 8');
    assert(resOverage.body.data.actualQuantity === 10, 'Actual quantity is 10');
    assert(resOverage.body.data.discrepancyQuantity === 2, 'Discrepancy is +2');
    assert(resOverage.body.data.discrepancyType === 'OVERAGE', 'Discrepancy type is OVERAGE');
    assert(resOverage.body.data.status === 'DISCREPANCY', 'Status is DISCREPANCY');

    // ----------------------------------------------------
    // TEST 7 — NONEXISTENT TRANSFER
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — NONEXISTENT TRANSFER');
    const resNonTransfer = await request('POST', '/api/reconciliation/transfers/nonexistent-transfer-000');
    assert(resNonTransfer.status === 404, `Nonexistent transfer returns 404 (got ${resNonTransfer.status})`);

    // ----------------------------------------------------
    // TEST 8 — NONEXISTENT RECONCILIATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — NONEXISTENT RECONCILIATION');
    const resNonRec = await request('GET', '/api/reconciliation/nonexistent-rec-id-000');
    assert(resNonRec.status === 404, `Nonexistent reconciliation returns 404 (got ${resNonRec.status})`);

    // ----------------------------------------------------
    // TEST 9, 10, 11 — INVALID QUANTITY FORMAT / NEGATIVE / FRACTIONAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 9, 10, 11 — INVALID ACTUAL QUANTITIES');
    const transfer4Id = await createCompletedTransfer(5);

    const resNegQty = await request('POST', `/api/reconciliation/transfers/${transfer4Id}`, {
      actualQuantity: -2
    });
    assert(resNegQty.status === 400, `Negative quantity rejected with 400 (got ${resNegQty.status})`);

    const resFracQty = await request('POST', `/api/reconciliation/transfers/${transfer4Id}`, {
      actualQuantity: 4.5
    });
    assert(resFracQty.status === 400, `Fractional quantity rejected with 400 (got ${resFracQty.status})`);

    // ----------------------------------------------------
    // TEST 13 — HOSPITAL SCOPING
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — HOSPITAL SCOPING: Unrelated Hospital C accessing reconciliation');
    const resScoping = await request('GET', `/api/reconciliation/${recMatchId}?hospitalId=${hospCId}`);
    assert(resScoping.status === 403, `Unrelated hospital access rejected with 403 Forbidden (got ${resScoping.status})`);

    // ----------------------------------------------------
    // TEST 14 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — AUTHORIZATION: Hospital A and B can access reconciliation');
    const resAuthA = await request('GET', `/api/reconciliation/${recMatchId}?hospitalId=${hospAId}`);
    assert(resAuthA.status === 200, 'Hospital A authorized (200 OK)');
    const resAuthB = await request('GET', `/api/reconciliation/${recMatchId}?hospitalId=${hospBId}`);
    assert(resAuthB.status === 200, 'Hospital B authorized (200 OK)');

    // ----------------------------------------------------
    // TEST 15 — OWNERSHIP PROTECTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — OWNERSHIP PROTECTION');
    const dbRec = await prisma.resourceReconciliation.findUnique({ where: { id: recMatchId } });
    assert(dbRec.sourceHospitalId === hospAId, 'sourceHospitalId immutable (remains Hospital A)');
    assert(dbRec.destinationHospitalId === hospBId, 'destinationHospitalId immutable (remains Hospital B)');

    // ----------------------------------------------------
    // TEST 16 — IDEMPOTENT RECONCILIATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — IDEMPOTENT RECONCILIATION');
    const resIdempotent = await request('POST', `/api/reconciliation/transfers/${transfer1Id}`, {
      actualQuantity: 10
    });
    assert(resIdempotent.status === 200 || resIdempotent.status === 201, 'Idempotent call succeeds');
    assert(resIdempotent.body.data.id === recMatchId, 'Returns existing reconciliation record ID');
    const countRecs = await prisma.resourceReconciliation.count({ where: { transferId: transfer1Id } });
    assert(countRecs === 1, 'Exactly 1 reconciliation record in database for this transfer');

    // ----------------------------------------------------
    // TEST 17 & 18 — VALID DISCREPANCY RESOLUTION
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 & 18 — VALID DISCREPANCY RESOLUTION');
    const resResolve = await request('PATCH', `/api/reconciliation/${recShortageId}/resolve`, {
      reason: 'Damaged packaging in transit; written off by cold chain team',
      notes: 'Incident claim ID: CLM-8831',
      actingHospitalId: hospBId,
      resolvedBy: 'Dr. John Watson (Chief Pharmacist)'
    });
    assert(resResolve.status === 200, `Returns 200 OK (got ${resResolve.status})`);
    assert(resResolve.body.data.status === 'RESOLVED', 'Status is now RESOLVED');
    assert(Boolean(resResolve.body.data.resolvedAt), 'resolvedAt timestamp stamped');
    assert(resResolve.body.data.resolutionReason.includes('Damaged packaging'), 'Resolution reason preserved');

    // ----------------------------------------------------
    // TEST 19 — INVALID RESOLUTION (MISSING REASON)
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — INVALID RESOLUTION (Missing reason)');
    const transfer5Id = await createCompletedTransfer(6);
    const resOverageRec = await request('POST', `/api/reconciliation/transfers/${transfer5Id}`, {
      actualQuantity: 8
    });
    const recOverageId = resOverageRec.body.data.id;

    const resEmptyResolve = await request('PATCH', `/api/reconciliation/${recOverageId}/resolve`, {
      reason: '   '
    });
    assert(resEmptyResolve.status === 400, `Empty resolution reason rejected with 400 (got ${resEmptyResolve.status})`);

    // ----------------------------------------------------
    // TEST 20 — DUPLICATE RESOLUTION REJECTED
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — DUPLICATE RESOLUTION REJECTED');
    const resDupResolve = await request('PATCH', `/api/reconciliation/${recShortageId}/resolve`, {
      reason: 'Attempting second resolution'
    });
    assert(resDupResolve.status === 400, `Duplicate resolution rejected with 400 (got ${resDupResolve.status})`);

    // ----------------------------------------------------
    // TEST 21 — HISTORICAL TRANSFER UNCHANGED
    // ----------------------------------------------------
    console.log('\n▶ TEST 21 — HISTORICAL TRANSFER UNCHANGED');
    const dbTransferAfterRec = await prisma.resourceTransfer.findUnique({ where: { id: transfer2Id } });
    assert(dbTransferAfterRec.quantity === 15, 'Historical transfer quantity strictly unchanged (still 15)');
    assert(dbTransferAfterRec.status === 'RECEIVED', 'Historical transfer status strictly unchanged (RECEIVED)');

    // ----------------------------------------------------
    // TEST 22 — RESOURCE INVENTORY NOT SILENTLY MUTATED
    // ----------------------------------------------------
    console.log('\n▶ TEST 22 — INVENTORY NOT SILENTLY MUTATED BY RECONCILIATION');
    const dbResAfterRec = await prisma.resource.findUnique({ where: { id: resourceId } });
    assert(dbResAfterRec.quantity === 100, 'Resource quantity invariant preserved');
    assert(dbResAfterRec.availableQty >= 0, 'Resource availableQty non-negative');

    // ----------------------------------------------------
    // TEST 23 — SOCKET RECONCILIATION EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 23 — SOCKET EVENT: resource:reconciliation_created');
    const transferSocketId = await createCompletedTransfer(4);

    let receivedRecEvent = null;
    const socketRecPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.transferId === transferSocketId) {
          receivedRecEvent = data;
          socketClient.off('resource:reconciliation_created', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:reconciliation_created', handler);
    });

    const resSocketCreate = await request('POST', `/api/reconciliation/transfers/${transferSocketId}`, {
      actualQuantity: 4
    });
    const socketRecId = resSocketCreate.body.data.id;

    await Promise.race([
      socketRecPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket rec timeout')), 3000))
    ]);

    assert(receivedRecEvent !== null, 'Received resource:reconciliation_created via Socket.IO');
    assert(receivedRecEvent.status === 'RECONCILED', 'Socket event status is RECONCILED');

    // ----------------------------------------------------
    // TEST 24 — SOCKET RESOLUTION EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 24 — SOCKET EVENT: resource:reconciliation_resolved');
    const transferSocket2Id = await createCompletedTransfer(5);
    const resDiscrepancy = await request('POST', `/api/reconciliation/transfers/${transferSocket2Id}`, {
      actualQuantity: 3
    });
    const discRecId = resDiscrepancy.body.data.id;

    let receivedResolveEvent = null;
    const socketResolvePromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.reconciliationId === discRecId) {
          receivedResolveEvent = data;
          socketClient.off('resource:reconciliation_resolved', handler);
          resolve(data);
        }
      };
      socketClient.on('resource:reconciliation_resolved', handler);
    });

    await request('PATCH', `/api/reconciliation/${discRecId}/resolve`, {
      reason: 'Confirmed transit loss accounted for in quarterly inventory writeoff'
    });

    await Promise.race([
      socketResolvePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket resolve timeout')), 3000))
    ]);

    assert(receivedResolveEvent !== null, 'Received resource:reconciliation_resolved via Socket.IO');
    assert(receivedResolveEvent.status === 'RESOLVED', 'Socket event status is RESOLVED');

    // ----------------------------------------------------
    // TEST 25 — NO SOCKET EVENT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 25 — NO SOCKET EVENT ON FAILURE');
    let unwantedEvent = false;
    const unwantedHandler = () => { unwantedEvent = true; };
    socketClient.on('resource:reconciliation_resolved', unwantedHandler);

    await request('PATCH', `/api/reconciliation/${discRecId}/resolve`, {
      reason: 'Duplicate resolve attempt'
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('resource:reconciliation_resolved', unwantedHandler);
    assert(unwantedEvent === false, 'No socket event emitted on failed action');

    // ----------------------------------------------------
    // TEST 26 & 27 — AUDIT & PRIVACY
    // ----------------------------------------------------
    console.log('\n▶ TEST 26 & 27 — AUDIT TRAIL & PRIVACY');
    const dbResolvedRec = await prisma.resourceReconciliation.findUnique({ where: { id: discRecId } });
    assert(Boolean(dbResolvedRec.resolvedAt), 'resolvedAt timestamp present in database');
    assert(Boolean(dbResolvedRec.resolutionReason), 'resolutionReason present in database');
    assert(!resMatch.body.data.passwordHash, 'No sensitive auth credentials leaked');

    console.log('\n========================================================');
    console.log(`📊 RECONCILIATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runReconciliationTests().catch(err => {
  console.error('💥 Reconciliation test error:', err);
  process.exit(1);
});
