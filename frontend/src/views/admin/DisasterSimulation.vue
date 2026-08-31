<template>
  <div class="simulation-view">
    <div class="header-card tactical-card">
      <div class="hdr-text">
        <h2>🧪 DISASTER IMPACT SIMULATOR & PRE-POSITIONING ENGINE</h2>
        <p>Run predictive scenario-based disaster modeling to forecast casualty surge, hospital/shelter demand, and compute resource deficits prior to emergency escalation.</p>
      </div>
      <div class="sandbox-badge font-mono">
        <span class="pulse-sandbox-dot"></span>
        <span>SANDBOX PROJECTION MODE</span>
      </div>
    </div>

    <div class="sim-grid">
      <!-- Left Config Controls -->
      <div class="tactical-card sim-controls">
        <div class="section-title font-mono">1. SIMULATION SCENARIO CONFIGURATION</div>

        <div class="control-group">
          <label>Disaster Scenario Type:</label>
          <select v-model="disasterType" class="sim-input font-mono">
            <option value="FLOOD">🌊 Urban Flash Flood & River Inundation</option>
            <option value="EARTHQUAKE">🏢 Seismic Structural Collapse (M7.2)</option>
            <option value="HAZMAT">☣️ Industrial Toxic Chemical Dispersion</option>
            <option value="CYCLONE">🌪️ Category 4 Coastal Cyclone & Surge</option>
            <option value="FIRE">🔥 Urban Conflagration / Wildfire Front</option>
          </select>
        </div>

        <div class="control-group">
          <div class="pop-label-row">
            <label>Exposed Population:</label>
            <span class="val-pill font-mono">{{ population.toLocaleString() }} Citizens</span>
          </div>
          <input
            type="range"
            v-model.number="population"
            min="20000"
            max="500000"
            step="10000"
            class="slider"
          />
          <div class="slider-limits font-mono">
            <span>20k</span>
            <span>250k</span>
            <span>500k</span>
          </div>
        </div>

        <div class="control-group">
          <label>Predicted Severity Rating:</label>
          <div class="severity-radios">
            <button
              v-for="s in ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']"
              :key="s"
              type="button"
              :class="['sev-btn', 'font-mono', { active: severity === s }]"
              @click="severity = s"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <div class="sim-actions-row">
          <button class="btn btn-primary btn-run flex-1 font-mono" @click="runSimulation" :disabled="loading">
            ⚡ {{ loading ? 'Simulating...' : 'RUN SIMULATION' }}
          </button>
          <button class="btn btn-ghost btn-reset font-mono" @click="resetParameters" :disabled="loading" title="Reset parameters to default">
            ↺ RESET
          </button>
        </div>
      </div>

      <!-- Right Projected Impact Results -->
      <div class="tactical-card sim-results">
        <div class="section-title font-mono">2. PREDICTIVE IMPACT & RESOURCE REQUIREMENTS</div>

        <div v-if="results" class="results-content">
          <!-- Sandbox Disclaimer -->
          <div class="sandbox-disclaimer font-mono">
            ⚠️ <strong>PROJECTION NOTICE:</strong> Figures below are predictive estimates derived from epidemiological and disaster physics models. Current real-time incidents are unaffected.
          </div>

          <!-- KPI Summary Cards -->
          <div class="results-kpis">
            <div class="res-kpi bg-red">
              <span class="label font-mono">PROJECTED INCIDENTS</span>
              <span class="val font-mono">{{ results.impactProjection.expectedIncidents }}</span>
            </div>
            <div class="res-kpi bg-amber">
              <span class="label font-mono">CRITICAL TRAUMA</span>
              <span class="val font-mono">{{ results.impactProjection.criticalInjuries }}</span>
            </div>
            <div class="res-kpi bg-blue">
              <span class="label font-mono">DISPLACED CITIZENS</span>
              <span class="val font-mono">{{ results.impactProjection.displacedPeople.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Required Resources Grid -->
          <div class="req-grid">
            <h4 class="font-mono text-cyan">PROJECTED ASSET DEMAND VS LIVE INVENTORY:</h4>
            <div class="asset-pills">
              <div class="asset-pill">
                <span>🚑 ALS Ambulances:</span>
                <div>
                  <strong class="text-cyan font-mono">{{ results.resourceRequirements.ambulancesNeeded }} Units</strong>
                  <span v-if="results.inventoryDeficits?.ambulanceDeficit > 0" class="deficit-tag font-mono">
                    (-{{ results.inventoryDeficits.ambulanceDeficit }} deficit)
                  </span>
                </div>
              </div>
              <div class="asset-pill">
                <span>🏥 ICU Beds:</span>
                <div>
                  <strong class="text-purple font-mono">{{ results.resourceRequirements.icuBedsNeeded }} Beds</strong>
                  <span v-if="results.inventoryDeficits?.icuDeficit > 0" class="deficit-tag font-mono">
                    (-{{ results.inventoryDeficits.icuDeficit }} deficit)
                  </span>
                </div>
              </div>
              <div class="asset-pill">
                <span>🧑‍🚒 Responders:</span>
                <div>
                  <strong class="text-emerald font-mono">{{ results.resourceRequirements.respondersNeeded }} Staff</strong>
                  <span v-if="results.inventoryDeficits?.responderDeficit > 0" class="deficit-tag font-mono">
                    (-{{ results.inventoryDeficits.responderDeficit }} deficit)
                  </span>
                </div>
              </div>
              <div class="asset-pill">
                <span>🏠 Relief Shelters:</span>
                <div>
                  <strong class="text-amber font-mono">{{ results.resourceRequirements.sheltersNeeded }} Sites</strong>
                  <span v-if="results.inventoryDeficits?.shelterDeficit > 0" class="deficit-tag font-mono">
                    (-{{ results.inventoryDeficits.shelterDeficit }} deficit)
                  </span>
                </div>
              </div>
              <div v-if="results.resourceRequirements.emergencyBoatsNeeded > 0" class="asset-pill">
                <span>🚤 Rescue Boats:</span>
                <strong class="text-cyan font-mono">{{ results.resourceRequirements.emergencyBoatsNeeded }} Boats</strong>
              </div>
              <div v-if="results.resourceRequirements.fireUnitsNeeded > 0" class="asset-pill">
                <span>🚒 Fire & Hazmat Engines:</span>
                <strong class="text-amber font-mono">{{ results.resourceRequirements.fireUnitsNeeded }} Engines</strong>
              </div>
            </div>
          </div>

          <!-- Pre-positioning Tactical Advice -->
          <div class="advice-box">
            <h4 class="font-mono text-emerald">🧠 TACTICAL PRE-POSITIONING DIRECTIVES:</h4>
            <ul>
              <li v-for="(adv, idx) in results.prepositioningAdvice" :key="idx" class="font-mono">
                {{ adv }}
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="empty-state font-mono">
          <span>⚡ Select disaster scenario parameters on the left and execute simulation.</span>
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
  // Ensure valid bounded numerical inputs
  const popVal = Math.min(500000, Math.max(20000, Number(population.value) || 100000));
  population.value = popVal;

  results.value = await disasterStore.runSimulation({
    disasterType: disasterType.value,
    population: popVal,
    severity: severity.value
  });
  loading.value = false;
}

function resetParameters() {
  disasterType.value = 'FLOOD';
  population.value = 100000;
  severity.value = 'HIGH';
  runSimulation();
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
}

.sandbox-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.5);
  color: #d8b4fe;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
}

.pulse-sandbox-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a855f7;
  box-shadow: 0 0 10px #a855f7;
  animation: pulse-dot 1.5s infinite;
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

.pop-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-limits {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: #64748b;
}

.sim-actions-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-reset {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #475569;
  color: #94a3b8;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-reset:hover {
  border-color: #cbd5e1;
  color: #f8fafc;
}

.sandbox-disclaimer {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fcd34d;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.65rem;
  margin-bottom: 0.75rem;
}

.deficit-tag {
  color: #ef4444;
  font-size: 0.65rem;
  margin-left: 0.35rem;
  font-weight: 700;
}
</style>
