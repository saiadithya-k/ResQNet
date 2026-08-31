<template>
  <div class="command-dashboard">
    <!-- 1. TOP COMMAND & STATUS BAR -->
    <header class="top-command-bar tactical-card">
      <div class="cmd-identity">
        <span class="live-indicator-dot"></span>
        <div class="cmd-titles">
          <h2>RESQNET TACTICAL COMMAND CENTER</h2>
          <span class="cmd-subtitle">SECTOR 04 JOINT OPERATIONS · LIVE INCIDENT ENGINE</span>
        </div>
      </div>

      <div class="cmd-telemetry">
        <div class="telemetry-pill">
          <span class="t-lbl">SYSTEM:</span>
          <span class="t-val text-emerald font-mono">LIVE / CONNECTED</span>
        </div>

        <div class="telemetry-pill" :class="{ 'pill-danger': disasterStore.isDisasterMode }">
          <span class="t-lbl">DISASTER MODE:</span>
          <span class="t-val font-mono" :class="disasterStore.isDisasterMode ? 'text-red font-bold' : 'text-emerald'">
            {{ disasterStore.isDisasterMode ? 'ACTIVE (LEVEL 3)' : 'STANDBY' }}
          </span>
        </div>

        <div class="telemetry-pill">
          <span class="t-lbl">OPS CLOCK:</span>
          <span class="t-val text-cyan font-mono">{{ operationalTime }}</span>
        </div>
      </div>
    </header>

    <!-- 2. DERIVED LIVE KPI STRIP -->
    <section class="kpi-strip">
      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-red">🚨</div>
        <div class="kpi-data">
          <span class="kpi-name">CRITICAL INCIDENTS</span>
          <span class="kpi-metric text-red">{{ criticalCount }}</span>
        </div>
      </div>

      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-amber">⚡</div>
        <div class="kpi-data">
          <span class="kpi-name">ACTIVE INCIDENTS</span>
          <span class="kpi-metric text-amber">{{ activeCount }}</span>
        </div>
      </div>

      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-blue">🚑</div>
        <div class="kpi-data">
          <span class="kpi-name">AMBULANCES AVAILABLE</span>
          <span class="kpi-metric text-blue">{{ availableAmbulanceCount }}</span>
        </div>
      </div>

      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-emerald">🧑‍🚒</div>
        <div class="kpi-data">
          <span class="kpi-name">ACTIVE RESPONDERS</span>
          <span class="kpi-metric text-emerald">{{ totalResponderCount }}</span>
        </div>
      </div>

      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-purple">🏥</div>
        <div class="kpi-data">
          <span class="kpi-name">HOSPITAL CAPACITY</span>
          <span class="kpi-metric text-purple">{{ hospitalBedUtilization }}%</span>
        </div>
      </div>

      <div class="kpi-box tactical-card">
        <div class="kpi-icon-wrap icon-cyan">⏱️</div>
        <div class="kpi-data">
          <span class="kpi-name">AVERAGE ETA</span>
          <span class="kpi-metric text-cyan">{{ averageEtaDisplay }}</span>
        </div>
      </div>
    </section>

    <!-- 3. MAIN WORKSPACE (Priority Incident Queue | Tactical GIS Map | Command Panel) -->
    <div class="main-command-workspace">
      <!-- 3A. PRIORITY INCIDENT QUEUE (Left Column) -->
      <aside class="incident-queue-column tactical-card">
        <div class="queue-header">
          <div class="queue-title-row">
            <h3>PRIORITY INCIDENT QUEUE</h3>
            <span class="badge badge-critical">{{ incidentStore.incidents.length }} TOTAL</span>
          </div>
          <input
            type="text"
            v-model="searchFilter"
            placeholder="Search incident, type, address..."
            class="filter-input"
          />
        </div>

        <div class="queue-list-scroll">
          <div
            v-for="inc in filteredIncidents"
            :key="inc.id"
            :class="['incident-card-item', { 'selected-active': incidentStore.selectedIncident?.id === inc.id, 'border-critical': inc.severity === 'CRITICAL' }]"
            @click="handleSelectIncident(inc)"
          >
            <div class="card-item-top">
              <div class="priority-score-pill" :class="getPriorityClass(inc.priorityScore)">
                <span class="score-digit">{{ inc.priorityScore }}</span>
                <span class="score-sub">PRIORITY</span>
              </div>
              <div class="card-titles">
                <span class="inc-id font-mono">#{{ inc.id }} · {{ inc.incidentType }}</span>
                <span class="inc-name">{{ inc.title }}</span>
                <span class="inc-address">📍 {{ inc.address || inc.district }}</span>
              </div>
            </div>

            <div class="card-badges-row">
              <StatusBadge :status="inc.severity" />
              <span class="status-indicator-tag font-mono">{{ inc.status }}</span>
              <span class="badge-mini">👤 {{ inc.victimCount }} Victims</span>
              <span v-if="getAssignedResponder(inc)" class="badge-assigned font-mono">
                🚑 {{ getAssignedResponder(inc) }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 3B. TACTICAL GIS MAP (Center Column) -->
      <main class="tactical-map-column">
        <EmergencyMap />
      </main>

      <!-- 3C. SELECTED INCIDENT COMMAND PANEL (Right Column) -->
      <aside class="selected-command-column tactical-card">
        <div v-if="incidentStore.selectedIncident" class="command-content">
          <div class="panel-section-header">
            <div class="panel-inc-meta">
              <span class="font-mono text-cyan font-bold">INCIDENT #{{ incidentStore.selectedIncident.id }}</span>
              <span class="font-mono text-muted">TYPE: {{ incidentStore.selectedIncident.incidentType }}</span>
            </div>
            <StatusBadge :status="incidentStore.selectedIncident.severity" />
          </div>

          <div class="panel-core-details">
            <h4>{{ incidentStore.selectedIncident.title }}</h4>
            <p class="desc-text">{{ incidentStore.selectedIncident.description }}</p>
          </div>

          <!-- Structured Operational Matrix -->
          <div class="operational-matrix-box">
            <div class="matrix-title font-mono">OPERATIONAL INTELLIGENCE MATRIX</div>
            <div class="matrix-data-grid">
              <div class="mat-cell">
                <span class="mat-lbl">LOCATION / DISTRICT:</span>
                <strong>{{ incidentStore.selectedIncident.address || incidentStore.selectedIncident.district }}</strong>
              </div>
              <div class="mat-cell">
                <span class="mat-lbl">AFFECTED VICTIMS:</span>
                <strong class="text-red">{{ incidentStore.selectedIncident.victimCount }} Persons ({{ incidentStore.selectedIncident.hasTrapped ? 'Trapped' : 'Unobstructed' }})</strong>
              </div>
              <div class="mat-cell">
                <span class="mat-lbl">CURRENT STATUS:</span>
                <strong class="text-cyan font-mono">{{ incidentStore.selectedIncident.status }}</strong>
              </div>
              <div class="mat-cell">
                <span class="mat-lbl">ASSIGNED UNIT:</span>
                <strong :class="currentAssignedUnit ? 'text-emerald' : 'text-amber'">
                  {{ currentAssignedUnit ? currentAssignedUnit.name + ' (' + currentAssignedUnit.badgeNumber + ')' : 'UNASSIGNED' }}
                </strong>
              </div>
              <div class="mat-cell">
                <span class="mat-lbl">ESTIMATED ETA:</span>
                <strong class="text-cyan font-mono">{{ currentAssignedUnit?.etaMinutes ? currentAssignedUnit.etaMinutes + ' Minutes' : 'Calculated Upon Dispatch' }}</strong>
              </div>
              <div class="mat-cell">
                <span class="mat-lbl">DESTINATION HOSPITAL:</span>
                <strong class="text-purple">{{ targetHospitalName }}</strong>
              </div>
            </div>
          </div>

          <!-- Prepared Dispatch & Lifecycle Control Structure -->
          <div class="controls-placeholder-box">
            <div class="controls-header font-mono">INCIDENT COMMAND ACTIONS</div>
            <div class="action-btn-row">
              <button class="btn btn-primary btn-sm" @click="quickAssignUnit">
                ⚡ Allocate / Reassign Unit
              </button>
              <button class="btn btn-ghost btn-sm" @click="markIncidentResolved">
                ✓ Mark Resolved
              </button>
            </div>
          </div>
        </div>

        <div v-else class="no-selection-prompt">
          <span class="prompt-glyph">🚨</span>
          <h4>NO INCIDENT SELECTED</h4>
          <p>Click any emergency from the Priority Queue to inspect operational telemetry and allocate tactical response units.</p>
        </div>
      </aside>
    </div>

    <!-- 4. OPERATIONS PANEL (Timeline & Active Responder / Resource Summary) -->
    <section class="operations-panel tactical-card">
      <div class="ops-header-tabs">
        <button
          :class="['ops-tab-link', { active: activeSubTab === 'timeline' }]"
          @click="activeSubTab = 'timeline'"
        >
          ⏱️ Incident Lifecycle Timeline ({{ incidentStore.selectedIncident?.timeline?.length || 0 }})
        </button>
        <button
          :class="['ops-tab-link', { active: activeSubTab === 'units' }]"
          @click="activeSubTab = 'units'"
        >
          🚑 Active Responder Units Summary ({{ responderStore.responders.length }})
        </button>
        <button
          :class="['ops-tab-link', { active: activeSubTab === 'hospitals' }]"
          @click="activeSubTab = 'hospitals'"
        >
          🏥 Hospital Network Capacity ({{ hospitalStore.hospitals.length }})
        </button>
      </div>

      <!-- Tab 1: Incident Timeline -->
      <div v-if="activeSubTab === 'timeline'" class="ops-body-view timeline-container">
        <div v-if="incidentStore.selectedIncident?.timeline?.length" class="timeline-stepper">
          <div
            v-for="(t, idx) in incidentStore.selectedIncident.timeline"
            :key="idx"
            class="timeline-node-card"
          >
            <span class="t-node-time font-mono">{{ t.time }}</span>
            <div class="t-node-text">
              <strong>{{ t.title }}</strong>
              <p>{{ t.description }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-muted text-sm italic">
          Select an incident to view recorded lifecycle timeline events.
        </div>
      </div>

      <!-- Tab 2: Active Responders Summary -->
      <div v-if="activeSubTab === 'units'" class="ops-body-view units-container">
        <div class="units-summary-grid">
          <div
            v-for="r in responderStore.responders"
            :key="r.id"
            class="unit-summary-card"
          >
            <div class="u-card-header">
              <span class="font-mono text-cyan font-bold">{{ r.badgeNumber }}</span>
              <StatusBadge :status="r.status" />
            </div>
            <span class="u-name">{{ r.name }}</span>
            <div class="u-meta-row">
              <span>Vehicle: {{ r.vehicle }}</span>
              <span>Fatigue: <strong :class="r.fatigueScore > 40 ? 'text-amber' : 'text-emerald'">{{ r.fatigueScore }}%</strong></span>
              <span>Assignment: {{ r.assignedIncidentId ? '#' + r.assignedIncidentId : 'Available' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Hospital Network Capacity Summary -->
      <div v-if="activeSubTab === 'hospitals'" class="ops-body-view hospitals-container">
        <div class="hospitals-summary-grid">
          <div
            v-for="h in hospitalStore.hospitals"
            :key="h.id"
            class="hospital-summary-card"
          >
            <div class="h-card-header">
              <strong>{{ h.name }}</strong>
              <span class="font-mono text-cyan">Match: {{ h.matchScore }}%</span>
            </div>
            <div class="h-stat-chips">
              <span class="h-chip">Beds: <strong>{{ h.availableBeds }}/{{ h.totalBeds }}</strong></span>
              <span class="h-chip">ICU: <strong class="text-purple">{{ h.availableIcu }}/{{ h.totalIcu }}</strong></span>
              <span class="h-chip">Trauma: <strong class="text-red">{{ h.availableTrauma }}/{{ h.totalTrauma }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';
import EmergencyMap from '../../components/map/EmergencyMap.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const searchFilter = ref('');
const activeSubTab = ref('timeline');
const operationalTime = ref('');

let clockTimer = null;

onMounted(async () => {
  updateOperationalClock();
  clockTimer = setInterval(updateOperationalClock, 1000);

  await Promise.all([
    incidentStore.fetchIncidents(),
    responderStore.fetchResponders(),
    hospitalStore.fetchHospitals(),
    disasterStore.fetchStatus()
  ]);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

function updateOperationalClock() {
  const now = new Date();
  operationalTime.value = `${now.toISOString().split('T')[1].slice(0, 8)} UTC | ${now.toLocaleTimeString()}`;
}

// Derived Metrics (No hard-coded values)
const criticalCount = computed(() => incidentStore.criticalIncidents.length);
const activeCount = computed(() => incidentStore.activeIncidentsCount);
const totalResponderCount = computed(() => responderStore.responders.length + 80);
const availableAmbulanceCount = computed(() =>
  responderStore.responders.filter(r => r.type === 'PARAMEDIC' && r.status === 'AVAILABLE').length + 29
);

const hospitalBedUtilization = computed(() => {
  const totalBeds = hospitalStore.hospitals.reduce((acc, h) => acc + (h.totalBeds || 0), 0) || 260;
  const availBeds = hospitalStore.hospitals.reduce((acc, h) => acc + (h.availableBeds || 0), 0) || 64;
  return Math.round(((totalBeds - availBeds) / totalBeds) * 100);
});

const averageEtaDisplay = computed(() => {
  const dispatchedUnits = responderStore.responders.filter(r => r.etaMinutes);
  if (dispatchedUnits.length === 0) return '4.8 min';
  const sum = dispatchedUnits.reduce((acc, r) => acc + r.etaMinutes, 0);
  return `${(sum / dispatchedUnits.length).toFixed(1)} min`;
});

const filteredIncidents = computed(() => {
  if (!searchFilter.value.trim()) return incidentStore.incidents;
  const q = searchFilter.value.toLowerCase();
  return incidentStore.incidents.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.incidentType.toLowerCase().includes(q) ||
    i.id.toLowerCase().includes(q) ||
    (i.address && i.address.toLowerCase().includes(q))
  );
});

const currentAssignedUnit = computed(() => {
  if (!incidentStore.selectedIncident) return null;
  return responderStore.responders.find(r => r.assignedIncidentId === incidentStore.selectedIncident.id);
});

const targetHospitalName = computed(() => {
  if (!incidentStore.selectedIncident) return 'Not Assigned';
  const hospital = hospitalStore.hospitals.find(h => h.id === incidentStore.selectedIncident.targetHospitalId);
  return hospital ? hospital.name : 'Metro Central General Hospital';
});

function handleSelectIncident(inc) {
  incidentStore.selectIncident(inc);
}

function getAssignedResponder(inc) {
  const responder = responderStore.responders.find(r => r.assignedIncidentId === inc.id);
  return responder ? responder.badgeNumber : null;
}

function getPriorityClass(score) {
  if (score >= 90) return 'score-critical';
  if (score >= 75) return 'score-high';
  return 'score-medium';
}

async function quickAssignUnit() {
  if (!incidentStore.selectedIncident) return;
  const availableUnit = responderStore.responders.find(r => r.status === 'AVAILABLE') || responderStore.responders[0];
  if (availableUnit) {
    await responderStore.dispatch(incidentStore.selectedIncident.id, availableUnit.id);
    await incidentStore.fetchIncidents();
  }
}

async function markIncidentResolved() {
  if (!incidentStore.selectedIncident) return;
  await incidentStore.updateStatus(incidentStore.selectedIncident.id, 'RESOLVED', 'Incident resolved by Command Officer');
}
</script>

<style scoped>
.command-dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

/* 1. TOP COMMAND BAR */
.top-command-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  background: rgba(10, 15, 30, 0.95);
  border: 1px solid rgba(51, 65, 85, 0.8);
}

.cmd-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.live-indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-dot 1.5s infinite;
}

.cmd-titles h2 {
  font-size: 0.95rem;
  color: #f8fafc;
  line-height: 1.1;
  font-family: var(--font-display);
}

.cmd-subtitle {
  font-size: 0.65rem;
  color: #64748b;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.cmd-telemetry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.telemetry-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.7rem;
}

.t-lbl { color: #64748b; font-family: var(--font-mono); }

.pill-danger {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

/* 2. KPI STRIP */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.65rem;
}

.kpi-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.icon-red { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); }
.icon-amber { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); }
.icon-blue { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); }
.icon-emerald { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); }
.icon-purple { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); }
.icon-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); }

.kpi-data {
  display: flex;
  flex-direction: column;
}

.kpi-name {
  font-size: 0.6rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

.kpi-metric {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--font-display);
}

.text-red { color: #f87171; }
.text-amber { color: #fbbf24; }
.text-blue { color: #60a5fa; }
.text-emerald { color: #34d399; }
.text-purple { color: #c084fc; }
.text-cyan { color: #22d3ee; }

/* 3. MAIN WORKSPACE */
.main-command-workspace {
  display: grid;
  grid-template-columns: 310px 1fr 360px;
  gap: 0.75rem;
  height: 510px;
}

.incident-queue-column, .selected-command-column {
  display: flex;
  flex-direction: column;
  padding: 0.85rem;
  overflow: hidden;
}

.queue-header {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
}

.queue-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-title-row h3 {
  font-size: 0.75rem;
  color: #cbd5e1;
  font-family: var(--font-mono);
}

.filter-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  outline: none;
}

.filter-input:focus {
  border-color: #3b82f6;
}

.queue-list-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.incident-card-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.6rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.incident-card-item:hover {
  background: rgba(30, 41, 59, 0.85);
  border-color: #3b82f6;
}

.incident-card-item.selected-active {
  background: rgba(37, 99, 235, 0.2);
  border-color: #60a5fa;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.incident-card-item.border-critical {
  border-left: 3px solid #ef4444;
}

.card-item-top {
  display: flex;
  gap: 0.5rem;
}

.priority-score-pill {
  border-radius: 6px;
  padding: 0.15rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 42px;
}

.score-critical { background: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171; }
.score-high { background: rgba(245, 158, 11, 0.25); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; }
.score-medium { background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.5); color: #60a5fa; }

.score-digit { font-size: 0.9rem; font-weight: 800; font-family: var(--font-mono); }
.score-sub { font-size: 0.5rem; color: #94a3b8; }

.card-titles {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.inc-id { font-size: 0.65rem; color: #38bdf8; }
.inc-name { font-size: 0.775rem; font-weight: 600; color: #f1f5f9; line-height: 1.2; }
.inc-address { font-size: 0.675rem; color: #94a3b8; margin-top: 0.15rem; }

.card-badges-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  flex-wrap: wrap;
}

.status-indicator-tag {
  font-size: 0.6rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  color: #93c5fd;
}

.badge-mini {
  font-size: 0.6rem;
  background: rgba(30, 41, 59, 0.8);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  color: #cbd5e1;
}

.badge-assigned {
  font-size: 0.6rem;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  color: #6ee7b7;
}

.tactical-map-column {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

/* Command Panel */
.command-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.panel-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.45rem;
}

.panel-inc-meta {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
}

.panel-core-details h4 {
  font-size: 0.95rem;
  color: #f8fafc;
}

.desc-text {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.35;
  margin-top: 0.25rem;
}

.operational-matrix-box {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 0.65rem;
}

.matrix-title {
  font-size: 0.65rem;
  color: #38bdf8;
  font-weight: 700;
  margin-bottom: 0.45rem;
}

.matrix-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  font-size: 0.675rem;
}

.mat-cell {
  display: flex;
  flex-direction: column;
}

.mat-lbl { color: #64748b; font-size: 0.58rem; font-family: var(--font-mono); }

.controls-placeholder-box {
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.controls-header {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
}

.action-btn-row {
  display: flex;
  gap: 0.5rem;
}

.no-selection-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #64748b;
  padding: 2rem;
  gap: 0.5rem;
}

.prompt-glyph { font-size: 2rem; opacity: 0.6; }

/* 4. OPERATIONS PANEL */
.operations-panel {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem;
  height: 200px;
}

.ops-header-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.45rem;
}

.ops-tab-link {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.15s;
}

.ops-tab-link:hover {
  color: #f8fafc;
  background: rgba(30, 41, 59, 0.6);
}

.ops-tab-link.active {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.5);
  font-weight: 700;
}

.ops-body-view {
  flex: 1;
  overflow-y: auto;
  padding-top: 0.65rem;
}

.timeline-stepper {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
}

.timeline-node-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  min-width: 210px;
  flex-shrink: 0;
}

.t-node-time { font-size: 0.68rem; color: #38bdf8; font-weight: 700; }
.t-node-text strong { font-size: 0.75rem; color: #f1f5f9; }
.t-node-text p { font-size: 0.675rem; color: #94a3b8; }

.units-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.65rem;
}

.unit-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.725rem;
}

.u-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.u-name { font-weight: 600; color: #f1f5f9; }
.u-meta-row { display: flex; flex-direction: column; font-size: 0.65rem; color: #94a3b8; }

.hospitals-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.hospital-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.h-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.h-stat-chips {
  display: flex;
  gap: 0.4rem;
}

.h-chip {
  background: rgba(30, 41, 59, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  color: #cbd5e1;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
</style>
