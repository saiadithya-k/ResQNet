const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('../src/app');
const prisma = require('../src/config/database');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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

async function runRegressionTests() {
  console.log('🔄 ====================================================');
  console.log('🔄 ResQNet Regression Checks');
  console.log('🔄 ====================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`📡 Backend running on ${baseUrl}\n`);
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
    // 1. Health check
    console.log('▶ REGRESSION 1: GET /health');
    const resHealth = await request('GET', '/health');
    assert(resHealth.status === 200, `Health check returns 200 (got ${resHealth.status})`);
    assert(resHealth.body.status === 'ONLINE', 'Status is ONLINE');

    // 2. Auth login
    console.log('\n▶ REGRESSION 2: POST /api/auth/login');
    const resLogin = await request('POST', '/api/auth/login', {
      email: 'admin@resqnet.org',
      password: 'password123'
    });
    assert(resLogin.status === 200, `Auth login returns 200 (got ${resLogin.status})`);
    assert(resLogin.body.success === true, 'Login success is true');
    assert(Boolean(resLogin.body.data && resLogin.body.data.token), 'JWT token returned');

    // 3. Auth register
    console.log('\n▶ REGRESSION 3: POST /api/auth/register');
    const regEmail = `citizen.${Date.now()}@resqnet.org`;
    const resReg = await request('POST', '/api/auth/register', {
      email: regEmail,
      password: 'password123',
      name: 'Test Citizen'
    });
    assert(resReg.status === 201, `Auth register returns 201 (got ${resReg.status})`);
    assert(Boolean(resReg.body.data && resReg.body.data.token), 'JWT token returned for registered user');

    // 4. Incidents route
    console.log('\n▶ REGRESSION 4: GET /api/incidents');
    const resIncidents = await request('GET', '/api/incidents');
    assert(resIncidents.status === 200, `Incidents list returns 200 (got ${resIncidents.status})`);
    assert(resIncidents.body.success === true, 'Incidents success is true');

    // 5. Preserved responder location route
    console.log('\n▶ REGRESSION 5: PATCH /api/responders/:id/location');
    // First create a responder to test location update
    const resResp = await request('POST', '/api/responders', {
      name: 'Location Test Unit',
      email: `loc.${Date.now()}@resqnet.org`,
      responderType: 'PARAMEDIC',
      badgeNumber: `LOC-${Date.now().toString().slice(-4)}`
    });
    const respId = resResp.body.data.id;

    const resLoc = await request('PATCH', `/api/responders/${respId}/location`, {
      latitude: 13.0827,
      longitude: 80.2707,
      status: 'AVAILABLE'
    });
    assert(resLoc.status === 200, `Location patch returns 200 (got ${resLoc.status})`);
    assert(resLoc.body.success === true, 'Location patch returns success: true');
    assert(resLoc.body.data.latitude === 13.0827, 'Latitude correctly updated');

    // 6. Community responder mesh route
    console.log('\n▶ REGRESSION 6: GET /api/community-responders/mesh');
    const resComm = await request('GET', '/api/community-responders/mesh');
    assert(resComm.status === 200, `Community mesh returns 200 (got ${resComm.status})`);

    // 7. Hospital routes
    console.log('\n▶ REGRESSION 7: GET /api/hospitals');
    const resHosp = await request('GET', '/api/hospitals');
    assert(resHosp.status === 200, `Hospitals route returns 200 (got ${resHosp.status})`);

    console.log('\n====================================================');
    console.log(`📊 REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runRegressionTests().catch(err => {
  console.error('💥 Regression test error:', err);
  process.exit(1);
});
