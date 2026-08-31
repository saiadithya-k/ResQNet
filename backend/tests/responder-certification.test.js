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

async function runCertificationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 4: P3-04 Responder Certifications Tests');
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
    // SETUP: Create two responders for ownership isolation testing
    // ----------------------------------------------------
    const uniqueEmailA = `cert.tester.a.${Date.now()}@resqnet.org`;
    const uniqueBadgeA = `CRT-A-${Date.now().toString().slice(-4)}`;
    const createResA = await request('POST', '/api/responders', {
      name: 'Captain John Miller',
      email: uniqueEmailA,
      badgeNumber: uniqueBadgeA,
      responderType: 'PARAMEDIC'
    });
    const responderAId = createResA.body.data.id;

    const uniqueEmailB = `cert.tester.b.${Date.now()}@resqnet.org`;
    const uniqueBadgeB = `CRT-B-${Date.now().toString().slice(-4)}`;
    const createResB = await request('POST', '/api/responders', {
      name: 'Officer Alex Murphy',
      email: uniqueEmailB,
      badgeNumber: uniqueBadgeB,
      responderType: 'POLICE'
    });
    const responderBId = createResB.body.data.id;

    // ----------------------------------------------------
    // TEST 10 — GET CERTIFICATIONS (Initial empty state)
    // ----------------------------------------------------
    console.log('▶ TEST 10 — GET CERTIFICATIONS: GET /api/responders/:id/certifications');
    const resGetInit = await request('GET', `/api/responders/${responderAId}/certifications`);
    assert(resGetInit.status === 200, `Returns 200 OK (got ${resGetInit.status})`);
    assert(Array.isArray(resGetInit.body.data), 'Returns array of certifications');
    assert(resGetInit.body.data.length === 0, 'Initial list is empty');

    // ----------------------------------------------------
    // TEST 11 — CREATE CERTIFICATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — CREATE CERTIFICATION: POST /api/responders/:id/certifications');
    const resCreateCert = await request('POST', `/api/responders/${responderAId}/certifications`, {
      name: 'Advanced Cardiac Life Support (ACLS)',
      issuingOrg: 'American Heart Association',
      certificateNumber: 'AHA-ACLS-99182',
      issuedDate: '2025-01-15T00:00:00.000Z',
      expiryDate: '2027-01-15T00:00:00.000Z',
      isVerified: true
    });
    assert(resCreateCert.status === 201, `Returns 201 Created (got ${resCreateCert.status})`);
    assert(resCreateCert.body.success === true, 'Response has success: true');
    assert(resCreateCert.body.data.name === 'Advanced Cardiac Life Support (ACLS)', 'Name matches');
    assert(resCreateCert.body.data.responderId === responderAId, 'Belongs to responder A');
    assert(resCreateCert.body.data.isVerified === true, 'isVerified is true');
    const certId = resCreateCert.body.data.id;

    // ----------------------------------------------------
    // TEST 12 — GET CERTIFICATION BY ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — GET CERTIFICATION: GET /api/responders/:id/certifications/:certId');
    const resGetById = await request('GET', `/api/responders/${responderAId}/certifications/${certId}`);
    assert(resGetById.status === 200, `Returns 200 OK (got ${resGetById.status})`);
    assert(resGetById.body.data.id === certId, 'Returned cert ID matches');
    assert(resGetById.body.data.certificateNumber === 'AHA-ACLS-99182', 'certificateNumber matches');

    // ----------------------------------------------------
    // TEST 13 — UPDATE CERTIFICATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — UPDATE CERTIFICATION: PATCH /api/responders/:id/certifications/:certId');
    const resUpdateCert = await request('PATCH', `/api/responders/${responderAId}/certifications/${certId}`, {
      certificateNumber: 'AHA-ACLS-99182-RENEWED',
      expiryDate: '2028-01-15T00:00:00.000Z'
    });
    assert(resUpdateCert.status === 200, `Returns 200 OK (got ${resUpdateCert.status})`);
    assert(resUpdateCert.body.data.certificateNumber === 'AHA-ACLS-99182-RENEWED', 'certificateNumber updated');

    // ----------------------------------------------------
    // TEST 14 — DELETE CERTIFICATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — DELETE CERTIFICATION: DELETE /api/responders/:id/certifications/:certId');
    // Create a temporary cert to delete
    const tempCertRes = await request('POST', `/api/responders/${responderAId}/certifications`, {
      name: 'Temporary Hazmat Certification'
    });
    const tempCertId = tempCertRes.body.data.id;

    const resDelCert = await request('DELETE', `/api/responders/${responderAId}/certifications/${tempCertId}`);
    assert(resDelCert.status === 200, `Returns 200 OK on deletion (got ${resDelCert.status})`);

    const resGetAfterDel = await request('GET', `/api/responders/${responderAId}/certifications/${tempCertId}`);
    assert(resGetAfterDel.status === 404, 'Deleted cert returns 404 Not Found');

    // ----------------------------------------------------
    // TEST 15 — INVALID CERTIFICATION (Missing name)
    // ----------------------------------------------------
    console.log('\n▶ TEST 15 — INVALID CERTIFICATION: Missing name');
    const resInvalidName = await request('POST', `/api/responders/${responderAId}/certifications`, {
      issuingOrg: 'American Red Cross'
    });
    assert(resInvalidName.status === 400, `Returns 400 Bad Request (got ${resInvalidName.status})`);
    assert(resInvalidName.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 16 — INVALID DATES (Malformed date string)
    // ----------------------------------------------------
    console.log('\n▶ TEST 16 — INVALID DATES: Malformed date string');
    const resInvalidDate = await request('POST', `/api/responders/${responderAId}/certifications`, {
      name: 'Wilderness First Responder',
      issuedDate: 'invalid-date-string'
    });
    assert(resInvalidDate.status === 400, `Returns 400 Bad Request for malformed date (got ${resInvalidDate.status})`);

    // ----------------------------------------------------
    // TEST 17 — EXPIRY BEFORE ISSUE (expiryDate < issuedDate)
    // ----------------------------------------------------
    console.log('\n▶ TEST 17 — EXPIRY BEFORE ISSUE: expiryDate < issuedDate');
    const resChronology = await request('POST', `/api/responders/${responderAId}/certifications`, {
      name: 'Pediatric Advanced Life Support',
      issuedDate: '2026-06-01T00:00:00.000Z',
      expiryDate: '2025-06-01T00:00:00.000Z'
    });
    assert(resChronology.status === 400, `Returns 400 Bad Request for inverted dates (got ${resChronology.status})`);
    assert(resChronology.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 18 — WRONG RESPONDER OWNERSHIP ISOLATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 18 — WRONG RESPONDER OWNERSHIP: Access Responder A cert via Responder B URL');
    const resCrossAccess = await request('GET', `/api/responders/${responderBId}/certifications/${certId}`);
    assert(resCrossAccess.status === 404, `Cross-access returns 404 Not Found (got ${resCrossAccess.status})`);

    const resCrossDelete = await request('DELETE', `/api/responders/${responderBId}/certifications/${certId}`);
    assert(resCrossDelete.status === 404, `Cross-delete returns 404 Not Found (got ${resCrossDelete.status})`);

    // ----------------------------------------------------
    // TEST 19 — NONEXISTENT RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 19 — NONEXISTENT RESPONDER: GET /api/responders/nonexistent-id/certifications');
    const resNonExistent = await request('GET', '/api/responders/nonexistent-uuid-9999/certifications');
    assert(resNonExistent.status === 404, `Returns 404 Not Found (got ${resNonExistent.status})`);

    // ----------------------------------------------------
    // TEST 20 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 20 — DATABASE PERSISTENCE: Verify certification in PostgreSQL via Prisma');
    const dbCert = await prisma.certification.findUnique({
      where: { id: certId }
    });
    assert(dbCert !== null, 'Certification record found in PostgreSQL');
    assert(dbCert.name === 'Advanced Cardiac Life Support (ACLS)', 'PostgreSQL cert name matches');
    assert(dbCert.certificateNumber === 'AHA-ACLS-99182-RENEWED', 'PostgreSQL cert number matches');
    assert(dbCert.responderId === responderAId, 'PostgreSQL responderId matches');

    console.log('\n========================================================');
    console.log(`📊 CERTIFICATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runCertificationTests().catch(err => {
  console.error('💥 Certification test error:', err);
  process.exit(1);
});
