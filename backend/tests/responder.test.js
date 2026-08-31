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

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 ResQNet Phase 1: P3-01 Professional Responder Tests');
  console.log('🧪 ====================================================\n');

  // Start test server on random free port
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
    // TEST 1 — LIST (Initial)
    console.log('▶ TEST 1 — LIST: GET /api/responders');
    const resList1 = await request('GET', '/api/responders');
    assert(resList1.status === 200, `Returns 200 OK (got ${resList1.status})`);
    assert(resList1.body.success === true, 'Response has success: true');
    assert(Array.isArray(resList1.body.data), 'Response data is an array');

    // TEST 2 — CREATE
    console.log('\n▶ TEST 2 — CREATE: POST /api/responders');
    const uniqueBadge = `BADGE-${Date.now().toString().slice(-4)}`;
    const uniqueEmail = `medic.${Date.now()}@resqnet.org`;
    const createPayload = {
      name: 'Captain Marcus Vance',
      email: uniqueEmail,
      phone: '+1-555-0199',
      badgeNumber: uniqueBadge,
      responderType: 'PARAMEDIC',
      skills: ['Advanced Cardiac Life Support', 'Trauma Triage', 'Airway Management'],
      equipment: ['Defibrillator', 'ALS Medication Kit', 'Oxygen Tank'],
      status: 'AVAILABLE'
    };

    const resCreate = await request('POST', '/api/responders', createPayload);
    assert(resCreate.status === 201, `Returns 201 Created (got ${resCreate.status})`);
    assert(resCreate.body.success === true, 'Response has success: true');
    assert(resCreate.body.data && resCreate.body.data.name === 'Captain Marcus Vance', 'Created responder name matches');
    assert(resCreate.body.data.badgeNumber === uniqueBadge, 'Badge number matches');
    assert(resCreate.body.data.responderType === 'PARAMEDIC', 'Responder type matches');
    assert(resCreate.body.data.role === 'RESPONDER', 'Role is RESPONDER');
    assert(!resCreate.body.data.passwordHash && !resCreate.body.data.password, 'passwordHash is NOT exposed');

    const createdId = resCreate.body.data.id;

    // TEST 3 — GET BY ID
    console.log('\n▶ TEST 3 — GET BY ID: GET /api/responders/:id');
    const resGet = await request('GET', `/api/responders/${createdId}`);
    assert(resGet.status === 200, `Returns 200 OK (got ${resGet.status})`);
    assert(resGet.body.success === true, 'Response has success: true');
    assert(resGet.body.data.id === createdId, 'Returned ID matches');
    assert(resGet.body.data.email === uniqueEmail, 'Email matches');
    assert(!resGet.body.data.passwordHash, 'passwordHash is NOT exposed');

    // TEST 4 — UPDATE
    console.log('\n▶ TEST 4 — UPDATE: PATCH /api/responders/:id');
    const updatePayload = {
      name: 'Captain Marcus Vance (Senior)',
      skills: ['Advanced Cardiac Life Support', 'Trauma Triage', 'Airway Management', 'Hazmat Ops'],
      status: 'AVAILABLE'
    };
    const resUpdate = await request('PATCH', `/api/responders/${createdId}`, updatePayload);
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.success === true, 'Response has success: true');
    assert(resUpdate.body.data.name === 'Captain Marcus Vance (Senior)', 'Updated name is reflected');
    assert(resUpdate.body.data.skills.includes('Hazmat Ops'), 'Updated skills array contains new skill');

    // TEST 5 — DEACTIVATE
    console.log('\n▶ TEST 5 — DEACTIVATE: DELETE /api/responders/:id');
    const resDeactivate = await request('DELETE', `/api/responders/${createdId}`);
    assert(resDeactivate.status === 200, `Returns 200 OK (got ${resDeactivate.status})`);
    assert(resDeactivate.body.success === true, 'Response has success: true');
    assert(resDeactivate.body.data.status === 'OFF_DUTY', 'Status is changed to OFF_DUTY');

    // Verify still exists in DB after deactivation
    const resGetDeactivated = await request('GET', `/api/responders/${createdId}`);
    assert(resGetDeactivated.status === 200, 'Responder still exists in database');
    assert(resGetDeactivated.body.data.status === 'OFF_DUTY', 'Persisted status is OFF_DUTY');

    // TEST 6 — NONEXISTENT RESPONDER
    console.log('\n▶ TEST 6 — NONEXISTENT RESPONDER: GET /api/responders/nonexistent-id');
    const resNotFound = await request('GET', '/api/responders/nonexistent-uuid-9999');
    assert(resNotFound.status === 404, `Returns 404 Not Found (got ${resNotFound.status})`);
    assert(resNotFound.body.success === false, 'Response has success: false');

    // TEST 7 — DUPLICATE EMAIL
    console.log('\n▶ TEST 7 — DUPLICATE EMAIL: POST /api/responders with existing email');
    const duplicateEmailPayload = {
      name: 'Duplicate Email Tester',
      email: uniqueEmail,
      responderType: 'FIREFIGHTER'
    };
    const resDupEmail = await request('POST', '/api/responders', duplicateEmailPayload);
    assert(resDupEmail.status === 409, `Returns 409 Conflict (got ${resDupEmail.status})`);
    assert(resDupEmail.body.success === false, 'Response has success: false');

    // TEST 8 — DUPLICATE BADGE
    console.log('\n▶ TEST 8 — DUPLICATE BADGE: POST /api/responders with existing badgeNumber');
    const duplicateBadgePayload = {
      name: 'Duplicate Badge Tester',
      email: `another.${Date.now()}@resqnet.org`,
      badgeNumber: uniqueBadge,
      responderType: 'POLICE'
    };
    const resDupBadge = await request('POST', '/api/responders', duplicateBadgePayload);
    assert(resDupBadge.status === 409, `Returns 409 Conflict (got ${resDupBadge.status})`);
    assert(resDupBadge.body.success === false, 'Response has success: false');

    // TEST 9 — INVALID INPUT
    console.log('\n▶ TEST 9 — INVALID INPUT: POST /api/responders with missing required fields');
    const invalidPayload = {
      phone: '12345'
    };
    const resInvalid = await request('POST', '/api/responders', invalidPayload);
    assert(resInvalid.status === 400, `Returns 400 Bad Request (got ${resInvalid.status})`);
    assert(resInvalid.body.success === false, 'Response has success: false');

    // TEST 10 — DATABASE VERIFICATION
    console.log('\n▶ TEST 10 — DIRECT DATABASE VERIFICATION IN POSTGRESQL');
    const dbProfile = await prisma.responderProfile.findUnique({
      where: { id: createdId },
      include: { user: true }
    });
    assert(dbProfile !== null, 'Record exists in PostgreSQL ResponderProfile table');
    assert(dbProfile.user !== null, 'Linked User record exists in PostgreSQL User table');
    assert(dbProfile.user.email === uniqueEmail, 'PostgreSQL User email matches exactly');
    assert(dbProfile.status === 'OFF_DUTY', 'PostgreSQL ResponderProfile status matches OFF_DUTY');
    assert(dbProfile.badgeNumber === uniqueBadge, 'PostgreSQL badge number matches');
    assert(typeof dbProfile.user.passwordHash === 'string' && dbProfile.user.passwordHash.length > 20, 'User password is encrypted/hashed in database');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
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

runTests().catch(err => {
  console.error('💥 Test execution error:', err);
  process.exit(1);
});
