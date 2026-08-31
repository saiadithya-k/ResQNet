<template>
  <div class="command-dashboard">
    <!-- 1. TOP COMMAND & STATUS BAR -->
    <header class="top-command-bar tactical-card" :class="{ 'bar-disaster-active': disasterStore.isDisasterMode }">
      <div class="cmd-identity">
        <span class="live-indicator-dot" :class="{ 'dot-disaster': disasterStore.isDisasterMode }"></span>
        <div class="cmd-titles">
          <h2>RESQNET TACTICAL COMMAND CENTER</h2>
          <span class="cmd-subtitle">SECTOR 04 JOINT OPERATIONS · LIVE INCIDENT ENGINE</span>
        </div>
      </div>

      <div class="cmd-telemetry">
        <!-- Disaster Mode Command Control -->
        <div class="telemetry-pill disaster-toggle-pill" :class="{ 'pill-danger': disasterStore.isDisasterMode }">
          <span class="t-lbl">DISASTER MODE:</span>
          <strong class="font-mono text-xs" :class="disasterStore.isDisasterMode ? 'text-red' : 'text-slate-400'">
            {{ disasterStore.isDisasterMode ? 'ACTIVE (LEVEL 3)' : 'OFF (STANDBY)' }}
          </strong>
          <button
            v-if="!disasterStore.isDisasterMode"
            class="btn-disaster-act font-mono"
            @click="handleToggleDisasterMode(true)"
          >
            ACTIVATE
          </button>
          <button
            v-else
            class="btn-disaster-deact font-mono"
            @click="handleToggleDisasterMode(false)"
          >
            DEACTIVATE
          </button>
        </div>

        <!-- Audio Mute Control -->
        <button class="btn-mute-toggle font-mono" @click="toggleAudioMute" :title="isMuted ? 'Unmute tactical audio alert' : 'Mute tactical audio alert'">
          {{ isMuted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON' }}
        </button>

        <div class="telemetry-pill">
          <span class="t-lbl">SYSTEM:</span>
          <span class="t-val text-emerald font-mono">LIVE / CONNECTED</span>
        </div>

        <div class="telemetry-pill">
          <span class="t-lbl">OPS CLOCK:</span>
          <span class="t-val text-cyan font-mono">{{ operationalTime }}</span>
        </div>
      </div>
    </header>

    <!-- DISASTER MODE ACTIVE OPERATIONAL SURGE BANNER -->
    <div v-if="disasterStore.isDisasterMode" class="disaster-surge-banner font-mono">
      <div class="surge-hdr">
        <span class="surge-icon">🚨</span>
        <strong>LEVEL 3 DISASTER STATE ACTIVE — METROPOLITAN JOINT SURGE PROTOCOL ENFORCED</strong>
      </div>
      <div class="surge-details-grid">
        <div v-if="surgeWarnings.highHospitals.length" class="surge-warning-pill warn-hosp">
          🏥 <strong>HOSPITAL SURGE ALERT:</strong>
          <span v-for="h in surgeWarnings.highHospitals" :key="h.id">
            {{ h.name }} ({{ Math.round(((h.totalBeds - h.availableBeds)/h.totalBeds)*100) }}% Beds Full)
          </span>
        </div>
        <div v-if="surgeWarnings.highShelters.length" class="surge-warning-pill warn-shelter">
          🏠 <strong>SHELTER CAPACITY ALERT:</strong>
          <span v-for="s in surgeWarnings.highShelters" :key="s.id">
            {{ s.name }} ({{ Math.round((s.currentOccupancy/s.capacity)*100) }}% Occupancy)
          </span>
        </div>
        <div class="surge-warning-pill warn-zones">
          ⚠️ <strong>EVACUATION PERIMETERS:</strong> Chemical Plume & Harbour Danger Sectors Cleared
        </div>
      </div>
    </div>

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

          <!-- Complete 11-Step Architecture-Defined Incident Lifecycle State Machine -->
          <div class="state-machine-container">
            <div class="state-header-row">
              <span class="font-mono text-xs text-slate-400 font-bold">INCIDENT LIFECYCLE STATE MACHINE</span>
              <span class="font-mono text-cyan text-xs font-bold">STATE {{ currentStepIndex + 1 }}/11</span>
            </div>

            <!-- Compact Stepper Flow -->
            <div class="lifecycle-flow-grid">
              <div
                v-for="(st, idx) in lifecycleStates"
                :key="st"
                :class="['flow-node', getStepNodeStatus(st, idx)]"
                @click="attemptStateTransition(st)"
                :title="`Click to transition to ${st}`"
              >
                <div class="node-icon-status">
                  <span v-if="isStepPassed(st, idx)">✓</span>
                  <span v-else-if="st === incidentStore.selectedIncident.status">●</span>
                  <span v-else>○</span>
                </div>
                <span class="node-label font-mono">{{ formatStateName(st) }}</span>
              </div>
            </div>

            <!-- Next Recommended Action Button & Controls -->
            <div class="next-action-strip">
              <div v-if="nextActionInfo" class="next-action-box">
                <div class="action-meta font-mono">
                  <span>NEXT VALID TRANSITION:</span>
                  <strong class="text-cyan">{{ nextActionInfo.next }}</strong>
                </div>
                <button
                  class="btn btn-primary btn-action-flow"
                  :disabled="isTransitioning"
                  @click="executeNextTransition"
                >
                  {{ isTransitioning ? 'Updating State...' : nextActionInfo.label }}
                </button>
              </div>

              <div v-else class="resolved-banner font-mono">
                ✅ INCIDENT FULLY RESOLVED & CLOSED
              </div>

              <div v-if="transitionError" class="transition-error-alert font-mono">
                ⚠️ {{ transitionError }}
              </div>
            </div>
          </div>

          <!-- Phase 5: Dedicated Responder Allocation & Dispatch Console -->
          <div class="dispatch-allocation-panel">
            <div class="dispatch-panel-header">
              <span class="font-mono text-xs text-slate-300 font-bold">⚡ TACTICAL RESPONDER DISPATCH CONSOLE</span>
              <span class="badge-mini font-mono text-emerald">{{ availableUnitsCount }} READY</span>
            </div>

            <!-- Current Assignment Status Banner -->
            <div v-if="currentAssignedUnit" class="current-assigned-badge">
              <div class="assigned-left">
                <span class="status-dot-pulse"></span>
                <div>
                  <span class="font-mono text-xs text-slate-400">CURRENTLY ASSIGNED:</span>
                  <strong class="text-emerald text-sm block font-mono">
                    {{ currentAssignedUnit.isCommunity ? '🧑‍⚕️' : currentAssignedUnit.type === 'PARAMEDIC' ? '🚑' : '🚒' }}
                    {{ currentAssignedUnit.badgeNumber }} · {{ currentAssignedUnit.name }}
                  </strong>
                </div>
              </div>
              <div class="assigned-right font-mono text-cyan">
                <span>ETA: {{ currentAssignedUnit.etaMinutes || 5 }}m</span>
              </div>
            </div>

            <!-- Available Responders Selection Cards -->
            <div class="responder-units-list">
              <div
                v-for="r in sortedResponders"
                :key="r.id"
                :class="['responder-unit-row', {
                  'selected-unit': selectedResponderId === r.id,
                  'unit-busy': r.status !== 'AVAILABLE',
                  'unit-recommended': isRecommendedUnit(r)
                }]"
                @click="r.status === 'AVAILABLE' ? selectedResponderId = r.id : null"
              >
                <div class="r-row-left">
                  <span class="r-icon">{{ r.isCommunity ? '🧑‍⚕️' : r.type === 'PARAMEDIC' ? '🚑' : '🚒' }}</span>
                  <div class="r-info">
                    <div class="r-name-row">
                      <strong class="font-mono">{{ r.badgeNumber }} · {{ r.name }}</strong>
                      <span v-if="isRecommendedUnit(r)" class="recommended-tag font-mono">RECOMMENDED</span>
                    </div>
                    <span class="r-type-meta font-mono">{{ r.type }} · Fatigue {{ r.fatigueScore }}%</span>
                  </div>
                </div>

                <div class="r-row-right">
                  <span class="r-dist font-mono">📍 {{ calculateDistance(r) }} km</span>
                  <span class="r-eta font-mono text-cyan">ETA {{ r.etaMinutes || calculateEta(r) }}m</span>
                  <StatusBadge :status="r.status" />
                </div>
              </div>
            </div>

            <!-- Dispatch Action Execution Button -->
            <div class="dispatch-trigger-box">
              <button
                class="btn btn-primary btn-dispatch-exec"
                :disabled="isDispatching || !canDispatchSelected"
                @click="executeDispatch"
              >
                <span v-if="isDispatching">⚡ Transmitting Dispatch Order...</span>
                <span v-else-if="currentAssignedUnit && currentAssignedUnit.id === selectedResponderId">
                  ✓ {{ currentAssignedUnit.badgeNumber }} Already Assigned
                </span>
                <span v-else>
                  ⚡ DISPATCH {{ getSelectedResponderBadge }}
                </span>
              </button>

              <div v-if="dispatchError" class="dispatch-error-msg font-mono">
                ⚠️ {{ dispatchError }}
              </div>
            </div>

            <!-- Phase 6: Live GPS Responder Movement Simulator -->
            <div class="gps-simulation-panel">
              <div class="gps-panel-header">
                <div class="gps-hdr-left">
                  <span class="pulse-sim-dot" :class="{ 'sim-active': simState.status === 'RUNNING' }"></span>
                  <span class="font-mono text-xs text-cyan font-bold">LIVE GPS TELEMETRY SIMULATOR</span>
                </div>
                <span class="font-mono text-xs text-slate-400">AMBULANCE A12</span>
              </div>

              <div class="gps-sim-body">
                <div class="sim-telemetry-row">
                  <span class="font-mono text-xs">STATUS: <strong :class="getSimStatusClass">{{ simState.status }}</strong></span>
                  <span class="font-mono text-xs">ETA: <strong class="text-cyan">{{ simState.etaMinutes }} MIN</strong></span>
                  <span class="font-mono text-xs">PROGRESS: <strong class="text-emerald">{{ simState.progress }}%</strong></span>
                </div>

                <!-- Simulation Progress Bar -->
                <div class="sim-progress-track">
                  <div class="sim-progress-fill" :style="{ width: simState.progress + '%' }"></div>
                </div>

                <!-- Interactive Simulation Controls -->
                <div class="sim-btn-row">
                  <button
                    v-if="simState.status === 'IDLE'"
                    class="btn btn-primary btn-sm flex-1"
                    @click="startGpsSim"
                  >
                    🚀 START GPS SIMULATION
                  </button>

                  <button
                    v-else-if="simState.status === 'RUNNING'"
                    class="btn btn-ghost btn-sm flex-1 font-mono"
                    @click="pauseGpsSim"
                  >
                    ⏸️ PAUSE SIMULATION
                  </button>

                  <button
                    v-else-if="simState.status === 'PAUSED'"
                    class="btn btn-primary btn-sm flex-1 font-mono"
                    @click="resumeGpsSim"
                  >
                    ▶️ RESUME SIMULATION
                  </button>

                  <div v-else-if="simState.status === 'COMPLETED'" class="sim-completed-tag font-mono flex-1">
                    🎯 A12 ARRIVED ON SCENE (AT TARGET)
                  </div>

                  <button
                    v-if="simState.status !== 'IDLE'"
                    class="btn btn-ghost btn-sm font-mono"
                    @click="resetGpsSim"
                    title="Reset to Base Station"
                  >
                    🔄 RESET
                  </button>
                </div>
              </div>
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
          🏥 Hospital Intel ({{ hospitalStore.hospitals.length }})
        </button>
        <button
          :class="['ops-tab-link', { active: activeSubTab === 'shelters' }]"
          @click="activeSubTab = 'shelters'"
        >
          🏠 Shelters Intel ({{ disasterStore.shelters.length }})
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

      <!-- Tab 3: Hospital Operational Intelligence -->
      <div v-if="activeSubTab === 'hospitals'" class="ops-body-view hospitals-container">
        <div class="hospitals-summary-grid">
          <div
            v-for="h in hospitalStore.hospitals"
            :key="h.id"
            :class="['hospital-summary-card', { 'card-surge-warn': ((h.totalBeds - h.availableBeds)/h.totalBeds) >= 0.8 }]"
            @click="focusHospitalOnMap(h)"
            title="Click to focus on tactical map"
          >
            <div class="h-card-header">
              <div class="h-name-box">
                <strong>{{ h.name }}</strong>
                <span class="h-loc text-slate-400 text-xs">📍 {{ h.district }}</span>
              </div>
              <div class="h-badge-box">
                <span v-if="((h.totalBeds - h.availableBeds)/h.totalBeds) >= 0.8" class="badge-surge-pill font-mono">
                  ⚠️ >80% FULL
                </span>
                <span class="font-mono text-cyan font-bold text-xs">Match: {{ h.matchScore }}%</span>
              </div>
            </div>

            <div class="h-stat-chips">
              <span class="h-chip">
                Beds: <strong>{{ h.availableBeds }}/{{ h.totalBeds }}</strong>
                <span class="occ-pct">({{ Math.round(((h.totalBeds - h.availableBeds)/h.totalBeds)*100) }}%)</span>
              </span>
              <span class="h-chip">
                ICU: <strong class="text-purple">{{ h.availableIcu }}/{{ h.totalIcu }}</strong>
              </span>
              <span class="h-chip">
                Trauma: <strong class="text-red">{{ h.availableTrauma }}/{{ h.totalTrauma }}</strong>
              </span>
              <span class="h-chip text-emerald">
                {{ h.isAccepting ? '✓ ACCEPTING' : '🛑 DIVERT' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 4: Shelters Operational Intelligence -->
      <div v-if="activeSubTab === 'shelters'" class="ops-body-view shelters-container">
        <div class="shelters-summary-grid">
          <div
            v-for="s in disasterStore.shelters"
            :key="s.id"
            :class="['shelter-summary-card', { 'card-surge-warn': (s.currentOccupancy/s.capacity) >= 0.8 }]"
          >
            <div class="s-card-header">
              <div>
                <strong>#{{ s.id }} · {{ s.name }}</strong>
                <span class="s-loc text-slate-400 text-xs block">📍 {{ s.district }}</span>
              </div>
              <span v-if="(s.currentOccupancy/s.capacity) >= 0.8" class="badge-surge-pill font-mono">
                ⚠️ >80% CAPACITY
              </span>
            </div>

            <div class="s-occupancy-bar">
              <div class="s-bar-track">
                <div
                  class="s-bar-fill"
                  :style="{ width: Math.min(100, Math.round((s.currentOccupancy/s.capacity)*100)) + '%' }"
                  :class="(s.currentOccupancy/s.capacity) >= 0.8 ? 'fill-danger' : 'fill-emerald'"
                ></div>
              </div>
              <div class="s-bar-meta font-mono text-xs">
                <span>{{ s.currentOccupancy }} / {{ s.capacity }} Occupants</span>
                <strong>{{ Math.round((s.currentOccupancy/s.capacity)*100) }}%</strong>
              </div>
            </div>

            <div class="s-supplies-row font-mono text-xs">
              <span>Food: <strong :class="s.foodSupply === 'LOW' ? 'text-red' : 'text-emerald'">{{ s.foodSupply }}</strong></span>
              <span>Water: <strong class="text-emerald">{{ s.waterSupply }}</strong></span>
              <span>Medical: <strong>{{ s.medicalStation ? '✓ READY' : 'NONE' }}</strong></span>
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
import { gpsSimulator } from '../../services/gpsSimulationService';
import { audioAlert } from '../../utils/audioAlert';
import EmergencyMap from '../../components/map/EmergencyMap.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const searchFilter = ref('');
const activeSubTab = ref('timeline');
const operationalTime = ref('');
const isMuted = ref(false);

// GPS Simulation Reactive State
const simState = ref({
  status: 'IDLE',
  progress: 0,
  etaMinutes: 5,
  index: 0
});

let clockTimer = null;
let simUnsubscribe = null;

onMounted(async () => {
  updateOperationalClock();
  clockTimer = setInterval(updateOperationalClock, 1000);

  // Subscribe to Live GPS Simulation Telemetry
  simUnsubscribe = gpsSimulator.subscribe((data) => {
    simState.value = {
      status: data.status,
      progress: data.progress,
      etaMinutes: data.etaMinutes,
      index: data.index
    };
  });

  await Promise.all([
    incidentStore.fetchIncidents(),
    responderStore.fetchResponders(),
    hospitalStore.fetchHospitals(),
    disasterStore.fetchStatus()
  ]);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (simUnsubscribe) simUnsubscribe();
  gpsSimulator.destroy();
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

function toggleAudioMute() {
  isMuted.value = audioAlert.toggleMute();
}

async function handleToggleDisasterMode(activate) {
  try {
    await disasterStore.toggleDisasterMode(activate, {
      disasterType: 'MULTI_SECTOR_CRITICAL_SURGE',
      district: 'Sector 4 Joint Metropolitan Area',
      severity: 'CRITICAL'
    });
  } catch (err) {
    alert('Failed to toggle Disaster Mode');
  }
}

// Surge Capacity Alerts (Hospitals & Shelters > 80% full)
const surgeWarnings = computed(() => {
  const highHospitals = hospitalStore.hospitals.filter(h => {
    const occRatio = (h.totalBeds - h.availableBeds) / h.totalBeds;
    return occRatio >= 0.75;
  });

  const highShelters = disasterStore.shelters.filter(s => {
    return (s.currentOccupancy / s.capacity) >= 0.80;
  });

  return { highHospitals, highShelters };
});

function getPriorityClass(score) {
  if (score >= 90) return 'score-critical';
  if (score >= 75) return 'score-high';
  return 'score-medium';
}

const isTransitioning = ref(false);
const transitionError = ref(null);

const lifecycleStates = [
  'REPORTED',
  'AI_ANALYZING',
  'VERIFIED',
  'PRIORITIZED',
  'DISPATCHING',
  'ASSIGNED',
  'EN_ROUTE',
  'ON_SCENE',
  'TRANSPORTING',
  'HOSPITAL_RECEIVED',
  'RESOLVED'
];

const nextActionTransitions = {
  'REPORTED': { next: 'VERIFIED', label: '✓ VERIFY INCIDENT', note: 'Incident verified by Command Chief' },
  'AI_ANALYZING': { next: 'VERIFIED', label: '✓ VERIFY INCIDENT', note: 'AI Analysis complete and verified' },
  'VERIFIED': { next: 'PRIORITIZED', label: '⚡ COMPUTE PRIORITY', note: 'Dynamic priority score locked' },
  'PRIORITIZED': { next: 'DISPATCHING', label: '🚨 INITIATE DISPATCH', note: 'Auto-dispatch algorithm triggered' },
  'DISPATCHING': { next: 'ASSIGNED', label: '🚑 ASSIGN RESPONDER', note: 'Unit assigned and locked' },
  'ASSIGNED': { next: 'EN_ROUTE', label: '🚀 START EN ROUTE', note: 'Unit departing station en route' },
  'EN_ROUTE': { next: 'ON_SCENE', label: '📍 MARK ON SCENE', note: 'Unit arrived at emergency site' },
  'ON_SCENE': { next: 'TRANSPORTING', label: '🏥 START TRANSPORT', note: 'Victims loaded, moving to hospital' },
  'TRANSPORTING': { next: 'HOSPITAL_RECEIVED', label: '🏨 HOSPITAL RECEIVED', note: 'Trauma team received patients' },
  'HOSPITAL_RECEIVED': { next: 'RESOLVED', label: '✅ RESOLVE INCIDENT', note: 'Emergency operations completed' },
  'RESOLVED': null
};

const currentStepIndex = computed(() => {
  const current = incidentStore.selectedIncident?.status;
  if (!current) return 0;
  const idx = lifecycleStates.indexOf(current);
  return idx !== -1 ? idx : 0;
});

const nextActionInfo = computed(() => {
  const current = incidentStore.selectedIncident?.status;
  if (!current) return null;
  return nextActionTransitions[current] || null;
});

function formatStateName(st) {
  return st.replace('_', ' ');
}

function isStepPassed(st, idx) {
  return currentStepIndex.value > idx;
}

function getStepNodeStatus(st, idx) {
  if (currentStepIndex.value > idx) return 'node-passed';
  if (st === incidentStore.selectedIncident?.status) return 'node-current';
  if (nextActionInfo.value && nextActionInfo.value.next === st) return 'node-next-valid';
  return 'node-future';
}

async function attemptStateTransition(targetState) {
  if (!incidentStore.selectedIncident || isTransitioning.value) return;
  transitionError.value = null;

  // Allow next valid transition or backward inspection
  const targetIndex = lifecycleStates.indexOf(targetState);
  if (targetIndex === -1) return;

  try {
    isTransitioning.value = true;
    await incidentStore.updateStatus(
      incidentStore.selectedIncident.id,
      targetState,
      `Operational status transitioned to ${targetState} via State Machine Console`
    );
  } catch (err) {
    transitionError.value = 'Failed to transition state: ' + (err.response?.data?.message || err.message);
  } finally {
    isTransitioning.value = false;
  }
}

async function executeNextTransition() {
  if (!nextActionInfo.value || !incidentStore.selectedIncident) return;
  const { next, note } = nextActionInfo.value;
  try {
    isTransitioning.value = true;
    transitionError.value = null;
    await incidentStore.updateStatus(incidentStore.selectedIncident.id, next, note);
  } catch (err) {
    transitionError.value = 'Failed to advance lifecycle: ' + (err.response?.data?.message || err.message);
  } finally {
    isTransitioning.value = false;
  }
}

const selectedResponderId = ref('RESP-01');
const isDispatching = ref(false);
const dispatchError = ref(null);

const availableUnitsCount = computed(() =>
  responderStore.responders.filter(r => r.status === 'AVAILABLE').length
);

const sortedResponders = computed(() => {
  return [...responderStore.responders].sort((a, b) => {
    // Sort available first
    if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
    if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
    return a.fatigueScore - b.fatigueScore;
  });
});

const getSelectedResponderBadge = computed(() => {
  const r = responderStore.responders.find(u => u.id === selectedResponderId.value);
  return r ? `${r.badgeNumber} (${r.name})` : 'UNIT';
});

const canDispatchSelected = computed(() => {
  if (!incidentStore.selectedIncident || !selectedResponderId.value) return false;
  const r = responderStore.responders.find(u => u.id === selectedResponderId.value);
  if (!r || r.status !== 'AVAILABLE') return false;
  if (currentAssignedUnit.value && currentAssignedUnit.value.id === selectedResponderId.value) return false;
  return true;
});

function isRecommendedUnit(responder) {
  if (responder.status !== 'AVAILABLE') return false;
  const inc = incidentStore.selectedIncident;
  if (!inc) return false;

  // Match recommendation based on incident type
  if ((inc.incidentType === 'HAZMAT' || inc.incidentType === 'FIRE') && responder.type === 'FIREFIGHTER') return true;
  if ((inc.incidentType === 'COLLAPSE' || inc.incidentType === 'MEDICAL') && responder.type === 'PARAMEDIC') return true;
  return responder.badgeNumber === 'AMB-A12';
}

function calculateDistance(responder) {
  const inc = incidentStore.selectedIncident;
  if (!inc || !responder.latitude) return '2.4';
  const latDiff = Math.abs(inc.latitude - responder.latitude) * 111;
  const lngDiff = Math.abs(inc.longitude - responder.longitude) * 111;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff).toFixed(1);
}

function calculateEta(responder) {
  const dist = parseFloat(calculateDistance(responder));
  return Math.max(3, Math.round(dist * 2));
}

async function executeDispatch() {
  if (!canDispatchSelected.value) return;
  try {
    isDispatching.value = true;
    dispatchError.value = null;
    await responderStore.dispatch(incidentStore.selectedIncident.id, selectedResponderId.value);
    await incidentStore.fetchIncidents();
  } catch (err) {
    dispatchError.value = 'Dispatch failed: ' + (err.response?.data?.message || err.message);
  } finally {
    isDispatching.value = false;
  }
}

// GPS Simulation Controls
const getSimStatusClass = computed(() => {
  if (simState.value.status === 'RUNNING') return 'text-emerald font-bold';
  if (simState.value.status === 'PAUSED') return 'text-amber font-bold';
  if (simState.value.status === 'COMPLETED') return 'text-cyan font-bold';
  return 'text-slate-400';
});

function startGpsSim() {
  gpsSimulator.start();
}

function pauseGpsSim() {
  gpsSimulator.pause();
}

function resumeGpsSim() {
  gpsSimulator.resume();
}

function resetGpsSim() {
  gpsSimulator.reset();
}

function focusHospitalOnMap(hosp) {
  hospitalStore.selectHospital(hosp);
}
</script>

<style scoped>
.command-dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

/* Surge Warnings on Cards */
.card-surge-warn {
  border-color: #ef4444 !important;
  background: rgba(40, 15, 20, 0.85) !important;
}

.badge-surge-pill {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #fca5a5;
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.occ-pct {
  font-size: 0.6rem;
  color: #94a3b8;
}

.shelters-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.shelter-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.s-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.s-occupancy-bar {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.s-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 3px;
  overflow: hidden;
}

.s-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.fill-danger { background: #ef4444; }
.fill-emerald { background: #10b981; }

.s-bar-meta {
  display: flex;
  justify-content: space-between;
  color: #cbd5e1;
}

.s-supplies-row {
  display: flex;
  gap: 0.75rem;
  color: #94a3b8;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.35rem;
}

/* Disaster Mode Active State */
.bar-disaster-active {
  border-color: #ef4444 !important;
  background: rgba(40, 10, 15, 0.95) !important;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.35) !important;
}

.dot-disaster {
  background: #ef4444 !important;
  box-shadow: 0 0 12px #ef4444 !important;
}

.disaster-toggle-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-disaster-act {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid #ef4444;
  color: #fca5a5;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-disaster-act:hover {
  background: #ef4444;
  color: #fff;
}

.btn-disaster-deact {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #64748b;
  color: #94a3b8;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-disaster-deact:hover {
  border-color: #ef4444;
  color: #fca5a5;
}

.btn-mute-toggle {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  color: #94a3b8;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.65rem;
  cursor: pointer;
}

.btn-mute-toggle:hover {
  color: #f8fafc;
  border-color: #38bdf8;
}

/* Disaster Surge Alert Banner */
.disaster-surge-banner {
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.6);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  animation: pulse-border 2s infinite;
}

.surge-hdr {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fca5a5;
  font-size: 0.775rem;
}

.surge-details-grid {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.surge-warning-pill {
  font-size: 0.65rem;
  padding: 0.25rem 0.55rem;
  border-radius: 5px;
}

.warn-hosp {
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.5);
  color: #d8b4fe;
}

.warn-shelter {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fcd34d;
}

.warn-zones {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

@keyframes pulse-border {
  0%, 100% { border-color: rgba(239, 68, 68, 0.6); }
  50% { border-color: rgba(239, 68, 68, 1); }
}

/* Phase 6: GPS Simulation Panel Styling */
.gps-simulation-panel {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: #090e1a;
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  margin-top: 0.25rem;
}

.gps-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gps-hdr-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pulse-sim-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}

.pulse-sim-dot.sim-active {
  background: #22d3ee;
  box-shadow: 0 0 10px #22d3ee;
  animation: pulse-dot 1s infinite;
}

.gps-sim-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sim-telemetry-row {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
}

.sim-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 3px;
  overflow: hidden;
}

.sim-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.sim-btn-row {
  display: flex;
  gap: 0.4rem;
}

.sim-completed-tag {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #67e8f9;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  text-align: center;
}

/* Dispatch Allocation Console Styling */
.dispatch-allocation-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 8px;
  padding: 0.75rem;
}

.dispatch-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  padding-bottom: 0.35rem;
}

.current-assigned-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
}

.assigned-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 1.5s infinite;
}

.responder-units-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 145px;
  overflow-y: auto;
}

.responder-unit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.responder-unit-row:hover:not(.unit-busy) {
  background: rgba(30, 41, 59, 0.9);
  border-color: #38bdf8;
}

.responder-unit-row.selected-unit {
  background: rgba(2, 132, 199, 0.25);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.responder-unit-row.unit-busy {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-row-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.r-icon {
  font-size: 1.1rem;
}

.r-info {
  display: flex;
  flex-direction: column;
}

.r-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.r-name-row strong {
  font-size: 0.75rem;
  color: #f1f5f9;
}

.recommended-tag {
  font-size: 0.5rem;
  background: rgba(234, 179, 8, 0.25);
  border: 1px solid rgba(234, 179, 8, 0.6);
  color: #fde047;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  font-weight: 700;
}

.r-type-meta {
  font-size: 0.6rem;
  color: #94a3b8;
}

.r-row-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.r-dist, .r-eta {
  font-size: 0.65rem;
}

.dispatch-trigger-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.btn-dispatch-exec {
  width: 100%;
  padding: 0.55rem;
  font-size: 0.75rem;
  font-weight: 800;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

.dispatch-error-msg {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.35rem;
  border-radius: 4px;
  font-size: 0.65rem;
}

/* State Machine Styling */
.state-machine-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 8px;
  padding: 0.75rem;
}

.state-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  padding-bottom: 0.35rem;
}

.lifecycle-flow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
}

.flow-node {
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 5px;
  padding: 0.35rem 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.flow-node:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: #38bdf8;
}

.node-icon-status {
  font-size: 0.7rem;
  font-weight: bold;
}

.node-label {
  font-size: 0.58rem;
  color: #cbd5e1;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-passed {
  border-color: #059669;
  background: rgba(16, 185, 129, 0.12);
}
.node-passed .node-icon-status { color: #10b981; }
.node-passed .node-label { color: #6ee7b7; }

.node-current {
  border-color: #0284c7;
  background: rgba(2, 132, 199, 0.25);
  box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
}
.node-current .node-icon-status { color: #38bdf8; }
.node-current .node-label { color: #f0f9ff; font-weight: 700; }

.node-next-valid {
  border-color: #eab308;
  border-style: dashed;
}
.node-next-valid .node-icon-status { color: #facc15; }
.node-next-valid .node-label { color: #fde047; }

.node-future {
  opacity: 0.55;
}
.node-future .node-icon-status { color: #64748b; }

.next-action-strip {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.5rem;
}

.next-action-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.action-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #94a3b8;
}

.btn-action-flow {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
}

.resolved-banner {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 0.5rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.transition-error-alert {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.35rem;
  border-radius: 4px;
  font-size: 0.65rem;
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
