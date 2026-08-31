<template>
  <div class="simulation-view">
    <div class="header-card tactical-card">
      <div>
        <h2>🧪 DISASTER IMPACT SIMULATOR & PRE-POSITIONING ENGINE</h2>
        <p>Run scenario-based disaster modeling to predict casualty surge, hospital demand, and pre-position emergency assets prior to escalation.</p>
      </div>
    </div>

    <div class="sim-grid">
      <!-- Left Config Controls -->
      <div class="tactical-card sim-controls">
        <div class="section-title">SIMULATION SCENARIO PARAMETERS</div>

        <div class="control-group">
          <label>Disaster Scenario Type:</label>
          <select v-model="disasterType" class="sim-input">
            <option value="FLOOD">🌊 Urban Flash Flood & River Overflow</option>
            <option value="COLLAPSE">🏢 Seismic Structural Collapse</option>
            <option value="HAZMAT">☣️ Industrial Chemical Toxic Dispersion</option>
            <option value="FIRE">🔥 Wildfire / Urban Conflagration</option>
          </select>
        </div>

        <div class="control-group">
          <label>Exposed Population: <span class="val-pill">{{ population.toLocaleString() }} Citizens</span></label>
          <input type="range" v-model.number="population" min="20000" max="500000" step="10000" class="slider" />
        </div>

        <div class="control-group">
          <label>Predicted Severity Rating:</label>
          <div class="severity-radios">
            <button
              v-for="s in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']"
              :key="s"
              type="button"
              :class="['sev-btn', { active: severity === s }]"
              @click="severity = s"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-run" @click="runSimulation" :disabled="loading">
          ⚡ {{ loading ? 'Computing Impact Models...' : 'Run Disaster Impact Simulation' }}
        </button>
      </div>

      <!-- Right Projected Impact Results -->
      <div class="tactical-card sim-results">
        <div class="section-title">SIMULATED CASUALTY & RESOURCE PROJECTIONS</div>

        <div v-if="results" class="results-content">
          <!-- KPI Summary Cards -->
          <div class="results-kpis">
            <div class="res-kpi bg-red">
              <span class="label">EXPECTED INCIDENTS</span>
              <span class="val">{{ results.impactProjection.expectedIncidents }}</span>
            </div>
            <div class="res-kpi bg-amber">
              <span class="label">CRITICAL TRAUMA</span>
              <span class="val">{{ results.impactProjection.criticalInjuries }}</span>
            </div>
            <div class="res-kpi bg-blue">
              <span class="label">DISPLACED POPULATION</span>
              <span class="val">{{ results.impactProjection.displacedPeople.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Required Resources Grid -->
          <div class="req-grid">
            <h4>REQUIRED EMERGENCY ASSETS (ESTIMATED):</h4>
            <div class="asset-pills">
              <div class="asset-pill">
                <span>🚑 ALS Ambulances:</span>
                <strong>{{ results.resourceRequirements.ambulancesNeeded }} Units</strong>
              </div>
              <div class="asset-pill">
                <span>🏥 ICU Beds:</span>
                <strong>{{ results.resourceRequirements.icuBedsNeeded }} Beds</strong>
              </div>
              <div class="asset-pill">
                <span>🧑‍🚒 Responders:</span>
                <strong>{{ results.resourceRequirements.respondersNeeded }} Personnel</strong>
              </div>
              <div class="asset-pill">
                <span>🏠 Relief Shelters:</span>
                <strong>{{ results.resourceRequirements.sheltersNeeded }} Locations</strong>
              </div>
              <div v-if="results.resourceRequirements.emergencyBoatsNeeded > 0" class="asset-pill">
                <span>🚤 Rescue Boats:</span>
                <strong>{{ results.resourceRequirements.emergencyBoatsNeeded }} Boats</strong>
              </div>
            </div>
          </div>

          <!-- Pre-positioning Tactical Advice -->
          <div class="advice-box">
            <h4>🧠 AI PRE-POSITIONING TACTICAL ADVICE:</h4>
            <ul>
              <li v-for="(adv, idx) in results.prepositioningAdvice" :key="idx">
                ✓ {{ adv }}
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="empty-state">
          Configure scenario parameters on the left and click "Run Simulation" to generate operational forecasts.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDisasterStore } from '../../stores/disasterStore';

const disasterStore = useDisasterStore();
const disasterType = ref('FLOOD');
const population = ref(100000);
const severity = ref('HIGH');
const loading = ref(false);
const results = ref(null);

onMounted(() => {
  runSimulation();
});

async function runSimulation() {
  loading.value = true;
  results.value = await disasterStore.runSimulation({
    disasterType: disasterType.value,
    population: population.value,
    severity: severity.value
  });
  loading.value = false;
}
</script>

<style scoped>
.simulation-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-card {
  padding: 1rem 1.25rem;
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
}

.sim-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
}

.sim-controls, .sim-results {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.val-pill {
  font-family: var(--font-mono);
  color: #60a5fa;
  font-weight: 700;
}

.sim-input {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.slider {
  accent-color: #3b82f6;
  cursor: pointer;
}

.severity-radios {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}

.sev-btn {
  background: #0f172a;
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 0.4rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}

.sev-btn.active {
  background: #2563eb;
  color: white;
  border-color: #60a5fa;
}

.btn-run {
  margin-top: 0.5rem;
  width: 100%;
}

.results-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.res-kpi {
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.bg-red { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); }
.bg-amber { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); }
.bg-blue { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); }

.res-kpi .label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.res-kpi .val {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
}

.req-grid h4, .advice-box h4 {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.asset-pills {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.asset-pill {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 0.775rem;
}

.asset-pill strong {
  color: #38bdf8;
  font-family: var(--font-mono);
}

.advice-box {
  margin-top: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.875rem;
  border-radius: 8px;
}

.advice-box ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #e2e8f0;
}
</style>
