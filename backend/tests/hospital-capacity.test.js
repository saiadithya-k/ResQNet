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

async function runHospitalCapacityTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 10: P4-02 Hospital Capacity, Beds & ICU');
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
    // Register a test hospital for capacity tests
    const uniqueHosp = `Apex Regional Medical Center ${Date.now()}`;
    const resCreate = await request('POST', '/api/hospitals', {
      name: uniqueHosp,
      district: 'Central Metro',
      latitude: 13.0827,
      longitude: 80.2707,
      totalBeds: 100,
      availableBeds: 40,
      totalIcu: 20,
      availableIcu: 5
    });

    assert(resCreate.status === 201, 'Test hospital created successfully');
    const hospId = resCreate.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — GET CAPACITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 1 — GET CAPACITY: GET /api/hospitals/:id/capacity');
    const resGetCap = await request('GET', `/api/hospitals/${hospId}/capacity`);
    assert(resGetCap.status === 200, `Returns 200 OK (got ${resGetCap.status})`);
    assert(resGetCap.body.success === true, 'Response has success: true');
    assert(resGetCap.body.data.totalBeds === 100, 'totalBeds is 100');
    assert(resGetCap.body.data.availableBeds === 40, 'availableBeds is 40');

    // ----------------------------------------------------
    // TEST 2 — UPDATE BED CAPACITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — UPDATE BED CAPACITY: PATCH /api/hospitals/:id/capacity');
    const resUpdateBeds = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalBeds: 200,
      availableBeds: 80
    });
    assert(resUpdateBeds.status === 200, `Returns 200 OK (got ${resUpdateBeds.status})`);
    assert(resUpdateBeds.body.data.totalBeds === 200, 'totalBeds updated to 200');
    assert(resUpdateBeds.body.data.availableBeds === 80, 'availableBeds updated to 80');

    // ----------------------------------------------------
    // TEST 3 — UPDATE ICU CAPACITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — UPDATE ICU CAPACITY: PATCH /api/hospitals/:id/capacity');
    const resUpdateIcu = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalIcu: 30,
      availableIcu: 10
    });
    assert(resUpdateIcu.status === 200, `Returns 200 OK (got ${resUpdateIcu.status})`);
    assert(resUpdateIcu.body.data.totalIcu === 30, 'totalIcu updated to 30');
    assert(resUpdateIcu.body.data.availableIcu === 10, 'availableIcu updated to 10');

    // ----------------------------------------------------
    // TEST 4 — DERIVED OCCUPANCY
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — DERIVED OCCUPANCY: occupiedBeds = totalBeds - availableBeds');
    assert(resUpdateIcu.body.data.occupiedBeds === 120, 'Derived occupiedBeds is 120 (200 - 80)');
    assert(resUpdateIcu.body.data.occupiedIcu === 20, 'Derived occupiedIcu is 20 (30 - 10)');

    // ----------------------------------------------------
    // TEST 5 — BED CONSISTENCY
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — BED CONSISTENCY: availableBeds + occupiedBeds === totalBeds');
    const { totalBeds, availableBeds, occupiedBeds } = resUpdateIcu.body.data;
    assert(availableBeds + occupiedBeds === totalBeds, `Bed consistency verified: ${availableBeds} + ${occupiedBeds} === ${totalBeds}`);

    // ----------------------------------------------------
    // TEST 6 — ICU CONSISTENCY
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — ICU CONSISTENCY: availableIcu + occupiedIcu === totalIcu');
    const { totalIcu, availableIcu, occupiedIcu } = resUpdateIcu.body.data;
    assert(availableIcu + occupiedIcu === totalIcu, `ICU consistency verified: ${availableIcu} + ${occupiedIcu} === ${totalIcu}`);

    // ----------------------------------------------------
    // TEST 7 — NEGATIVE BEDS
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — NEGATIVE BEDS: totalBeds = -1');
    const resNegBeds = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalBeds: -1
    });
    assert(resNegBeds.status === 400, `Negative beds rejected with 400 (got ${resNegBeds.status})`);

    // ----------------------------------------------------
    // TEST 8 — AVAILABLE > TOTAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — AVAILABLE > TOTAL: totalBeds = 100, availableBeds = 101');
    const resAvailGtTotal = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalBeds: 100,
      availableBeds: 101
    });
    assert(resAvailGtTotal.status === 400, `Available > Total rejected with 400 (got ${resAvailGtTotal.status})`);

    // ----------------------------------------------------
    // TEST 9 — OCCUPIED > TOTAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — OCCUPIED > TOTAL: Derived occupancy correctly prevents impossible states');
    assert(occupiedBeds <= totalBeds, 'Occupied beds cannot exceed total beds');

    // ----------------------------------------------------
    // TEST 10 — ICU > TOTAL BEDS
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — ICU > TOTAL BEDS: totalBeds = 20, totalIcu = 21');
    const resIcuGtBeds = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalBeds: 20,
      totalIcu: 21
    });
    assert(resIcuGtBeds.status === 400, `ICU > Total beds rejected with 400 (got ${resIcuGtBeds.status})`);

    // ----------------------------------------------------
    // TEST 11 — AVAILABLE ICU > TOTAL ICU
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — AVAILABLE ICU > TOTAL ICU: totalIcu = 10, availableIcu = 11');
    const resAvailIcuGtTotal = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalIcu: 10,
      availableIcu: 11
    });
    assert(resAvailIcuGtTotal.status === 400, `Available ICU > Total ICU rejected with 400 (got ${resAvailIcuGtTotal.status})`);

    // ----------------------------------------------------
    // TEST 12 — FRACTIONAL CAPACITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — FRACTIONAL CAPACITY: availableBeds = 10.5');
    const resFractional = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      availableBeds: 10.5
    });
    assert(resFractional.status === 400, `Fractional capacity rejected with 400 (got ${resFractional.status})`);

    // ----------------------------------------------------
    // TEST 13 — NONEXISTENT HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — NONEXISTENT HOSPITAL');
    const resNonexistentGet = await request('GET', '/api/hospitals/nonexistent-hosp-id-000/capacity');
    assert(resNonexistentGet.status === 404, `GET nonexistent hospital returns 404 (got ${resNonexistentGet.status})`);

    const resNonexistentPatch = await request('PATCH', '/api/hospitals/nonexistent-hosp-id-000/capacity', {
      availableBeds: 10
    });
    assert(resNonexistentPatch.status === 404, `PATCH nonexistent hospital returns 404 (got ${resNonexistentPatch.status})`);

    // ----------------------------------------------------
    // TEST 14 — EMPTY BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — EMPTY BODY: PATCH with empty object');
    const resEmptyBody = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {});
    assert(resEmptyBody.status === 400, `Empty body rejected with 400 (got ${resEmptyBody.status})`);

    // ----------------------------------------------------
    // TEST 15 — INVALID BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — INVALID BODY: Malformed string beds');
    const resInvalidBody = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      totalBeds: 'not-a-number'
    });
    assert(resInvalidBody.status === 400, `Malformed body rejected with 400 (got ${resInvalidBody.status})`);

    // ----------------------------------------------------
    // TEST 16 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — DATABASE PERSISTENCE: Verify in PostgreSQL via Prisma');
    const dbProfile = await prisma.hospitalProfile.findUnique({ where: { id: hospId } });
    assert(dbProfile.totalBeds === 200, 'totalBeds persisted in PostgreSQL as 200');
    assert(dbProfile.availableBeds === 80, 'availableBeds persisted in PostgreSQL as 80');
    assert(dbProfile.totalIcu === 30, 'totalIcu persisted in PostgreSQL as 30');
    assert(dbProfile.availableIcu === 10, 'availableIcu persisted in PostgreSQL as 10');

    // ----------------------------------------------------
    // TEST 17 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — AUTHORIZATION: Profile user role check');
    const dbUser = await prisma.user.findUnique({ where: { id: dbProfile.userId } });
    assert(dbUser.role === 'HOSPITAL', 'Hospital user role is HOSPITAL');

    // ----------------------------------------------------
    // TEST 18 — SOCKET EVENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — SOCKET EVENT: hospital:capacity_updated');
    let receivedSocketEvent = null;
    const socketPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.hospitalId === hospId) {
          receivedSocketEvent = data;
          socketClient.off('hospital:capacity_updated', handler);
          resolve(data);
        }
      };
      socketClient.on('hospital:capacity_updated', handler);
    });

    const resSocketUpdate = await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      availableBeds: 75
    });
    assert(resSocketUpdate.status === 200, 'Capacity update succeeded with 200');

    await Promise.race([
      socketPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Hospital capacity socket event timeout')), 3000))
    ]);

    assert(receivedSocketEvent !== null, 'Received hospital:capacity_updated event');
    assert(receivedSocketEvent.capacity.availableBeds === 75, 'Socket payload contains updated availableBeds (75)');

    // ----------------------------------------------------
    // TEST 19 — NO EVENT ON VALIDATION FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — NO EVENT ON VALIDATION FAILURE');
    let unwantedEvent1 = false;
    const handler1 = () => { unwantedEvent1 = true; };
    socketClient.on('hospital:capacity_updated', handler1);

    await request('PATCH', `/api/hospitals/${hospId}/capacity`, {
      availableBeds: -10
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:capacity_updated', handler1);
    assert(unwantedEvent1 === false, 'No event emitted on validation failure');

    // ----------------------------------------------------
    // TEST 20 — NO EVENT ON DATABASE FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — NO EVENT ON DATABASE FAILURE');
    let unwantedEvent2 = false;
    const handler2 = () => { unwantedEvent2 = true; };
    socketClient.on('hospital:capacity_updated', handler2);

    await request('PATCH', '/api/hospitals/nonexistent-failed-hosp-id/capacity', {
      availableBeds: 50
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('hospital:capacity_updated', handler2);
    assert(unwantedEvent2 === false, 'No event emitted on database failure / 404');

    console.log('\n========================================================');
    console.log(`📊 CAPACITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runHospitalCapacityTests().catch(err => {
  console.error('💥 Hospital capacity test error:', err);
  process.exit(1);
});
