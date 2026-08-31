const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('../src/app');
const prisma = require('../src/config/database');

let server;
let baseUrl;

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

async function runEquipmentTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 5: P3-05 Responder Equipment Tests');
  console.log('🧪 ========================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Test server running on ${baseUrl}\n`);
      resolve();
    });
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
    // SETUP: Create a test responder with initial equipment
    // ----------------------------------------------------
    const uniqueEmail = `equipment.tester.${Date.now()}@resqnet.org`;
    const uniqueBadge = `EQP-${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/responders', {
      name: 'Lieutenant Ripley',
      email: uniqueEmail,
      badgeNumber: uniqueBadge,
      responderType: 'FIREFIGHTER',
      equipment: ['First Aid Pouch']
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — GET EQUIPMENT
    // ----------------------------------------------------
    console.log('▶ TEST 1 — GET EQUIPMENT: GET /api/responders/:id/equipment');
    const resGetEq = await request('GET', `/api/responders/${responderId}/equipment`);
    assert(resGetEq.status === 200, `Returns 200 OK (got ${resGetEq.status})`);
    assert(resGetEq.body.success === true, 'Response has success: true');
    assert(Array.isArray(resGetEq.body.data), 'data is an array');
    assert(resGetEq.body.data.includes('First Aid Pouch'), 'Contains initial equipment');

    // ----------------------------------------------------
    // TEST 2 — ADD EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — ADD EQUIPMENT: POST /api/responders/:id/equipment (Trauma Kit)');
    const resAddEq = await request('POST', `/api/responders/${responderId}/equipment`, {
      equipment: 'Trauma Kit'
    });
    assert(resAddEq.status === 201 || resAddEq.status === 200, `Returns 201/200 (got ${resAddEq.status})`);
    assert(resAddEq.body.data.includes('Trauma Kit'), 'Contains Trauma Kit');
    assert(resAddEq.body.data.includes('First Aid Pouch'), 'Existing equipment retained');

    // ----------------------------------------------------
    // TEST 3 — ADD SECOND EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — ADD SECOND EQUIPMENT: POST /api/responders/:id/equipment (Oxygen Cylinder)');
    const resAddSecond = await request('POST', `/api/responders/${responderId}/equipment`, {
      item: 'Oxygen Cylinder'
    });
    assert(resAddSecond.status === 201 || resAddSecond.status === 200, `Returns 201/200 (got ${resAddSecond.status})`);
    assert(resAddSecond.body.data.includes('Oxygen Cylinder'), 'Contains Oxygen Cylinder');
    assert(resAddSecond.body.data.includes('Trauma Kit'), 'Contains Trauma Kit');
    assert(resAddSecond.body.data.includes('First Aid Pouch'), 'Contains First Aid Pouch');

    // ----------------------------------------------------
    // TEST 4 — DUPLICATE EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — DUPLICATE EQUIPMENT: Attempt to add Trauma Kit again');
    const resDup = await request('POST', `/api/responders/${responderId}/equipment`, {
      equipment: 'trauma kit'
    });
    assert(resDup.status === 409 || resDup.status === 400, `Duplicate rejected with 409/400 (got ${resDup.status})`);
    assert(resDup.body.success === false, 'Response has success: false');

    const dbEqAfterDup = await prisma.responderProfile.findUnique({ where: { id: responderId } });
    const occurrences = dbEqAfterDup.equipment.filter(e => e.toLowerCase() === 'trauma kit');
    assert(occurrences.length === 1, 'No duplicate entry in database');

    // ----------------------------------------------------
    // TEST 5 — UPDATE EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — UPDATE EQUIPMENT: PATCH /api/responders/:id/equipment');
    const resUpdate = await request('PATCH', `/api/responders/${responderId}/equipment`, {
      equipment: ['Trauma Kit', 'Oxygen Tank', 'Defibrillator', 'Rescue Harness']
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.length === 4, 'Returns 4 equipment items');
    assert(resUpdate.body.data.includes('Trauma Kit'), 'Contains Trauma Kit');
    assert(resUpdate.body.data.includes('Oxygen Tank'), 'Contains Oxygen Tank');
    assert(resUpdate.body.data.includes('Defibrillator'), 'Contains Defibrillator');
    assert(resUpdate.body.data.includes('Rescue Harness'), 'Contains Rescue Harness');

    // ----------------------------------------------------
    // TEST 6 — REMOVE EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — REMOVE EQUIPMENT: DELETE /api/responders/:id/equipment/:equipment (Rescue Harness)');
    const resRemove = await request('DELETE', `/api/responders/${responderId}/equipment/Rescue%20Harness`);
    assert(resRemove.status === 200, `Returns 200 OK (got ${resRemove.status})`);
    assert(!resRemove.body.data.includes('Rescue Harness'), 'Rescue Harness removed');
    assert(resRemove.body.data.includes('Trauma Kit'), 'Trauma Kit remains');
    assert(resRemove.body.data.includes('Defibrillator'), 'Defibrillator remains');

    // ----------------------------------------------------
    // TEST 7 — EMPTY EQUIPMENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — EMPTY EQUIPMENT: POST /api/responders/:id/equipment with ""');
    const resEmpty = await request('POST', `/api/responders/${responderId}/equipment`, {
      equipment: '   '
    });
    assert(resEmpty.status === 400, `Returns 400 Bad Request (got ${resEmpty.status})`);
    assert(resEmpty.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 8 — INVALID BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — INVALID BODY: PATCH with non-string array elements');
    const resInvalidBody = await request('PATCH', `/api/responders/${responderId}/equipment`, {
      equipment: ['Valid Item', 12345]
    });
    assert(resInvalidBody.status === 400, `Returns 400 Bad Request for malformed body (got ${resInvalidBody.status})`);
    assert(resInvalidBody.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 9 — NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — NONEXISTENT RESPONDER: GET /api/responders/nonexistent-id/equipment');
    const resNonExistent = await request('GET', '/api/responders/nonexistent-uuid-9999/equipment');
    assert(resNonExistent.status === 404, `Returns 404 Not Found (got ${resNonExistent.status})`);
    assert(resNonExistent.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 10 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbProfile = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbProfile !== null, 'Responder found in PostgreSQL');
    assert(dbProfile.equipment.length === 3, 'Database contains exactly 3 equipment items');
    assert(dbProfile.equipment.includes('Trauma Kit'), 'DB has Trauma Kit');
    assert(dbProfile.equipment.includes('Oxygen Tank'), 'DB has Oxygen Tank');
    assert(dbProfile.equipment.includes('Defibrillator'), 'DB has Defibrillator');
    assert(!dbProfile.equipment.includes('Rescue Harness'), 'DB does not have removed item');

    console.log('\n========================================================');
    console.log(`📊 EQUIPMENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEquipmentTests().catch(err => {
  console.error('💥 Equipment test error:', err);
  process.exit(1);
});
