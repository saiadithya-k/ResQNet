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

async function runFatigueTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 6: P3-06 Responder Fatigue Tests');
  console.log('🧪 ========================================================\n');

  // Start HTTP and Socket.IO server
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

  // Connect Socket.IO client
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
    // SETUP: Create a baseline test responder
    // ----------------------------------------------------
    const uniqueEmail = `fatigue.tester.${Date.now()}@resqnet.org`;
    const uniqueBadge = `FTG-${Date.now().toString().slice(-4)}`;
    const createRes = await request('POST', '/api/responders', {
      name: 'Officer Alex Murphy',
      email: uniqueEmail,
      badgeNumber: uniqueBadge,
      responderType: 'POLICE'
    });
    const responderId = createRes.body.data.id;

    // ----------------------------------------------------
    // TEST 1 — FATIGUE FOR RESPONDER
    // ----------------------------------------------------
    console.log('▶ TEST 1 — FATIGUE FOR RESPONDER: GET /api/responders/:id/fatigue');
    const resGetFatigue = await request('GET', `/api/responders/${responderId}/fatigue`);
    assert(resGetFatigue.status === 200, `Returns 200 OK (got ${resGetFatigue.status})`);
    assert(resGetFatigue.body.success === true, 'Response has success: true');
    assert(typeof resGetFatigue.body.data.score === 'number', 'score is a number');
    assert(resGetFatigue.body.data.score >= 0 && resGetFatigue.body.data.score <= 100, 'Score is bounded between 0 and 100');
    assert(Boolean(resGetFatigue.body.data.level), 'level is present');
    assert(Boolean(resGetFatigue.body.data.factors), 'factors breakdown is present');

    // ----------------------------------------------------
    // TEST 2 — LOW/BASELINE RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — LOW/BASELINE RESPONDER: Baseline responder has low/minimal fatigue');
    assert(resGetFatigue.body.data.score === 0, 'Baseline score is 0');
    assert(resGetFatigue.body.data.level === 'LOW', 'Baseline level is LOW');

    // ----------------------------------------------------
    // TEST 3 — HIGHER WORKLOAD
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — HIGHER WORKLOAD: Moderate duty hours (8h) increases score');
    const resModerate = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 8,
      consecutiveShifts: 1,
      incidentsCount: 2
    });
    assert(resModerate.status === 200, 'Recalculation returns 200 OK');
    const modScore = resModerate.body.data.score;
    assert(modScore > 0, `Score increased from 0 to ${modScore}`);
    assert(resModerate.body.data.level === 'MODERATE' || resModerate.body.data.level === 'HIGH', `Level is ${resModerate.body.data.level}`);

    // ----------------------------------------------------
    // TEST 4 — SCORE BOUNDS (Extreme workload clamped to 100)
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — SCORE BOUNDS: Extreme workload clamped to 100');
    const resExtreme = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 48,
      consecutiveShifts: 10,
      incidentsCount: 50
    });
    assert(resExtreme.status === 200, 'Extreme recalculation returns 200 OK');
    assert(resExtreme.body.data.score === 100, 'Extreme score is strictly clamped at 100');
    assert(resExtreme.body.data.level === 'CRITICAL', 'Extreme level is CRITICAL');

    // ----------------------------------------------------
    // TEST 5 — LEVEL CALCULATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — LEVEL CALCULATION: Verify level mappings');
    // Test Low
    const resLow = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 2,
      consecutiveShifts: 0,
      incidentsCount: 1
    });
    assert(resLow.body.data.level === 'LOW', 'Score < 30 maps to LOW');

    // Test High
    const resHigh = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 12,
      consecutiveShifts: 1,
      incidentsCount: 3
    });
    assert(resHigh.body.data.score >= 60 && resHigh.body.data.score < 80, `Score is in High range (${resHigh.body.data.score})`);
    assert(resHigh.body.data.level === 'HIGH', 'Score in 60-79 maps to HIGH');

    // ----------------------------------------------------
    // TEST 6 — RECALCULATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — RECALCULATION: Workload changes dynamically update score');
    const resRecalc = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 6,
      consecutiveShifts: 0,
      incidentsCount: 2
    });
    assert(resRecalc.status === 200, 'Recalculation succeeded');
    assert(resRecalc.body.data.factors.dutyHours === 6, 'dutyHours reflected in factors');

    // ----------------------------------------------------
    // TEST 7 — DATABASE PERSISTENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — DATABASE PERSISTENCE: Verify ResponderProfile and FatigueRecord in PostgreSQL');
    const dbProfile = await prisma.responderProfile.findUnique({
      where: { id: responderId }
    });
    assert(dbProfile.fatigueScore === resRecalc.body.data.score, 'PostgreSQL ResponderProfile.fatigueScore matches API');

    const dbRecord = await prisma.fatigueRecord.findFirst({
      where: { responderId },
      orderBy: { recordedAt: 'desc' }
    });
    assert(dbRecord !== null, 'FatigueRecord exists in PostgreSQL');
    assert(dbRecord.fatigueScore === resRecalc.body.data.score, 'FatigueRecord.fatigueScore matches');

    // ----------------------------------------------------
    // TEST 8 — FATIGUE HISTORY
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — FATIGUE HISTORY: GET /api/responders/:id/fatigue/history');
    const resHistory = await request('GET', `/api/responders/${responderId}/fatigue/history`);
    assert(resHistory.status === 200, 'History returns 200 OK');
    assert(Array.isArray(resHistory.body.data), 'History data is an array');
    assert(resHistory.body.data.length > 0, 'Contains historical snapshot records');

    // ----------------------------------------------------
    // TEST 9 — INVALID INPUT
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — INVALID INPUT: Malformed non-numeric values');
    const resInvalidInput = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 'invalid-string'
    });
    assert(resInvalidInput.status === 400, `Returns 400 Bad Request (got ${resInvalidInput.status})`);
    assert(resInvalidInput.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 10 — NEGATIVE WORKLOAD
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — NEGATIVE WORKLOAD: Negative duty hours rejected');
    const resNegative = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: -5
    });
    assert(resNegative.status === 400, `Returns 400 Bad Request for negative duty hours (got ${resNegative.status})`);

    // ----------------------------------------------------
    // TEST 11 — ALERT THRESHOLD VIA SOCKET.IO
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — ALERT THRESHOLD: Crossing into HIGH/CRITICAL emits responder:fatigue_alert');
    // First reset to LOW
    await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 0,
      consecutiveShifts: 0,
      incidentsCount: 0
    });

    let alertEventReceived = null;
    const alertPromise = new Promise((resolve) => {
      const handler = (data) => {
        if (data.responderId === responderId) {
          alertEventReceived = data;
          socketClient.off('responder:fatigue_alert', handler);
          resolve(data);
        }
      };
      socketClient.on('responder:fatigue_alert', handler);
    });

    // Now trigger transition directly to CRITICAL (dutyHours: 16, shifts: 2, incidents: 6 -> score >= 80)
    const resTriggerAlert = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 16,
      consecutiveShifts: 2,
      incidentsCount: 6
    });
    assert(resTriggerAlert.status === 200, 'Recalculation succeeded');
    assert(resTriggerAlert.body.data.level === 'CRITICAL', 'Level transitioned to CRITICAL');

    await Promise.race([
      alertPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Fatigue alert timeout')), 3000))
    ]);

    assert(alertEventReceived !== null, 'Received responder:fatigue_alert event via Socket.IO');
    assert(alertEventReceived.responderId === responderId, 'Event responderId matches');
    assert(alertEventReceived.level === 'CRITICAL', 'Event level is CRITICAL');
    assert(alertEventReceived.score >= 80, 'Event score is >= 80');
    assert(Boolean(alertEventReceived.timestamp), 'Event timestamp is present');

    // ----------------------------------------------------
    // TEST 12 — NO ALERT BELOW THRESHOLD
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — NO ALERT BELOW THRESHOLD');
    // Create new responder for clean threshold testing
    const createResLow = await request('POST', '/api/responders', {
      name: 'Fresh Unit Low',
      email: `fresh.low.${Date.now()}@resqnet.org`,
      responderType: 'PARAMEDIC'
    });
    const lowResponderId = createResLow.body.data.id;

    let unwantedAlertReceived = false;
    const unwantedHandler = (data) => {
      if (data.responderId === lowResponderId) {
        unwantedAlertReceived = true;
      }
    };
    socketClient.on('responder:fatigue_alert', unwantedHandler);

    // Recalculate with low workload
    await request('POST', `/api/responders/${lowResponderId}/fatigue/recalculate`, {
      dutyHours: 3,
      consecutiveShifts: 0,
      incidentsCount: 1
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('responder:fatigue_alert', unwantedHandler);
    assert(unwantedAlertReceived === false, 'No alert was emitted for low fatigue state');

    // ----------------------------------------------------
    // TEST 13 — NO DUPLICATE ALERT FLOOD
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — NO DUPLICATE ALERT FLOOD');
    let duplicateAlertReceived = false;
    const duplicateHandler = (data) => {
      if (data.responderId === responderId) {
        duplicateAlertReceived = true;
      }
    };
    socketClient.on('responder:fatigue_alert', duplicateHandler);

    // Re-trigger same recalculation without level transition (already CRITICAL)
    await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 16,
      consecutiveShifts: 2,
      incidentsCount: 6
    });

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('responder:fatigue_alert', duplicateHandler);
    assert(duplicateAlertReceived === false, 'No duplicate alert was emitted when remaining in the same critical state');

    // ----------------------------------------------------
    // TEST 14 — NO ALERT ON FAILURE
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — NO ALERT ON FAILURE');
    let failAlertReceived = false;
    const failHandler = (data) => {
      if (data.responderId === responderId) {
        failAlertReceived = true;
      }
    };
    socketClient.on('responder:fatigue_alert', failHandler);

    const resFail = await request('POST', `/api/responders/${responderId}/fatigue/recalculate`, {
      dutyHours: 'bad-input'
    });
    assert(resFail.status === 400, 'Failed request returned 400 Bad Request');

    await new Promise(resolve => setTimeout(resolve, 400));
    socketClient.off('responder:fatigue_alert', failHandler);
    assert(failAlertReceived === false, 'No alert emitted on failed request');

    console.log('\n========================================================');
    console.log(`📊 FATIGUE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runFatigueTests().catch(err => {
  console.error('💥 Fatigue test error:', err);
  process.exit(1);
});
