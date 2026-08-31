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

async function runAssignmentTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 7: P3-07 Dispatch Assignment Tests');
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
    // SETUP: Create Incident and Responder in PostgreSQL
    // ----------------------------------------------------
    const incident = await prisma.incident.create({
      data: {
        title: 'Highway 45 Multi-Vehicle Pileup',
        description: '3 car collision with trapped passengers and coolant leak',
        incidentType: 'ACCIDENT',
        status: 'REPORTED',
        severity: 'HIGH',
        priorityScore: 75,
        latitude: 13.0400,
        longitude: 80.2200,
        district: 'South Sector',
        victimCount: 3,
        hasInjuries: true,
        hasTrapped: true
      }
    });

    const createRes = await request('POST', '/api/responders', {
      name: 'Paramedic Sarah Jenkins',
      email: `sarah.jenkins.${Date.now()}@resqnet.org`,
      badgeNumber: `PRM-${Date.now().toString().slice(-4)}`,
      responderType: 'PARAMEDIC'
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 15 — ASSIGN VALID RESPONDER
    // ----------------------------------------------------
    console.log('▶ TEST 15 — ASSIGN VALID RESPONDER: POST /api/dispatch');
    const resAssign = await request('POST', '/api/dispatch', {
      incidentId: incident.id,
      responderId: responderId,
      notes: 'Priority 1 dispatch for trauma support'
    });

    assert(resAssign.status === 201, `Returns 201 Created (got ${resAssign.status})`);
    assert(resAssign.body.success === true, 'Response has success: true');
    assert(resAssign.body.data.responder.status === 'DISPATCHED', 'Responder status is DISPATCHED');
    assert(resAssign.body.data.incident.status === 'ASSIGNED', 'Incident status is ASSIGNED');

    // Verify PostgreSQL persistence
    const dbDispatch = await prisma.dispatch.findFirst({
      where: {
        incidentId: incident.id,
        responderId: responderId
      }
    });
    assert(dbDispatch !== null, 'Dispatch record persisted in PostgreSQL');
    assert(dbDispatch.status === 'DISPATCHED', 'Dispatch record status is DISPATCHED');

    const dbResponder = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbResponder.status === 'DISPATCHED', 'ResponderProfile in PostgreSQL has status DISPATCHED');

    // ----------------------------------------------------
    // TEST 16 — ASSIGN NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — ASSIGN NONEXISTENT RESPONDER: 404 for invalid responderId');
    const resNonexistentResp = await request('POST', '/api/dispatch', {
      incidentId: incident.id,
      responderId: 'nonexistent-resp-id-000'
    });
    assert(resNonexistentResp.status === 404, `Returns 404 Not Found (got ${resNonexistentResp.status})`);
    assert(resNonexistentResp.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 17 — ASSIGN NONEXISTENT INCIDENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — ASSIGN NONEXISTENT INCIDENT: 404 for invalid incidentId');
    const resNonexistentInc = await request('POST', '/api/dispatch', {
      incidentId: 'nonexistent-inc-id-000',
      responderId: responderId
    });
    assert(resNonexistentInc.status === 404, `Returns 404 Not Found (got ${resNonexistentInc.status})`);
    assert(resNonexistentInc.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 18 — ASSIGN UNAVAILABLE RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — ASSIGN UNAVAILABLE RESPONDER: Rejection of OFF_DUTY responder');
    // Create an off-duty responder
    const createOffDuty = await request('POST', '/api/responders', {
      name: 'Officer Off Duty',
      email: `offduty.${Date.now()}@resqnet.org`,
      badgeNumber: `OFF-${Date.now().toString().slice(-4)}`,
      responderType: 'POLICE'
    });
    const offDutyId = createOffDuty.body.data.id;
    await request('PATCH', `/api/responders/${offDutyId}/status`, { status: 'OFF_DUTY' });

    const resAssignOffDuty = await request('POST', '/api/dispatch', {
      incidentId: incident.id,
      responderId: offDutyId
    });
    assert(resAssignOffDuty.status === 400, `Returns 400 Bad Request for OFF_DUTY responder (got ${resAssignOffDuty.status})`);
    assert(resAssignOffDuty.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 19 — ASSIGNMENT STATUS EVENT VIA SOCKET.IO
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — ASSIGNMENT STATUS EVENT: responder:status_changed and incident:assigned emitted');
    // Create new fresh incident and responder for clean event reception
    const incident2 = await prisma.incident.create({
      data: {
        title: 'Electrical Substation Fire',
        description: 'Transformer explosion with localized fire',
        incidentType: 'FIRE',
        status: 'REPORTED',
        severity: 'HIGH',
        priorityScore: 80,
        latitude: 13.0600,
        longitude: 80.2400
      }
    });

    const createResp2 = await request('POST', '/api/responders', {
      name: 'Firefighter Ray Stantz',
      email: `ray.${Date.now()}@resqnet.org`,
      badgeNumber: `FF-${Date.now().toString().slice(-4)}`,
      responderType: 'FIREFIGHTER'
    });
    const resp2Id = createResp2.body.data.id;

    let receivedStatusEvent = null;
    let receivedIncidentEvent = null;

    const statusPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.responderId === resp2Id) {
          receivedStatusEvent = data;
          socketClient.off('responder:status_changed', handler);
          resolve(data);
        }
      };
      socketClient.on('responder:status_changed', handler);
    });

    const incidentPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.incident && data.incident.id === incident2.id) {
          receivedIncidentEvent = data;
          socketClient.off('incident:assigned', handler);
          resolve(data);
        }
      };
      socketClient.on('incident:assigned', handler);
    });

    const resDispatch2 = await request('POST', '/api/dispatch', {
      incidentId: incident2.id,
      responderId: resp2Id
    });
    assert(resDispatch2.status === 201, 'Dispatch request succeeded with 201');

    await Promise.race([
      Promise.all([statusPromise, incidentPromise]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Dispatch socket events timeout')), 3000))
    ]);

    assert(receivedStatusEvent !== null, 'Received responder:status_changed event via Socket.IO');
    assert(receivedStatusEvent.status === 'DISPATCHED', 'Socket event status is DISPATCHED');
    assert(receivedIncidentEvent !== null, 'Received incident:assigned event via Socket.IO');

    console.log('\n========================================================');
    console.log(`📊 ASSIGNMENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runAssignmentTests().catch(err => {
  console.error('💥 Assignment test error:', err);
  process.exit(1);
});
