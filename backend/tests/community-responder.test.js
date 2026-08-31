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

async function runCommunityTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 8: P3-08 Community Responder Mesh Tests');
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
    // SECTION 1: REGISTRATION & PROFILE (Tests 1 - 5)
    // ----------------------------------------------------
    console.log('▶ TEST 1 — CREATE COMMUNITY RESPONDER: POST /api/community-responders');
    const uniqueEmail1 = `community.volunteer.${Date.now()}@resqnet.org`;
    const resReg = await request('POST', '/api/community-responders', {
      name: 'Maya Lin',
      email: uniqueEmail1,
      skills: ['CPR', 'First Aid'],
      latitude: 13.0827,
      longitude: 80.2707
    });

    assert(resReg.status === 201, `Returns 201 Created (got ${resReg.status})`);
    assert(resReg.body.success === true, 'Response has success: true');
    assert(resReg.body.data.isCommunity === true, 'Profile isCommunity is true');
    assert(resReg.body.data.responderType === 'COMMUNITY_FIRST_RESPONDER', 'responderType is COMMUNITY_FIRST_RESPONDER');
    const commId1 = resReg.body.data.id;
    const userId1 = resReg.body.data.userId;

    console.log('\n▶ TEST 2 — DUPLICATE PROFILE: Attempt to register second profile for same user');
    const resDup = await request('POST', '/api/community-responders', {
      userId: userId1
    });
    assert(resDup.status === 409, `Duplicate profile rejected with 409 Conflict (got ${resDup.status})`);
    assert(resDup.body.success === false, 'Response has success: false');

    console.log('\n▶ TEST 3 — INVALID USER: Nonexistent userId');
    const resInvalidUser = await request('POST', '/api/community-responders', {
      userId: 'nonexistent-user-id-000'
    });
    assert(resInvalidUser.status === 400, `Returns 400 Bad Request (got ${resInvalidUser.status})`);

    console.log('\n▶ TEST 4 — UNAUTHORIZED ROLE ESCALATION: Attempting role ADMIN');
    const resEscalation = await request('POST', '/api/community-responders', {
      email: `escalation.${Date.now()}@resqnet.org`,
      role: 'ADMIN'
    });
    assert(resEscalation.status === 403, `Role escalation rejected with 403 Forbidden (got ${resEscalation.status})`);

    console.log('\n▶ TEST 5 — PROFILE RETRIEVAL: GET /api/community-responders/:id');
    const resGetProfile = await request('GET', `/api/community-responders/${commId1}`);
    assert(resGetProfile.status === 200, `Returns 200 OK (got ${resGetProfile.status})`);
    assert(resGetProfile.body.data.id === commId1, 'Profile ID matches');
    assert(resGetProfile.body.data.user.passwordHash === undefined, 'passwordHash is not exposed');

    // ----------------------------------------------------
    // SECTION 2: AVAILABILITY (Tests 6 - 9)
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — SET AVAILABLE: PATCH /api/community-responders/:id/availability');
    const resAvail = await request('PATCH', `/api/community-responders/${commId1}/availability`, {
      isAvailable: true
    });
    assert(resAvail.status === 200, 'Returns 200 OK');
    assert(resAvail.body.data.status === 'AVAILABLE', 'Status is AVAILABLE');

    console.log('\n▶ TEST 7 — SET UNAVAILABLE');
    const resUnavail = await request('PATCH', `/api/community-responders/${commId1}/availability`, {
      isAvailable: false
    });
    assert(resUnavail.status === 200, 'Returns 200 OK');
    assert(resUnavail.body.data.status === 'UNAVAILABLE', 'Status is UNAVAILABLE');

    console.log('\n▶ TEST 8 — INVALID AVAILABILITY: Non-boolean value');
    const resInvalidAvail = await request('PATCH', `/api/community-responders/${commId1}/availability`, {
      isAvailable: 'not-a-boolean'
    });
    assert(resInvalidAvail.status === 400, `Returns 400 Bad Request (got ${resInvalidAvail.status})`);

    console.log('\n▶ TEST 9 — UNAVAILABLE RESPONDER CANNOT ACCEPT TASK');
    // Create an emergency incident
    const incTest9 = await prisma.incident.create({
      data: {
        title: 'Neighborhood Minor Fall Injury',
        description: 'Elderly resident slipped on pavement',
        incidentType: 'MEDICAL',
        status: 'REPORTED',
        latitude: 13.0830,
        longitude: 80.2710
      }
    });
    const resAcceptUnavail = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: incTest9.id
    });
    assert(resAcceptUnavail.status === 400, `Unavailable responder acceptance rejected with 400 (got ${resAcceptUnavail.status})`);

    // Reset commId1 to AVAILABLE for subsequent tests
    await request('PATCH', `/api/community-responders/${commId1}/availability`, { isAvailable: true });

    // ----------------------------------------------------
    // SECTION 3: LOCATION (Tests 10 - 16)
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — VALID LOCATION: PATCH /api/community-responders/:id/location');
    const resLoc = await request('PATCH', `/api/community-responders/${commId1}/location`, {
      latitude: 13.0827,
      longitude: 80.2707
    });
    assert(resLoc.status === 200, 'Location update returns 200 OK');
    assert(resLoc.body.data.latitude === 13.0827, 'Latitude correctly updated');

    console.log('\n▶ TEST 11 — INVALID LATITUDE: Out of range (95)');
    const resInvLat = await request('PATCH', `/api/community-responders/${commId1}/location`, {
      latitude: 95.0,
      longitude: 80.0
    });
    assert(resInvLat.status === 400, `Returns 400 Bad Request (got ${resInvLat.status})`);

    console.log('\n▶ TEST 12 — INVALID LONGITUDE: Out of range (190)');
    const resInvLon = await request('PATCH', `/api/community-responders/${commId1}/location`, {
      latitude: 13.0,
      longitude: 190.0
    });
    assert(resInvLon.status === 400, `Returns 400 Bad Request (got ${resInvLon.status})`);

    console.log('\n▶ TEST 13 — BOUNDARY COORDINATES: Latitude 90, Longitude -180');
    const resBoundary = await request('PATCH', `/api/community-responders/${commId1}/location`, {
      latitude: 90.0,
      longitude: -180.0
    });
    assert(resBoundary.status === 200, 'Boundary coordinates accepted with 200 OK');

    // Reset position to Chennai center
    await request('PATCH', `/api/community-responders/${commId1}/location`, { latitude: 13.0827, longitude: 80.2707 });

    console.log('\n▶ TEST 14 — NONEXISTENT RESPONDER LOCATION');
    const resNonexistentLoc = await request('PATCH', '/api/community-responders/nonexistent-id-000/location', {
      latitude: 13.0,
      longitude: 80.0
    });
    assert(resNonexistentLoc.status === 404, `Returns 404 Not Found (got ${resNonexistentLoc.status})`);

    console.log('\n▶ TEST 15 — LOCATION PERSISTENCE: Verify in PostgreSQL');
    const dbProfile = await prisma.responderProfile.findUnique({ where: { id: commId1 } });
    assert(dbProfile.latitude === 13.0827 && dbProfile.longitude === 80.2707, 'Coordinates persisted in PostgreSQL');

    console.log('\n▶ TEST 16 — TIMESTAMP UPDATE: Verify lastLocationTime');
    assert(dbProfile.lastLocationTime !== null, 'lastLocationTime is updated and non-null');

    // ----------------------------------------------------
    // SECTION 4: NEARBY TASK DISCOVERY (Tests 17 - 21)
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — NEARBY ELIGIBLE TASK: Incident within 2 km');
    const incNear = await prisma.incident.create({
      data: {
        title: 'Elderly Resident Assistance Needed',
        description: 'Waterlogging in doorway, assistance requested',
        incidentType: 'MEDICAL',
        status: 'REPORTED',
        latitude: 13.0850,
        longitude: 80.2720
      }
    });

    const resNearby = await request('GET', `/api/community-responders/${commId1}/nearby?radiusKm=5`);
    assert(resNearby.status === 200, 'Nearby discovery returns 200 OK');
    const foundNear = resNearby.body.data.find(t => t.taskId === incNear.id);
    assert(Boolean(foundNear), 'Nearby incident is present in feed');
    assert(foundNear.distanceKm < 5, `Distance is within radius (${foundNear.distanceKm} km)`);

    console.log('\n▶ TEST 18 — FAR TASK EXCLUDED: Incident 50 km away');
    const incFar = await prisma.incident.create({
      data: {
        title: 'Distant Township Assistance',
        description: 'Far location task',
        incidentType: 'MEDICAL',
        status: 'REPORTED',
        latitude: 13.5000,
        longitude: 80.7000
      }
    });
    const resFarCheck = await request('GET', `/api/community-responders/${commId1}/nearby?radiusKm=5`);
    const foundFar = resFarCheck.body.data.find(t => t.taskId === incFar.id);
    assert(!foundFar, 'Far task (>5km) is excluded from feed');

    console.log('\n▶ TEST 19 — UNAVAILABLE RESPONDER EXCLUDED: Returns empty list');
    await request('PATCH', `/api/community-responders/${commId1}/availability`, { isAvailable: false });
    const resUnavailFeed = await request('GET', `/api/community-responders/${commId1}/nearby?radiusKm=5`);
    assert(resUnavailFeed.body.data.length === 0, 'Unavailable responder receives 0 tasks');
    await request('PATCH', `/api/community-responders/${commId1}/availability`, { isAvailable: true });

    console.log('\n▶ TEST 20 — SAFETY FILTER: Toxic HAZMAT incident excluded');
    const incHazmat = await prisma.incident.create({
      data: {
        title: 'Chlorine Gas Cylinder Rupture',
        description: 'Toxic gas leak in industrial depot',
        incidentType: 'HAZMAT',
        hasHazmat: true,
        status: 'REPORTED',
        latitude: 13.0830,
        longitude: 80.2710
      }
    });
    const resHazmatCheck = await request('GET', `/api/community-responders/${commId1}/nearby?radiusKm=5`);
    const foundHazmat = resHazmatCheck.body.data.find(t => t.taskId === incHazmat.id);
    assert(!foundHazmat, 'Hazardous toxic incident is excluded from community volunteers');

    console.log('\n▶ TEST 21 — PROXIMITY ORDERING: Results sorted ascending by distance');
    const feed = resHazmatCheck.body.data;
    let isProximitySorted = true;
    for (let i = 0; i < feed.length - 1; i++) {
      if (feed[i].distanceKm > feed[i + 1].distanceKm) {
        isProximitySorted = false;
        break;
      }
    }
    assert(isProximitySorted, 'Nearby tasks feed is ordered by proximity ascending');

    // ----------------------------------------------------
    // SECTION 5: TASK ACCEPTANCE (Tests 22 - 29)
    // ----------------------------------------------------
    console.log('\n▶ TEST 22 — VALID ACCEPTANCE: POST /api/community-responders/:id/accept');
    const resAccept = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: incNear.id
    });
    assert(resAccept.status === 201, `Returns 201 Created (got ${resAccept.status})`);
    assert(resAccept.body.success === true, 'Response has success: true');
    assert(resAccept.body.data.dispatch.status === 'DISPATCHED', 'Dispatch status is DISPATCHED');
    const activeTaskId = resAccept.body.data.dispatch.id;

    console.log('\n▶ TEST 23 — NONEXISTENT TASK');
    const resAcceptNonexistent = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: 'nonexistent-task-id-000'
    });
    assert(resAcceptNonexistent.status === 404, `Returns 404 Not Found (got ${resAcceptNonexistent.status})`);

    console.log('\n▶ TEST 24 — NONEXISTENT RESPONDER');
    const resAcceptNonexistentResp = await request('POST', '/api/community-responders/nonexistent-resp-000/accept', {
      incidentId: incFar.id
    });
    assert(resAcceptNonexistentResp.status === 404, `Returns 404 Not Found (got ${resAcceptNonexistentResp.status})`);

    console.log('\n▶ TEST 25 — UNAVAILABLE RESPONDER CANNOT ACCEPT');
    // Create another community responder who is unavailable
    const resComm2 = await request('POST', '/api/community-responders', {
      email: `comm2.${Date.now()}@resqnet.org`,
      name: 'Bob Volunteer'
    });
    const commId2 = resComm2.body.data.id;
    await request('PATCH', `/api/community-responders/${commId2}/availability`, { isAvailable: false });
    const resAcceptUnavail2 = await request('POST', `/api/community-responders/${commId2}/accept`, {
      incidentId: incFar.id
    });
    assert(resAcceptUnavail2.status === 400, `Unavailable responder rejected with 400 (got ${resAcceptUnavail2.status})`);

    console.log('\n▶ TEST 26 — INELIGIBLE HAZMAT TASK REJECTED');
    await request('PATCH', `/api/community-responders/${commId2}/availability`, { isAvailable: true });
    const resAcceptHazmat = await request('POST', `/api/community-responders/${commId2}/accept`, {
      incidentId: incHazmat.id
    });
    assert(resAcceptHazmat.status === 400, `Accepting hazardous incident rejected with 400 (got ${resAcceptHazmat.status})`);

    console.log('\n▶ TEST 27 — ALREADY ACCEPTED TASK: Exclusive task rejected with 409 Conflict');
    const resAcceptAlready = await request('POST', `/api/community-responders/${commId2}/accept`, {
      incidentId: incNear.id
    });
    assert(resAcceptAlready.status === 409, `Conflict 409 for already accepted task (got ${resAcceptAlready.status})`);

    console.log('\n▶ TEST 28 — DUPLICATE ACCEPTANCE BY SAME RESPONDER');
    const resDupAccept = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: incFar.id
    });
    assert(resDupAccept.status === 400, `Busy responder cannot accept second task (got ${resDupAccept.status})`);

    console.log('\n▶ TEST 29 — ASSIGNMENT PERSISTENCE: Verify Dispatch in PostgreSQL');
    const dbDispatch = await prisma.dispatch.findUnique({ where: { id: activeTaskId } });
    assert(dbDispatch !== null, 'Dispatch record exists in PostgreSQL');
    assert(dbDispatch.responderId === commId1, 'Dispatch responderId matches commId1');

    // ----------------------------------------------------
    // SECTION 6: CONCURRENCY TEST (Test 30)
    // ----------------------------------------------------
    console.log('\n▶ TEST 30 — CONCURRENT ACCEPTANCE: Two responders race for same task');
    // Create new incident and two fresh available responders
    const incRace = await prisma.incident.create({
      data: {
        title: 'Civic Center Water Distribution Aid',
        description: 'Volunteer support needed for distribution',
        incidentType: 'MEDICAL',
        status: 'REPORTED',
        latitude: 13.0827,
        longitude: 80.2707
      }
    });

    const resRacerA = await request('POST', '/api/community-responders', {
      email: `racer.a.${Date.now()}@resqnet.org`,
      name: 'Racer A'
    });
    const racerAId = resRacerA.body.data.id;

    const resRacerB = await request('POST', '/api/community-responders', {
      email: `racer.b.${Date.now()}@resqnet.org`,
      name: 'Racer B'
    });
    const racerBId = resRacerB.body.data.id;

    // Simultaneous acceptance attempts
    const [raceResA, raceResB] = await Promise.all([
      request('POST', `/api/community-responders/${racerAId}/accept`, { incidentId: incRace.id }),
      request('POST', `/api/community-responders/${racerBId}/accept`, { incidentId: incRace.id })
    ]);

    const statuses = [raceResA.status, raceResB.status].sort();
    assert(statuses[0] === 201 && statuses[1] === 409, `Exactly one 201 Created and one 409 Conflict (got ${statuses.join(', ')})`);

    const dispatchesForRace = await prisma.dispatch.findMany({
      where: { incidentId: incRace.id }
    });
    assert(dispatchesForRace.length === 1, 'Exactly one Dispatch record exists in PostgreSQL for the race incident');

    // ----------------------------------------------------
    // SECTION 7: STATUS LIFECYCLE (Tests 31 - 36)
    // ----------------------------------------------------
    console.log('\n▶ TEST 31 — ACCEPTED → EN_ROUTE: PATCH /api/community-responders/:id/tasks/:taskId/status');
    const resEnRoute = await request('PATCH', `/api/community-responders/${commId1}/tasks/${activeTaskId}/status`, {
      status: 'EN_ROUTE'
    });
    assert(resEnRoute.status === 200, `Returns 200 OK (got ${resEnRoute.status})`);
    assert(resEnRoute.body.data.dispatch.status === 'EN_ROUTE', 'Dispatch status updated to EN_ROUTE');

    console.log('\n▶ TEST 32 — EN_ROUTE → ON_SCENE');
    const resOnScene = await request('PATCH', `/api/community-responders/${commId1}/tasks/${activeTaskId}/status`, {
      status: 'ON_SCENE'
    });
    assert(resOnScene.status === 200, `Returns 200 OK (got ${resOnScene.status})`);
    assert(resOnScene.body.data.dispatch.status === 'ON_SCENE', 'Dispatch status updated to ON_SCENE');

    console.log('\n▶ TEST 33 — ON_SCENE → COMPLETED');
    const resCompleted = await request('PATCH', `/api/community-responders/${commId1}/tasks/${activeTaskId}/status`, {
      status: 'COMPLETED'
    });
    assert(resCompleted.status === 200, `Returns 200 OK (got ${resCompleted.status})`);
    assert(resCompleted.body.data.dispatch.status === 'COMPLETED', 'Dispatch status is COMPLETED');
    assert(resCompleted.body.data.responder.status === 'AVAILABLE', 'Responder reset to AVAILABLE upon task completion');

    console.log('\n▶ TEST 34 — INVALID TRANSITION: Rejects COMPLETED → EN_ROUTE');
    const resInvTrans = await request('PATCH', `/api/community-responders/${commId1}/tasks/${activeTaskId}/status`, {
      status: 'EN_ROUTE'
    });
    assert(resInvTrans.status === 400, `Returns 400 Bad Request (got ${resInvTrans.status})`);

    console.log('\n▶ TEST 35 — UNAUTHORIZED TASK UPDATE: Responder 2 modifying Responder 1 task');
    const resUnauth = await request('PATCH', `/api/community-responders/${commId2}/tasks/${activeTaskId}/status`, {
      status: 'ON_SCENE'
    });
    assert(resUnauth.status === 403, `Returns 403 Forbidden (got ${resUnauth.status})`);

    console.log('\n▶ TEST 36 — COMPLETED TASK PROTECTION');
    const resCompletedMod = await request('PATCH', `/api/community-responders/${commId1}/tasks/${activeTaskId}/status`, {
      status: 'ON_SCENE'
    });
    assert(resCompletedMod.status === 400, `Returns 400 Bad Request on completed task (got ${resCompletedMod.status})`);

    // ----------------------------------------------------
    // SECTION 8: SOCKET.IO EVENTS (Tests 37 - 39)
    // ----------------------------------------------------
    console.log('\n▶ TEST 37 — SOCKET ASSIGNMENT EVENT: community:assignment_created');
    const incSocket = await prisma.incident.create({
      data: {
        title: 'Community First Aid Support at Shelter',
        description: 'First aid volunteer needed',
        incidentType: 'MEDICAL',
        status: 'REPORTED',
        latitude: 13.0827,
        longitude: 80.2707
      }
    });

    let receivedAssignEvent = null;
    const assignPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.incidentId === incSocket.id) {
          receivedAssignEvent = data;
          socketClient.off('community:assignment_created', handler);
          resolve(data);
        }
      };
      socketClient.on('community:assignment_created', handler);
    });

    const resSocketAccept = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: incSocket.id
    });
    assert(resSocketAccept.status === 201, 'Acceptance request succeeded with 201');
    const socketTaskId = resSocketAccept.body.data.dispatch.id;

    await Promise.race([
      assignPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Community assignment event timeout')), 3000))
    ]);

    assert(receivedAssignEvent !== null, 'Received community:assignment_created via Socket.IO');
    assert(receivedAssignEvent.responderId === commId1, 'Event responderId matches');

    console.log('\n▶ TEST 38 — SOCKET STATUS EVENT: community:assignment_updated');
    let receivedStatusEvent = null;
    const statusPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.dispatchId === socketTaskId) {
          receivedStatusEvent = data;
          socketClient.off('community:assignment_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('community:assignment_updated', handler);
    });

    await request('PATCH', `/api/community-responders/${commId1}/tasks/${socketTaskId}/status`, {
      status: 'EN_ROUTE'
    });

    await Promise.race([
      statusPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Community status event timeout')), 3000))
    ]);

    assert(receivedStatusEvent !== null, 'Received community:assignment_updated via Socket.IO');
    assert(receivedStatusEvent.status === 'EN_ROUTE', 'Event status is EN_ROUTE');

    console.log('\n▶ TEST 39 — NO EVENT ON FAILED OPERATION');
    let unwantedEventReceived = false;
    const unwantedHandler = () => { unwantedEventReceived = true; };
    socketClient.on('community:assignment_created', unwantedHandler);

    const resFailAccept = await request('POST', `/api/community-responders/${commId1}/accept`, {
      incidentId: 'nonexistent-failed-inc-id'
    });
    assert(resFailAccept.status === 404, 'Failed acceptance returned 404');

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('community:assignment_created', unwantedHandler);
    assert(unwantedEventReceived === false, 'No event was emitted on failed operation');

    console.log('\n========================================================');
    console.log(`📊 COMMUNITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runCommunityTests().catch(err => {
  console.error('💥 Community test error:', err);
  process.exit(1);
});
