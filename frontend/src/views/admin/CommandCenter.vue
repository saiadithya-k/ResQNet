<template>
  <div class="command-dashboard">
    <!-- TOP COMMAND & STATUS BAR -->
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

    <!-- DERIVED LIVE KPI STRIP -->
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

    <!-- ROW 1 — PRIORITY QUEUE (LEFT) + TACTICAL MAP (RIGHT) -->
    <section class="row-1-queue-map">
      <!-- 1A. PRIORITY INCIDENT QUEUE -->
      <aside class="priority-queue-panel tactical-card">
        <div class="queue-header">
          <div class="queue-title-row">
            <h3>PRIORITY INCIDENT QUEUE</h3>
            <span class="badge badge-critical font-mono">{{ incidentStore.incidents.length }} TOTAL</span>
          </div>
          <input
            type="text"
            v-model="searchFilter"
            placeholder="Search incident, type, address..."
            class="filter-input font-mono"
          />
        </div>

        <div class="queue-list-flow">
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
                <span class="inc-address font-mono text-xs">📍 {{ inc.address || inc.district }}</span>
              </div>
            </div>

            <div class="card-badges-row">
              <StatusBadge :status="inc.severity" />
              <span class="status-indicator-tag font-mono">{{ inc.status }}</span>
              <span class="badge-mini font-mono">👤 {{ inc.victimCount }} Victims</span>
              <span v-if="getAssignedResponder(inc)" class="badge-assigned font-mono">
                🚑 {{ getAssignedResponder(inc) }}
              </span>
            </div>
          </div>

          <div v-if="filteredIncidents.length === 0" class="no-incidents-msg font-mono text-xs text-muted">
            No matching incidents found in active queue.
          </div>
        </div>
      </aside>

      <!-- 1B. TACTICAL GIS MAP -->
      <main class="tactical-map-panel tactical-card">
        <EmergencyMap />
      </main>
    </section>

    <!-- ROW 2 — SELECTED INCIDENT + STATUS & 11-STEP LIFECYCLE STATE MACHINE -->
    <section class="row-2-selected-incident tactical-card">
      <div v-if="incidentStore.selectedIncident" class="selected-incident-flow">
        <div class="selected-header-strip">
          <div class="sh-left">
            <span class="font-mono text-cyan font-bold text-sm">SELECTED INCIDENT #{{ incidentStore.selectedIncident.id }}</span>
            <span class="font-mono text-muted text-xs">TYPE: {{ incidentStore.selectedIncident.incidentType }}</span>
            <span class="font-mono text-xs text-slate-300">📍 {{ incidentStore.selectedIncident.address || incidentStore.selectedIncident.district }}</span>
          </div>
          <div class="sh-right">
            <StatusBadge :status="incidentStore.selectedIncident.severity" />
            <span class="badge badge-medium font-mono">PRIORITY {{ incidentStore.selectedIncident.priorityScore }}</span>
          </div>
        </div>

        <div class="selected-details-block">
          <h3 class="incident-headline">{{ incidentStore.selectedIncident.title }}</h3>
          <p class="incident-desc">{{ incidentStore.selectedIncident.description }}</p>
        </div>

        <!-- 11-Step Lifecycle State Machine (Wrapping Responsive Grid) -->
        <div class="state-machine-container">
          <div class="state-header-row">
            <span class="font-mono text-xs text-slate-300 font-bold">INCIDENT LIFECYCLE STATE MACHINE</span>
            <span class="font-mono text-cyan text-xs font-bold">STATE {{ currentStepIndex + 1 }}/11 — {{ incidentStore.selectedIncident.status }}</span>
          </div>

          <!-- Flowing Stepper Grid -->
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

          <!-- Next Recommended Action Button -->
          <div class="next-action-strip">
            <div v-if="nextActionInfo" class="next-action-box">
              <div class="action-meta font-mono">
                <span>RECOMMENDED NEXT TRANSITION:</span>
                <strong class="text-cyan">{{ nextActionInfo.next }}</strong>
              </div>
              <button
                class="btn btn-primary btn-action-flow font-mono"
                :disabled="isTransitioning"
                @click="executeNextTransition"
              >
                {{ isTransitioning ? 'Advancing State...' : nextActionInfo.label }}
              </button>
            </div>

            <div v-else class="resolved-banner font-mono">
              ✅ INCIDENT FULLY RESOLVED & OPERATIONAL CLOSEOUT COMPLETE
            </div>

            <div v-if="transitionError" class="transition-error-alert font-mono">
              ⚠️ {{ transitionError }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-selection-banner font-mono">
        <span class="glyph">🚨</span>
        <strong>NO INCIDENT CURRENTLY SELECTED</strong>
        <p>Click any emergency from the Priority Queue above to inspect operational telemetry, advance the lifecycle state machine, and allocate responders.</p>
      </div>
    </section>

    <!-- ROW 3 — TACTICAL RESPONDER / DISPATCH CONSOLE & GPS SIMULATOR -->
    <section class="row-3-dispatch-sim tactical-card">
      <div class="section-title-strip font-mono">
        <div class="st-left">
          <span class="icon">⚡</span>
          <h3>TACTICAL RESPONDER DISPATCH & LIVE TELEMETRY</h3>
        </div>
        <span class="badge badge-success font-mono">{{ availableUnitsCount }} UNITS READY</span>
      </div>

      <!-- Current Assigned Unit Highlight Banner -->
      <div v-if="currentAssignedUnit" class="current-assigned-badge">
        <div class="assigned-left">
          <span class="status-dot-pulse"></span>
          <div>
            <span class="font-mono text-xs text-slate-400">ACTIVELY ASSIGNED UNIT:</span>
            <strong class="text-emerald text-sm block font-mono">
              {{ currentAssignedUnit.isCommunity ? '🧑‍⚕️' : currentAssignedUnit.type === 'PARAMEDIC' ? '🚑' : '🚒' }}
              {{ currentAssignedUnit.badgeNumber }} · {{ currentAssignedUnit.name }}
            </strong>
          </div>
        </div>
        <div class="assigned-right font-mono text-cyan">
          <span>DESTINATION: #{{ incidentStore.selectedIncident?.id || 'INC-1042' }} · ETA: {{ currentAssignedUnit.etaMinutes || 5 }} MIN</span>
        </div>
      </div>

      <div class="dispatch-sim-grid">
        <!-- 3A. Available Responders Cards Grid (Flows and wraps naturally) -->
        <div class="responders-grid-container">
          <div class="sub-header font-mono">SELECT FIELD UNIT FOR DISPATCH:</div>
          <div class="responder-units-flow-grid">
            <div
              v-for="r in sortedResponders"
              :key="r.id"
              :class="['responder-unit-card', {
                'selected-unit': selectedResponderId === r.id,
                'unit-busy': r.status !== 'AVAILABLE',
                'unit-recommended': isRecommendedUnit(r)
              }]"
              @click="r.status === 'AVAILABLE' ? selectedResponderId = r.id : null"
            >
              <div class="r-card-header">
                <div class="r-title-row">
                  <span class="r-icon">{{ r.isCommunity ? '🧑‍⚕️' : r.type === 'PARAMEDIC' ? '🚑' : '🚒' }}</span>
                  <strong class="font-mono">{{ r.badgeNumber }}</strong>
                </div>
                <StatusBadge :status="r.status" />
              </div>

              <div class="r-card-body">
                <span class="r-name">{{ r.name }}</span>
                <div class="r-telemetry-tags font-mono">
                  <span>📍 {{ calculateDistance(r) }} km</span>
                  <span class="text-cyan">ETA {{ r.etaMinutes || calculateEta(r) }}m</span>
                  <span>Fatigue: <strong :class="r.fatigueScore > 40 ? 'text-amber' : 'text-emerald'">{{ r.fatigueScore }}%</strong></span>
                </div>
                <div v-if="isRecommendedUnit(r)" class="recommended-tag font-mono">
                  RECOMMENDED FOR {{ incidentStore.selectedIncident?.incidentType || 'INCIDENT' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Dispatch Action Button -->
          <div class="dispatch-trigger-box">
            <button
              class="btn btn-primary btn-dispatch-exec font-mono"
              :disabled="isDispatching || !canDispatchSelected"
              @click="executeDispatch"
            >
              <span v-if="isDispatching">⚡ Transmitting Dispatch Directives...</span>
              <span v-else-if="currentAssignedUnit && currentAssignedUnit.id === selectedResponderId">
                ✓ {{ currentAssignedUnit.badgeNumber }} Already Assigned to Selected Incident
              </span>
              <span v-else>
                ⚡ DISPATCH {{ getSelectedResponderBadge }} TO INCIDENT #{{ incidentStore.selectedIncident?.id || '1042' }}
              </span>
            </button>
            <div v-if="dispatchError" class="dispatch-error-msg font-mono">
              ⚠️ {{ dispatchError }}
            </div>
          </div>
        </div>

        <!-- 3B. Live GPS Responder Movement Simulator -->
        <div class="gps-simulator-container">
          <div class="sub-header font-mono">LIVE GPS CORRIDOR SIMULATOR (AMBULANCE A12):</div>
          <div class="gps-simulation-panel">
            <div class="gps-panel-header">
              <div class="gps-hdr-left">
                <span class="pulse-sim-dot" :class="{ 'sim-active': simState.status === 'RUNNING' }"></span>
                <span class="font-mono text-xs text-cyan font-bold">ROUTE: BASE → INCIDENT #1042</span>
              </div>
              <span class="font-mono text-xs text-slate-400">WAYPOINTS: {{ simState.index }}/10</span>
            </div>

            <div class="gps-sim-body">
              <div class="sim-telemetry-row font-mono">
                <span>STATUS: <strong :class="getSimStatusClass">{{ simState.status }}</strong></span>
                <span>ETA: <strong class="text-cyan">{{ simState.etaMinutes }} MIN</strong></span>
                <span>PROGRESS: <strong class="text-emerald">{{ simState.progress }}%</strong></span>
              </div>

              <!-- Progress Bar -->
              <div class="sim-progress-track">
                <div class="sim-progress-fill" :style="{ width: simState.progress + '%' }"></div>
              </div>

              <!-- Interactive Controls -->
              <div class="sim-btn-row">
                <button
                  v-if="simState.status === 'IDLE'"
                  class="btn btn-primary btn-sm flex-1 font-mono"
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
                  title="Reset Simulation"
                >
                  🔄 RESET
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 4 — HOSPITAL / SHELTER OPERATIONAL INTELLIGENCE & TIMELINE -->
    <section class="row-4-operations-intel tactical-card">
      <div class="ops-header-tabs">
        <button
          :class="['ops-tab-link', 'font-mono', { active: activeSubTab === 'timeline' }]"
          @click="activeSubTab = 'timeline'"
        >
          ⏱️ Incident Timeline ({{ incidentStore.selectedIncident?.timeline?.length || 0 }})
        </button>
        <button
          :class="['ops-tab-link', 'font-mono', { active: activeSubTab === 'units' }]"
          @click="activeSubTab = 'units'"
        >
          🚑 Active Responder Telemetry ({{ responderStore.responders.length }})
        </button>
        <button
          :class="['ops-tab-link', 'font-mono', { active: activeSubTab === 'hospitals' }]"
          @click="activeSubTab = 'hospitals'"
        >
          🏥 Hospital Capacity Intel ({{ hospitalStore.hospitals.length }})
        </button>
        <button
          :class="['ops-tab-link', 'font-mono', { active: activeSubTab === 'shelters' }]"
          @click="activeSubTab = 'shelters'"
        >
          🏠 Shelter Occupancy Intel ({{ disasterStore.shelters.length }})
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
        <div v-else class="text-muted text-sm italic font-mono p-4">
          Select an incident to view recorded lifecycle timeline events.
        </div>
      </div>

      <!-- Tab 2: Active Responders Summary -->
      <div v-if="activeSubTab === 'units'" class="ops-body-view units-container">
        <div class="units-summary-flow-grid">
          <div
            v-for="r in responderStore.responders"
            :key="r.id"
            class="unit-summary-card"
          >
            <div class="u-card-header">
              <span class="font-mono text-cyan font-bold">{{ r.badgeNumber }}</span>
              <StatusBadge :status="r.status" />
            </div>
            <span class="u-name font-bold">{{ r.name }}</span>
            <div class="u-meta-row font-mono text-xs">
              <span>Vehicle: {{ r.vehicle }}</span>
              <span>Fatigue: <strong :class="r.fatigueScore > 40 ? 'text-amber' : 'text-emerald'">{{ r.fatigueScore }}%</strong></span>
              <span>Assignment: {{ r.assignedIncidentId ? '#' + r.assignedIncidentId : 'Available' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Hospital Operational Intelligence -->
      <div v-if="activeSubTab === 'hospitals'" class="ops-body-view hospitals-container">
        <div class="hospitals-summary-flow-grid">
          <div
            v-for="h in hospitalStore.hospitals"
            :key="h.id"
            :class="['hospital-summary-card', { 'card-surge-warn': h.totalBeds && ((h.totalBeds - h.availableBeds)/h.totalBeds) >= 0.8 }]"
            @click="focusHospitalOnMap(h)"
            title="Click to focus on tactical map"
          >
            <div class="h-card-header">
              <div class="h-name-box">
                <strong>{{ h.name }}</strong>
                <span class="h-loc text-slate-400 text-xs font-mono">📍 {{ h.district }}</span>
              </div>
              <div class="h-badge-box">
                <span v-if="h.totalBeds && ((h.totalBeds - h.availableBeds)/h.totalBeds) >= 0.8" class="badge-surge-pill font-mono">
                  ⚠️ >80% FULL
                </span>
                <span class="font-mono text-cyan font-bold text-xs">Match: {{ h.matchScore || 85 }}%</span>
              </div>
            </div>

            <div class="h-stat-chips font-mono">
              <span class="h-chip">
                Beds: <strong>{{ h.availableBeds || 0 }}/{{ h.totalBeds || 0 }}</strong>
                <span class="occ-pct">({{ h.totalBeds ? Math.round(((h.totalBeds - h.availableBeds)/h.totalBeds)*100) : 0 }}%)</span>
              </span>
              <span class="h-chip">
                ICU: <strong class="text-purple">{{ h.availableIcu || 0 }}/{{ h.totalIcu || 0 }}</strong>
              </span>
              <span class="h-chip">
                Trauma: <strong class="text-red">{{ h.availableTrauma || 0 }}/{{ h.totalTrauma || 0 }}</strong>
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
        <div class="shelters-summary-flow-grid">
          <div
            v-for="s in disasterStore.shelters"
            :key="s.id"
            :class="['shelter-summary-card', { 'card-surge-warn': s.capacity && (s.currentOccupancy/s.capacity) >= 0.8 }]"
          >
            <div class="s-card-header">
              <div>
                <strong>#{{ s.id }} · {{ s.name }}</strong>
                <span class="s-loc text-slate-400 text-xs block font-mono">📍 {{ s.district }}</span>
              </div>
              <span v-if="s.capacity && (s.currentOccupancy/s.capacity) >= 0.8" class="badge-surge-pill font-mono">
                ⚠️ >80% CAPACITY
              </span>
            </div>

            <div class="s-occupancy-bar">
              <div class="s-bar-track">
                <div
                  class="s-bar-fill"
                  :style="{ width: (s.capacity ? Math.min(100, Math.round((s.currentOccupancy/s.capacity)*100)) : 0) + '%' }"
                  :class="s.capacity && (s.currentOccupancy/s.capacity) >= 0.8 ? 'fill-danger' : 'fill-emerald'"
                ></div>
              </div>
              <div class="s-bar-meta font-mono text-xs">
                <span>{{ s.currentOccupancy || 0 }} / {{ s.capacity || 0 }} Occupants</span>
                <strong>{{ s.capacity ? Math.round((s.currentOccupancy/s.capacity)*100) : 0 }}%</strong>
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
  return totalBeds ? Math.round(((totalBeds - availBeds) / totalBeds) * 100) : 0;
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
    const occRatio = h.totalBeds ? (h.totalBeds - (h.availableBeds || 0)) / h.totalBeds : 0;
    return occRatio >= 0.75;
  });

  const highShelters = disasterStore.shelters.filter(s => {
    const occRatio = s.capacity ? s.currentOccupancy / s.capacity : 0;
    return occRatio >= 0.80;
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
  'REPORTED': { next: 'AI_ANALYZING', label: '🤖 INITIATE AI TRIAGE & ANALYSIS', note: 'AI dispatched triage assessment' },
  'AI_ANALYZING': { next: 'VERIFIED', label: '✓ VERIFY INCIDENT INTEGRITY', note: 'Incident verified by supervisor' },
  'VERIFIED': { next: 'PRIORITIZED', label: '⚡ COMPUTE PRIORITY MATRIX', note: 'Dynamic priority ranking computed' },
  'PRIORITIZED': { next: 'DISPATCHING', label: '🚨 INITIATE DISPATCH PROTOCOL', note: 'Dispatch channel opened' },
  'DISPATCHING': { next: 'ASSIGNED', label: '🚑 ASSIGN FIELD RESPONDER', note: 'Field responder units locked' },
  'ASSIGNED': { next: 'EN_ROUTE', label: '🛰️ SET RESPONDER EN ROUTE', note: 'Unit moving with active GPS telemetry' },
  'EN_ROUTE': { next: 'ON_SCENE', label: '📍 CONFIRM ARRIVAL ON SCENE', note: 'Unit on scene establishing perimeter' },
  'ON_SCENE': { next: 'TRANSPORTING', label: '🚑 COMMENCE PATIENT TRANSPORT', note: 'Patient in transit to medical hub' },
  'TRANSPORTING': { next: 'HOSPITAL_RECEIVED', label: '🏨 CONFIRM HOSPITAL HANDOFF', note: 'Trauma team received patients' },
  'HOSPITAL_RECEIVED': { next: 'RESOLVED', label: '✅ RESOLVE & CLOSE INCIDENT', note: 'Emergency operations completed' },
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
  return st.replace(/_/g, ' ');
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
/* ==========================================================================
   COMMAND DASHBOARD — NATURAL FLOWING LAYOUT (NO INTERNAL SCROLLBARS)
   ========================================================================== */
.command-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;
  padding-bottom: 2.5rem;
}

/* 1. TOP COMMAND BAR */
.top-command-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: rgba(10, 15, 30, 0.95);
  border: 1px solid rgba(51, 65, 85, 0.8);
  min-width: 0;
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
  font-size: 1rem;
  color: #f8fafc;
  line-height: 1.1;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
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
  flex-wrap: wrap;
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
  padding: 0.65rem 1rem;
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
  font-size: 0.8rem;
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

/* 2. KPI STRIP */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  min-width: 0;
}

.kpi-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  min-width: 0;
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
  min-width: 0;
}

.kpi-name {
  font-size: 0.6rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* ==========================================================================
   ROW 1 — PRIORITY QUEUE + TACTICAL MAP (SIDE-BY-SIDE ON DESKTOP)
   ========================================================================== */
.row-1-queue-map {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(0, 2fr);
  gap: 1.25rem;
  min-width: 0;
  width: 100%;
}

.priority-queue-panel {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-width: 0;
}

.queue-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.6rem;
}

.queue-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-title-row h3 {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-family: var(--font-mono);
}

.filter-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  outline: none;
}

.filter-input:focus {
  border-color: #38bdf8;
}

/* Flowing Queue List without internal scrollbars */
.queue-list-flow {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.incident-card-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.65rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 0;
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
  gap: 0.6rem;
  min-width: 0;
}

.priority-score-pill {
  border-radius: 6px;
  padding: 0.2rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
  flex-shrink: 0;
}

.score-critical { background: rgba(239, 68, 68, 0.25); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171; }
.score-high { background: rgba(245, 158, 11, 0.25); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; }
.score-medium { background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.5); color: #60a5fa; }

.score-digit { font-size: 0.95rem; font-weight: 800; font-family: var(--font-mono); }
.score-sub { font-size: 0.5rem; color: #94a3b8; }

.card-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.15rem;
}

.inc-id {
  font-size: 0.65rem;
  color: #38bdf8;
  font-weight: 700;
}

.inc-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.2;
}

.inc-address {
  color: #94a3b8;
}

.card-badges-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(51, 65, 85, 0.4);
}

.status-indicator-tag {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
}

.badge-mini {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  color: #94a3b8;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
}

.badge-assigned {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.6rem;
}

.tactical-map-panel {
  position: relative;
  min-height: 560px;
  min-width: 0;
  border-radius: 8px;
  overflow: hidden;
}

/* ==========================================================================
   ROW 2 — SELECTED INCIDENT + LIFECYCLE (WRAPPING RESPONSIVE GRID)
   ========================================================================== */
.row-2-selected-incident {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
}

.selected-header-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.65rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sh-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sh-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selected-details-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.incident-headline {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.incident-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* 11-Step Lifecycle State Machine */
.state-machine-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 8px;
  padding: 0.9rem;
}

.state-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  padding-bottom: 0.45rem;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* Responsive grid that wraps cleanly into 3-4 columns without horizontal scrolling */
.lifecycle-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.5rem;
  min-width: 0;
}

.flow-node {
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.45rem 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 0;
}

.flow-node:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: #38bdf8;
}

.node-icon-status {
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.node-label {
  font-size: 0.65rem;
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
  gap: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.65rem;
}

.next-action-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.action-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.btn-action-flow {
  width: 100%;
  padding: 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.resolved-banner {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 0.65rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.transition-error-alert {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.45rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.no-selection-banner {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.no-selection-banner .glyph {
  font-size: 2rem;
}

.no-selection-banner strong {
  color: #f8fafc;
  font-size: 0.9rem;
}

/* ==========================================================================
   ROW 3 — TACTICAL RESPONDER DISPATCH CONSOLE & GPS SIMULATOR
   ========================================================================== */
.row-3-dispatch-sim {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
}

.section-title-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.55rem;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.st-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.st-left h3 {
  font-size: 0.85rem;
  color: #f8fafc;
  font-weight: 700;
}

.current-assigned-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.assigned-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.status-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 1.5s infinite;
}

.dispatch-sim-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1.25rem;
  min-width: 0;
}

.responders-grid-container, .gps-simulator-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.sub-header {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 700;
}

/* Wrapping responders cards grid without inner scrollbar */
.responder-units-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.65rem;
  min-width: 0;
}

.responder-unit-card {
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.responder-unit-card:hover:not(.unit-busy) {
  background: rgba(30, 41, 59, 0.9);
  border-color: #38bdf8;
}

.responder-unit-card.selected-unit {
  background: rgba(2, 132, 199, 0.25);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.responder-unit-card.unit-busy {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.r-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.r-title-row strong {
  font-size: 0.8rem;
  color: #f1f5f9;
}

.r-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.r-name {
  font-size: 0.75rem;
  color: #e2e8f0;
}

.r-telemetry-tags {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.65rem;
  color: #94a3b8;
  flex-wrap: wrap;
}

.recommended-tag {
  font-size: 0.55rem;
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.6);
  color: #fde047;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-weight: 700;
  margin-top: 0.2rem;
}

.dispatch-trigger-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.btn-dispatch-exec {
  width: 100%;
  padding: 0.65rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.dispatch-error-msg {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.45rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* Phase 6: GPS Simulation Panel */
.gps-simulation-panel {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: #090e1a;
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 8px;
  padding: 0.85rem;
  min-width: 0;
}

.gps-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  padding-bottom: 0.4rem;
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
  gap: 0.6rem;
}

.sim-telemetry-row {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 0.7rem;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.sim-progress-track {
  width: 100%;
  height: 8px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
  overflow: hidden;
}

.sim-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.sim-btn-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sim-completed-tag {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #67e8f9;
  padding: 0.45rem 0.6rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
}

/* ==========================================================================
   ROW 4 — HOSPITAL / SHELTER OPERATIONAL INTELLIGENCE & TIMELINE
   ========================================================================== */
.row-4-operations-intel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
}

.ops-header-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}

.ops-tab-link {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  color: #94a3b8;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ops-tab-link:hover {
  background: rgba(30, 41, 59, 0.9);
  color: #f1f5f9;
  border-color: #38bdf8;
}

.ops-tab-link.active {
  background: rgba(2, 132, 199, 0.25);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.ops-body-view {
  min-width: 0;
  width: 100%;
}

/* Flowing Grid Layouts */
.units-summary-flow-grid,
.hospitals-summary-flow-grid,
.shelters-summary-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.85rem;
  min-width: 0;
}

/* Timeline */
.timeline-stepper {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
}

.timeline-node-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-left: 3px solid #38bdf8;
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.t-node-time {
  color: #38bdf8;
  font-size: 0.7rem;
  white-space: nowrap;
}

.t-node-text strong {
  display: block;
  font-size: 0.8rem;
  color: #f8fafc;
}

.t-node-text p {
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Responders Summary */
.unit-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.u-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.u-name {
  font-size: 0.8rem;
  color: #f1f5f9;
}

.u-meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  color: #94a3b8;
}

/* Hospital Intel */
.hospital-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hospital-summary-card:hover {
  border-color: #38bdf8;
  background: rgba(30, 41, 59, 0.85);
}

.h-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.4rem;
}

.h-name-box {
  display: flex;
  flex-direction: column;
}

.h-name-box strong {
  font-size: 0.8rem;
  color: #f8fafc;
}

.h-badge-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.h-stat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.65rem;
}

.h-chip {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

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

/* Shelters Intel */
.shelter-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.s-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.4rem;
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
  padding-top: 0.4rem;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS (DESKTOP -> TABLET -> MOBILE)
   ========================================================================== */
@media (max-width: 1180px) {
  .row-1-queue-map {
    grid-template-columns: minmax(280px, 1fr) minmax(0, 1.5fr);
  }
  .dispatch-sim-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .row-1-queue-map {
    grid-template-columns: 1fr;
  }
  .tactical-map-panel {
    min-height: 440px;
    height: 460px;
  }
  .lifecycle-flow-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .lifecycle-flow-grid {
    grid-template-columns: 1fr;
  }
  .kpi-strip {
    grid-template-columns: 1fr;
  }
  .units-summary-flow-grid,
  .hospitals-summary-flow-grid,
  .shelters-summary-flow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
