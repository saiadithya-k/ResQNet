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

async function runSkillsTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 4: P3-04 Responder Skills Tests');
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
    // SETUP: Create a test responder with initial skills
    // ----------------------------------------------------
    const uniqueEmail = `skills.tester.${Date.now()}@resqnet.org`;
    const uniqueBadge = `SKL-${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/responders', {
      name: 'Dr. Gregory House',
      email: uniqueEmail,
      badgeNumber: uniqueBadge,
      responderType: 'PARAMEDIC',
      skills: ['Diagnostic Medicine']
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — GET SKILLS
    // ----------------------------------------------------
    console.log('▶ TEST 1 — GET SKILLS: GET /api/responders/:id/skills');
    const resGetSkills = await request('GET', `/api/responders/${responderId}/skills`);
    assert(resGetSkills.status === 200, `Returns 200 OK (got ${resGetSkills.status})`);
    assert(resGetSkills.body.success === true, 'Response has success: true');
    assert(Array.isArray(resGetSkills.body.data), 'data is an array');
    assert(resGetSkills.body.data.includes('Diagnostic Medicine'), 'Contains initial skill');

    // ----------------------------------------------------
    // TEST 2 — ADD SKILL
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — ADD SKILL: POST /api/responders/:id/skills (CPR)');
    const resAddSkill = await request('POST', `/api/responders/${responderId}/skills`, {
      skill: 'CPR'
    });
    assert(resAddSkill.status === 201 || resAddSkill.status === 200, `Returns 201/200 (got ${resAddSkill.status})`);
    assert(resAddSkill.body.data.includes('CPR'), 'Returned skills contain CPR');
    assert(resAddSkill.body.data.includes('Diagnostic Medicine'), 'Initial skill retained');

    // ----------------------------------------------------
    // TEST 3 — ADD SECOND SKILL
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — ADD SECOND SKILL: POST /api/responders/:id/skills (Trauma Triage)');
    const resAddSecond = await request('POST', `/api/responders/${responderId}/skills`, {
      skill: 'Trauma Triage'
    });
    assert(resAddSecond.status === 201 || resAddSecond.status === 200, `Returns 201/200 (got ${resAddSecond.status})`);
    assert(resAddSecond.body.data.includes('Trauma Triage'), 'Contains Trauma Triage');
    assert(resAddSecond.body.data.includes('CPR'), 'Contains CPR');
    assert(resAddSecond.body.data.includes('Diagnostic Medicine'), 'Contains Diagnostic Medicine');

    // ----------------------------------------------------
    // TEST 4 — DUPLICATE SKILL
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — DUPLICATE SKILL: Attempt to add CPR again');
    const resDup = await request('POST', `/api/responders/${responderId}/skills`, {
      skill: 'cpr'
    });
    assert(resDup.status === 409 || resDup.status === 400, `Duplicate rejected with 409/400 (got ${resDup.status})`);
    assert(resDup.body.success === false, 'Response has success: false');

    const dbSkillsAfterDup = await prisma.responderProfile.findUnique({ where: { id: responderId } });
    const cprOccurrences = dbSkillsAfterDup.skills.filter(s => s.toLowerCase() === 'cpr');
    assert(cprOccurrences.length === 1, 'No duplicate entry in database');

    // ----------------------------------------------------
    // TEST 5 — UPDATE SKILLS
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — UPDATE SKILLS: PATCH /api/responders/:id/skills');
    const resUpdate = await request('PATCH', `/api/responders/${responderId}/skills`, {
      skills: ['Advanced Life Support', 'Defibrillation', 'Triage']
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.length === 3, 'Returns 3 skills');
    assert(resUpdate.body.data.includes('Advanced Life Support'), 'Contains Advanced Life Support');
    assert(resUpdate.body.data.includes('Defibrillation'), 'Contains Defibrillation');
    assert(resUpdate.body.data.includes('Triage'), 'Contains Triage');

    // ----------------------------------------------------
    // TEST 6 — REMOVE SKILL
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — REMOVE SKILL: DELETE /api/responders/:id/skills/:skill (Defibrillation)');
    const resRemove = await request('DELETE', `/api/responders/${responderId}/skills/Defibrillation`);
    assert(resRemove.status === 200, `Returns 200 OK (got ${resRemove.status})`);
    assert(!resRemove.body.data.includes('Defibrillation'), 'Defibrillation removed');
    assert(resRemove.body.data.includes('Advanced Life Support'), 'Other skills remain');
    assert(resRemove.body.data.includes('Triage'), 'Other skills remain');

    // ----------------------------------------------------
    // TEST 7 — EMPTY SKILL
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — EMPTY SKILL: POST /api/responders/:id/skills with ""');
    const resEmpty = await request('POST', `/api/responders/${responderId}/skills`, {
      skill: '   '
    });
    assert(resEmpty.status === 400, `Returns 400 Bad Request (got ${resEmpty.status})`);
    assert(resEmpty.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 8 — NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — NONEXISTENT RESPONDER: GET /api/responders/nonexistent-id/skills');
    const resNonExistent = await request('GET', '/api/responders/nonexistent-uuid-9999/skills');
    assert(resNonExistent.status === 404, `Returns 404 Not Found (got ${resNonExistent.status})`);
    assert(resNonExistent.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 9 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbProfile = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbProfile !== null, 'Responder found in PostgreSQL');
    assert(dbProfile.skills.length === 2, 'Database contains exactly 2 skills');
    assert(dbProfile.skills.includes('Advanced Life Support'), 'DB has Advanced Life Support');
    assert(dbProfile.skills.includes('Triage'), 'DB has Triage');
    assert(!dbProfile.skills.includes('Defibrillation'), 'DB does not have removed skill');

    console.log('\n========================================================');
    console.log(`📊 SKILLS TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runSkillsTests().catch(err => {
  console.error('💥 Skills test error:', err);
  process.exit(1);
});
