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

async function runMatchingTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ResQNet Phase 7: P3-07 Smart Dispatch Matching Tests');
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
    // SETUP: Create a test incident in PostgreSQL
    // ----------------------------------------------------
    const incident = await prisma.incident.create({
      data: {
        title: 'Central Market Fire & Structural Damage',
        description: 'Multi-unit blaze with trapped occupants and smoke inhalation victims',
        incidentType: 'FIRE',
        status: 'REPORTED',
        severity: 'CRITICAL',
        priorityScore: 88,
        latitude: 13.0827,
        longitude: 80.2707,
        district: 'Central Zone',
        victimCount: 4,
        hasInjuries: true,
        hasTrapped: true,
        hasFire: true
      }
    });

    // SETUP: Create Responders with controlled properties for comparisons
    // Responder 1: High skill, high equipment, close distance, fresh
    const r1 = await request('POST', '/api/responders', {
      name: 'Captain Marcus Vance',
      email: `marcus.${Date.now()}@resqnet.org`,
      badgeNumber: `VNC-${Date.now().toString().slice(-4)}`,
      responderType: 'FIREFIGHTER'
    });
    const r1Id = r1.body.data.id;
    await request('PATCH', `/api/responders/${r1Id}/skills`, { skills: ['Fire Rescue', 'Search and Rescue', 'CPR', 'Trauma'] });
    await request('PATCH', `/api/responders/${r1Id}/equipment`, { equipment: ['Breathing Apparatus', 'Rescue Equipment', 'Trauma Kit'] });
    await request('PATCH', `/api/responders/${r1Id}/location`, { latitude: 13.0850, longitude: 80.2720 });
    await request('POST', `/api/responders/${r1Id}/fatigue/recalculate`, { dutyHours: 1, consecutiveShifts: 0, incidentsCount: 0 });

    // Responder 2: Low skill (no fire skills), no fire equipment, further away, higher fatigue
    const r2 = await request('POST', '/api/responders', {
      name: 'Officer Leo Stern',
      email: `leo.${Date.now()}@resqnet.org`,
      badgeNumber: `STR-${Date.now().toString().slice(-4)}`,
      responderType: 'POLICE'
    });
    const r2Id = r2.body.data.id;
    await request('PATCH', `/api/responders/${r2Id}/skills`, { skills: ['Traffic Control'] });
    await request('PATCH', `/api/responders/${r2Id}/equipment`, { equipment: ['Flashlight', 'First Aid Pouch'] });
    await request('PATCH', `/api/responders/${r2Id}/location`, { latitude: 13.1500, longitude: 80.3500 });
    await request('POST', `/api/responders/${r2Id}/fatigue/recalculate`, { dutyHours: 12, consecutiveShifts: 2, incidentsCount: 4 });

    // Responder 3: OFF_DUTY responder
    const r3 = await request('POST', '/api/responders', {
      name: 'Inactive Unit OffDuty',
      email: `offduty.${Date.now()}@resqnet.org`,
      badgeNumber: `OFF-${Date.now().toString().slice(-4)}`,
      responderType: 'PARAMEDIC'
    });
    const r3Id = r3.body.data.id;
    await request('PATCH', `/api/responders/${r3Id}/status`, { status: 'OFF_DUTY' });

    // ----------------------------------------------------
    // TEST 1 — INCIDENT EXISTS
    // ----------------------------------------------------
    console.log('▶ TEST 1 — INCIDENT EXISTS: GET /api/dispatch/:incidentId/matches');
    const resMatches = await request('GET', `/api/dispatch/${incident.id}/matches`);
    assert(resMatches.status === 200, `Returns 200 OK (got ${resMatches.status})`);
    assert(resMatches.body.success === true, 'Response has success: true');
    assert(Array.isArray(resMatches.body.data.matches), 'Matches is an array');
    assert(resMatches.body.data.matches.length > 0, 'Matches contains candidates');

    // ----------------------------------------------------
    // TEST 2 — NONEXISTENT INCIDENT
    // ----------------------------------------------------
    console.log('\n▶ TEST 2 — NONEXISTENT INCIDENT: GET /api/dispatch/nonexistent-id/matches');
    const resNonexistent = await request('GET', '/api/dispatch/nonexistent-id-000/matches');
    assert(resNonexistent.status === 404, `Returns 404 Not Found (got ${resNonexistent.status})`);
    assert(resNonexistent.body.success === false, 'Response has success: false');

    // ----------------------------------------------------
    // TEST 3 — AVAILABLE RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 3 — AVAILABLE RESPONDER: Eligible responder appears in matches');
    const matchR1 = resMatches.body.data.matches.find(m => m.responderId === r1Id);
    assert(Boolean(matchR1), 'Available responder R1 is present in matches');

    // ----------------------------------------------------
    // TEST 4 — UNAVAILABLE RESPONDER
    // ----------------------------------------------------
    console.log('\n▶ TEST 4 — UNAVAILABLE RESPONDER: OFF_DUTY responder excluded from matches');
    const matchR3 = resMatches.body.data.matches.find(m => m.responderId === r3Id);
    assert(!matchR3, 'OFF_DUTY responder R3 is excluded from candidate matches');

    // ----------------------------------------------------
    // TEST 5 — SKILL MATCH
    // ----------------------------------------------------
    console.log('\n▶ TEST 5 — SKILL MATCH: Responder with required skills receives higher skill score');
    const matchR2 = resMatches.body.data.matches.find(m => m.responderId === r2Id);
    assert(matchR1.breakdown.skillScore > matchR2.breakdown.skillScore, `R1 skillScore (${matchR1.breakdown.skillScore}) > R2 skillScore (${matchR2.breakdown.skillScore})`);

    // ----------------------------------------------------
    // TEST 6 — EQUIPMENT MATCH
    // ----------------------------------------------------
    console.log('\n▶ TEST 6 — EQUIPMENT MATCH: Responder with required equipment receives higher equipment score');
    assert(matchR1.breakdown.equipmentScore > matchR2.breakdown.equipmentScore, `R1 equipmentScore (${matchR1.breakdown.equipmentScore}) > R2 equipmentScore (${matchR2.breakdown.equipmentScore})`);

    // ----------------------------------------------------
    // TEST 7 — FATIGUE INFLUENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 7 — FATIGUE INFLUENCE: Lower fatigue receives higher fatigue freshness score');
    assert(matchR1.breakdown.fatigueFreshnessScore > matchR2.breakdown.fatigueFreshnessScore, `R1 freshness (${matchR1.breakdown.fatigueFreshnessScore}) > R2 freshness (${matchR2.breakdown.fatigueFreshnessScore})`);

    // ----------------------------------------------------
    // TEST 8 — WORKLOAD INFLUENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 8 — WORKLOAD INFLUENCE: Zero active assignments yields 100 workload score');
    assert(matchR1.breakdown.workloadScore === 100, `R1 workload score is 100 (got ${matchR1.breakdown.workloadScore})`);

    // ----------------------------------------------------
    // TEST 9 — DISTANCE INFLUENCE
    // ----------------------------------------------------
    console.log('\n▶ TEST 9 — DISTANCE INFLUENCE: Closer responder receives higher distance score');
    assert(matchR1.distanceKm < matchR2.distanceKm, `R1 distance (${matchR1.distanceKm} km) < R2 distance (${matchR2.distanceKm} km)`);
    assert(matchR1.breakdown.distanceScore > matchR2.breakdown.distanceScore, `R1 distanceScore (${matchR1.breakdown.distanceScore}) > R2 distanceScore (${matchR2.breakdown.distanceScore})`);

    // ----------------------------------------------------
    // TEST 10 — ETA CALCULATION
    // ----------------------------------------------------
    console.log('\n▶ TEST 10 — ETA CALCULATION: Deterministic ETA calculation');
    assert(typeof matchR1.etaMinutes === 'number', 'etaMinutes is a number');
    assert(matchR1.etaMinutes > 0, 'etaMinutes is positive');
    assert(matchR1.etaMinutes < matchR2.etaMinutes, `R1 ETA (${matchR1.etaMinutes} min) < R2 ETA (${matchR2.etaMinutes} min)`);

    // ----------------------------------------------------
    // TEST 11 — SCORE RANGE
    // ----------------------------------------------------
    console.log('\n▶ TEST 11 — SCORE RANGE: 0 <= matchScore <= 100 for all matches');
    const allScoresValid = resMatches.body.data.matches.every(m => m.matchScore >= 0 && m.matchScore <= 100);
    assert(allScoresValid, 'Every matchScore is strictly between 0 and 100');

    // ----------------------------------------------------
    // TEST 12 — RANKING
    // ----------------------------------------------------
    console.log('\n▶ TEST 12 — RANKING: Results sorted descending by matchScore');
    let isSorted = true;
    for (let i = 0; i < resMatches.body.data.matches.length - 1; i++) {
      if (resMatches.body.data.matches[i].matchScore < resMatches.body.data.matches[i + 1].matchScore) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Matches array is sorted descending by matchScore');
    assert(resMatches.body.data.matches[0].matchScore === matchR1.matchScore, `Top ranked responder has highest match score (${matchR1.matchScore})`);
    assert(matchR1.matchScore > matchR2.matchScore, `R1 (${matchR1.matchScore}) ranks strictly higher than R2 (${matchR2.matchScore})`);

    // ----------------------------------------------------
    // TEST 13 — EXPLAINABILITY
    // ----------------------------------------------------
    console.log('\n▶ TEST 13 — EXPLAINABILITY: Full factor breakdown included in results');
    assert(Boolean(matchR1.breakdown), 'breakdown object is present');
    assert(typeof matchR1.breakdown.skillScore === 'number', 'skillScore present');
    assert(typeof matchR1.breakdown.equipmentScore === 'number', 'equipmentScore present');
    assert(typeof matchR1.breakdown.distanceScore === 'number', 'distanceScore present');
    assert(typeof matchR1.breakdown.etaScore === 'number', 'etaScore present');
    assert(typeof matchR1.breakdown.fatigueScore === 'number', 'fatigueScore present');
    assert(typeof matchR1.breakdown.workloadScore === 'number', 'workloadScore present');

    // ----------------------------------------------------
    // TEST 14 — NO DUPLICATES
    // ----------------------------------------------------
    console.log('\n▶ TEST 14 — NO DUPLICATES: Each responder appears at most once');
    const responderIds = resMatches.body.data.matches.map(m => m.responderId);
    const uniqueIds = new Set(responderIds);
    assert(responderIds.length === uniqueIds.size, 'No duplicate responders in ranked results');

    console.log('\n========================================================');
    console.log(`📊 MATCHING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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

runMatchingTests().catch(err => {
  console.error('💥 Matching test error:', err);
  process.exit(1);
});
