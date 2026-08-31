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

async function runHospitalTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 9: P4-01 Hospital Management Tests');
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
    // TEST 1 — CREATE HOSPITAL
    // ----------------------------------------------------
    console.log('▶ TEST 1 — CREATE HOSPITAL: POST /api/hospitals');
    const uniqueHospName = `Metro Emergency Hospital ${Date.now()}`;
    const resCreate = await request('POST', '/api/hospitals', {
      name: uniqueHospName,
      district: 'Central Zone',
      latitude: 13.0827,
      longitude: 80.2707,
      specializations: ['Trauma', 'Cardiology', 'Burn Unit']
    });

    assert(resCreate.status === 201, `Returns 201 Created (got ${resCreate.status})`);
    assert(resCreate.body.success === true, 'Response has success: true');
    assert(resCreate.body.data.name === uniqueHospName, 'Hospital name matches');
    assert(resCreate.body.data.status === 'ACTIVE', 'Initial status is ACTIVE');
    const hospId = resCreate.body.data.id;
    const userId = resCreate.body.data.userId;

    // ----------------------------------------------------
    // TEST 2 — GET HOSPITAL LIST
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — GET HOSPITAL LIST: GET /api/hospitals');
    const resList = await request('GET', '/api/hospitals');
    assert(resList.status === 200, `Returns 200 OK (got ${resList.status})`);
    assert(resList.body.success === true, 'Response has success: true');
    assert(Array.isArray(resList.body.data), 'data is an array');
    const foundInList = resList.body.data.find(h => h.id === hospId);
    assert(Boolean(foundInList), 'Created hospital appears in hospital list');

    // ----------------------------------------------------
    // TEST 3 — GET HOSPITAL BY ID
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — GET HOSPITAL BY ID: GET /api/hospitals/:id');
    const resGet = await request('GET', `/api/hospitals/${hospId}`);
    assert(resGet.status === 200, `Returns 200 OK (got ${resGet.status})`);
    assert(resGet.body.data.id === hospId, 'ID matches');
    assert(resGet.body.data.name === uniqueHospName, 'Name matches');
    assert(resGet.body.data.latitude === 13.0827, 'Latitude matches');
    assert(resGet.body.data.longitude === 80.2707, 'Longitude matches');

    // ----------------------------------------------------
    // TEST 4 — UPDATE HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — UPDATE HOSPITAL: PATCH /api/hospitals/:id');
    const updatedDistrict = 'North Industrial Sector';
    const resUpdate = await request('PATCH', `/api/hospitals/${hospId}`, {
      district: updatedDistrict,
      latitude: 13.0900,
      longitude: 80.2500
    });
    assert(resUpdate.status === 200, `Returns 200 OK (got ${resUpdate.status})`);
    assert(resUpdate.body.data.district === updatedDistrict, 'District updated in response');
    assert(resUpdate.body.data.latitude === 13.0900, 'Latitude updated in response');

    // Verify DB update
    const dbHospAfterUpdate = await prisma.hospitalProfile.findUnique({ where: { id: hospId } });
    assert(dbHospAfterUpdate.district === updatedDistrict, 'District persisted in PostgreSQL');

    // ----------------------------------------------------
    // TEST 5 — DELETE/DEACTIVATE HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — DELETE/DEACTIVATE HOSPITAL: DELETE /api/hospitals/:id');
    const resDeactivate = await request('DELETE', `/api/hospitals/${hospId}`);
    assert(resDeactivate.status === 200, `Returns 200 OK (got ${resDeactivate.status})`);
    assert(resDeactivate.body.data.status === 'INACTIVE', 'Status is INACTIVE');
    assert(resDeactivate.body.data.isAccepting === false, 'isAccepting is false');

    const dbHospDeactivated = await prisma.hospitalProfile.findUnique({ where: { id: hospId } });
    assert(dbHospDeactivated.isAccepting === false, 'Deactivation persisted in PostgreSQL');

    // ----------------------------------------------------
    // TEST 6 — NONEXISTENT HOSPITAL
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — NONEXISTENT HOSPITAL: GET /api/hospitals/nonexistent-id');
    const resNonexistent = await request('GET', '/api/hospitals/nonexistent-hosp-id-000');
    assert(resNonexistent.status === 404, `Returns 404 Not Found (got ${resNonexistent.status})`);
    assert(resNonexistent.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 7 — INVALID NAME
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — INVALID NAME: Missing/empty hospital name');
    const resEmptyName = await request('POST', '/api/hospitals', {
      name: ''
    });
    assert(resEmptyName.status === 400, `Returns 400 Bad Request (got ${resEmptyName.status})`);
    assert(resEmptyName.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 8 — INVALID LATITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — INVALID LATITUDE: Out of range (91)');
    const resInvalidLat = await request('POST', '/api/hospitals', {
      name: 'Valid Name',
      latitude: 91.0,
      longitude: 80.0
    });
    assert(resInvalidLat.status === 400, `Returns 400 Bad Request (got ${resInvalidLat.status})`);

    // ----------------------------------------------------
    // TEST 9 — INVALID LONGITUDE
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — INVALID LONGITUDE: Out of range (181)');
    const resInvalidLon = await request('POST', '/api/hospitals', {
      name: 'Valid Name',
      latitude: 13.0,
      longitude: 181.0
    });
    assert(resInvalidLon.status === 400, `Returns 400 Bad Request (got ${resInvalidLon.status})`);

    // ----------------------------------------------------
    // TEST 10 — VALID BOUNDARY COORDINATES
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — VALID BOUNDARY COORDINATES: (90, 180) and (-90, -180)');
    const resBoundary1 = await request('POST', '/api/hospitals', {
      name: `Boundary NorthEast ${Date.now()}`,
      latitude: 90.0,
      longitude: 180.0
    });
    assert(resBoundary1.status === 201, 'NorthEast boundary coordinates accepted with 201');

    const resBoundary2 = await request('POST', '/api/hospitals', {
      name: `Boundary SouthWest ${Date.now()}`,
      latitude: -90.0,
      longitude: -180.0
    });
    assert(resBoundary2.status === 201, 'SouthWest boundary coordinates accepted with 201');

    // ----------------------------------------------------
    // TEST 11 — DUPLICATE UNIQUE FIELD
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — DUPLICATE UNIQUE FIELD: Duplicate user hospital profile');
    const resDuplicateUser = await request('POST', '/api/hospitals', {
      userId: userId,
      name: 'Second Hospital Profile'
    });
    assert(resDuplicateUser.status === 409, `Duplicate profile for user rejected with 409 Conflict (got ${resDuplicateUser.status})`);

    // ----------------------------------------------------
    // TEST 12 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — DATABASE PERSISTENCE: Query PostgreSQL via Prisma');
    const dbRecord = await prisma.hospitalProfile.findUnique({
      where: { id: hospId }
    });
    assert(dbRecord !== null, 'Hospital record found in PostgreSQL');
    assert(dbRecord.hospitalName === uniqueHospName, 'hospitalName in DB matches');
    assert(dbRecord.district === updatedDistrict, 'district in DB matches');

    // ----------------------------------------------------
    // TEST 13 — INVALID BODY
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — INVALID BODY: Malformed non-string name in update');
    const resInvalidBody = await request('PATCH', `/api/hospitals/${hospId}`, {
      name: '   '
    });
    assert(resInvalidBody.status === 400, `Empty whitespace name update rejected with 400 (got ${resInvalidBody.status})`);

    // ----------------------------------------------------
    // TEST 14 — AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — AUTHORIZATION: Standardized role handling');
    const createdUser = await prisma.user.findUnique({ where: { id: userId } });
    assert(createdUser.role === 'HOSPITAL', 'Hospital profile owner user has role HOSPITAL');

    console.log('\n========================================================');
    console.log(`📊 HOSPITAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runHospitalTests().catch(err => {
  console.error('💥 Hospital test error:', err);
  process.exit(1);
});
