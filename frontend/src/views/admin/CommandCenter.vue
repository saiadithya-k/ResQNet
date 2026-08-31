<template>
  <div class="pinterest-command-dashboard">
    <!-- TOP TELEMETRY & STATUS PILL BAR (Pinterest Style) -->
    <header class="top-command-bar tactical-card" :class="{ 'bar-disaster-active': disasterStore.isDisasterMode }">
      <div class="cmd-identity">
        <div class="pinterest-logo-icon">
          <span class="m-glyph">M</span>
          <span class="live-pulse-dot" :class="{ 'dot-disaster': disasterStore.isDisasterMode }"></span>
        </div>
        <div class="cmd-titles">
          <h2>RESQNET TACTICAL COMMAND</h2>
          <span class="cmd-subtitle">SECTOR 04 JOINT OPERATIONS · LIVE INTELLIGENCE MESH</span>
        </div>
      </div>

      <!-- Top KPI Pill Badges (Exact Pinterest Layout) -->
      <div class="top-kpi-pill-group font-mono">
        <div class="kpi-pill-badge">
          <span class="pill-icon text-amber">⭐</span>
          <span class="pill-val">24k</span>
          <span class="pill-label">OPERATIONS</span>
        </div>
        <div class="kpi-pill-badge">
          <span class="pill-icon text-cyan">⏱️</span>
          <span class="pill-val">00:18</span>
          <span class="pill-label">LATENCY</span>
        </div>
        <div class="kpi-pill-badge">
          <span class="pill-icon text-emerald">🕒</span>
          <span class="pill-val">24:00</span>
          <span class="pill-label">UPTIME</span>
        </div>
        <div class="kpi-pill-badge">
          <span class="pill-icon text-purple">📊</span>
          <span class="pill-val">96.42</span>
          <span class="pill-label">AI MATCH</span>
        </div>
      </div>

      <!-- Right Action Controls -->
      <div class="cmd-actions font-mono">
        <!-- Disaster Mode Command Control -->
        <div class="telemetry-pill disaster-toggle-pill" :class="{ 'pill-danger': disasterStore.isDisasterMode }">
          <span class="t-lbl">DISASTER MODE:</span>
          <strong class="text-xs" :class="disasterStore.isDisasterMode ? 'text-red' : 'text-slate-400'">
            {{ disasterStore.isDisasterMode ? 'ACTIVE (LEVEL 3)' : 'STANDBY' }}
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
          {{ isMuted ? '🔇 MUTE' : '🔊 AUDIO' }}
        </button>

        <div class="telemetry-pill clock-pill">
          <span class="t-val text-cyan font-mono">{{ operationalTime.slice(0, 8) }}</span>
        </div>
      </div>
    </header>

    <!-- DISASTER SURGE ACTIVE BANNER (If Active) -->
    <div v-if="disasterStore.isDisasterMode" class="disaster-surge-banner font-mono">
      <span class="surge-icon">🚨</span>
      <strong>LEVEL 3 DISASTER STATE ACTIVE — METROPOLITAN JOINT SURGE PROTOCOL ENFORCED</strong>
      <span class="surge-detail">Chemical Plume & Harbour Danger Sectors Cleared</span>
    </div>

    <!-- MAIN 3-COLUMN PINTEREST TACTICAL GRID -->
    <div class="pinterest-main-grid">
      <!-- ========================================================= -->
      <!-- COLUMN 1 (LEFT): BIG HERO COUNTER + SPLINE WAVE + RING WIDGET -->
      <!-- ========================================================= -->
      <aside class="col-left">
        <!-- 1A. Hero Numeric Telemetry Counter -->
        <div class="tactical-card card-hero-metric">
          <div class="hero-header font-mono">
            <span class="section-title">REGIONAL INCIDENT INTEL</span>
            <span class="update-tag text-slate-400">LIVE FEED</span>
          </div>
          <div class="hero-num-wrap font-mono">
            <h1 class="hero-big-number">3,141,592</h1>
            <span class="hero-delta-badge text-emerald">+14.50% ↑</span>
          </div>
          <p class="hero-desc font-mono text-xs text-slate-400">Synchronized telemetry events across 5 metropolitan emergency sectors</p>
        </div>

        <!-- 1B. 90% AI Confidence & Spline Wave Graph Widget -->
        <div class="tactical-card card-spline-wave">
          <div class="spline-top-row font-mono">
            <div>
              <span class="spline-big-stat font-display">90<span class="stat-unit">%</span></span>
              <span class="spline-label block text-slate-400 text-xs">AI MATCH ACCURACY</span>
            </div>
            <div class="spline-pill font-mono text-xs">
              <span class="dot-purple"></span> PREDICTIVE RISK
            </div>
          </div>

          <!-- Futuristic Spline Wave SVG Graph -->
          <div class="spline-graph-container">
            <svg viewBox="0 0 320 120" class="spline-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="splineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#818cf8" stop-opacity="0.45" />
                  <stop offset="100%" stop-color="#818cf8" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#38bdf8" />
                  <stop offset="50%" stop-color="#818cf8" />
                  <stop offset="100%" stop-color="#38bdf8" />
                </linearGradient>
              </defs>

              <!-- Filled Area Under Curve -->
              <path
                d="M 0,90 Q 50,30 110,65 T 220,40 T 320,70 L 320,120 L 0,120 Z"
                fill="url(#splineGrad)"
              />

              <!-- Glowing Wave Line -->
              <path
                d="M 0,90 Q 50,30 110,65 T 220,40 T 320,70"
                fill="none"
                stroke="url(#lineGrad)"
                stroke-width="3.5"
                stroke-linecap="round"
              />

              <!-- Data Point Nodes -->
              <circle cx="110" cy="65" r="4.5" fill="#ffffff" stroke="#818cf8" stroke-width="2.5" />
              <text x="110" y="52" fill="#e2e8f0" font-size="10" font-family="JetBrains Mono" text-anchor="middle">1514</text>

              <circle cx="220" cy="40" r="4.5" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
              <text x="220" y="28" fill="#e2e8f0" font-size="10" font-family="JetBrains Mono" text-anchor="middle">1658</text>
            </svg>
          </div>
          <div class="spline-footer font-mono text-xs text-slate-400">
            <span>Triage Latency: <strong>2.00s</strong></span>
            <span class="text-cyan">Trained on 48k cases</span>
          </div>
        </div>

        <!-- 1C. Device / Fleet Concentration Ring Widget (1,208) -->
        <div class="tactical-card card-ring-gauge">
          <div class="ring-hdr font-mono">
            <span>FLEET MOBILIZATION</span>
            <strong class="text-cyan text-xs">ONLINE</strong>
          </div>

          <div class="ring-body-row">
            <!-- Concentric Circular Gauge Ring -->
            <div class="circular-ring-wrap">
              <svg viewBox="0 0 100 100" class="ring-svg">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" stroke-width="8" fill="none" />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="#38bdf8"
                  stroke-width="8"
                  fill="none"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="65"
                  stroke-linecap="round"
                />
                <circle
                  cx="50" cy="50" r="30"
                  stroke="#818cf8"
                  stroke-width="6"
                  fill="none"
                  stroke-dasharray="188.4"
                  stroke-dashoffset="50"
                  stroke-linecap="round"
                />
              </svg>
              <div class="ring-center-text font-mono">
                <span class="ring-delta text-emerald">-22.50</span>
              </div>
            </div>

            <!-- Total Units & Category Breakdown -->
            <div class="ring-details-wrap">
              <div class="ring-total-num font-mono">
                <h2>1,208<span class="sub-num text-slate-400 text-xs"> -45</span></h2>
                <span class="text-xs text-slate-400">Active Units</span>
              </div>
              <div class="breakdown-list font-mono text-xs">
                <div class="bd-item">
                  <span class="dot-cyan"></span> Heavy Ambulances: <strong>7,824</strong>
                </div>
                <div class="bd-item">
                  <span class="dot-purple"></span> Rapid Response: <strong>21</strong>
                </div>
                <div class="bd-item">
                  <span class="dot-emerald"></span> Medical Drones: <strong>2,302</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- ========================================================= -->
      <!-- COLUMN 2 (CENTER): TACTICAL GIS MAP WITH FLOATING TELEMETRY -->
      <!-- ========================================================= -->
      <main class="col-center tactical-card map-center-card">
        <!-- Floating Telemetry Pills (Pinterest Style overlays) -->
        <div class="map-floating-overlay">
          <div class="floating-telemetry-tag tag-purple font-mono" style="top: 15%; left: 22%;">
            <span class="pill-dot"></span> -22.50 · Sector 4 Plume
          </div>
          <div class="floating-telemetry-tag tag-red font-mono" style="top: 28%; left: 52%;">
            <span class="pill-dot"></span> -14.50 · #INC-1042 Collapse
          </div>
          <div class="floating-telemetry-tag tag-blue font-mono" style="top: 58%; left: 70%;">
            <span class="pill-dot"></span> +9.50 · AMB-A12 Intercept
          </div>
        </div>

        <!-- Embedded OpenFreeMap Tactical GIS Map -->
        <div class="embedded-map-wrap">
          <EmergencyMap />
        </div>

        <!-- Bottom Route Simulator Bar -->
        <div class="map-bottom-strip font-mono">
          <div class="strip-left">
            <span class="pulse-sim-dot" :class="{ 'sim-active': simState.status === 'RUNNING' }"></span>
            <span>SIMULATOR: <strong>AMBULANCE A12 → INCIDENT #1042</strong></span>
            <span class="text-cyan">ETA {{ simState.etaMinutes }}m</span>
          </div>
          <div class="strip-actions">
            <button
              v-if="simState.status === 'IDLE'"
              class="btn-sim-ctl font-mono"
              @click="startGpsSim"
            >
              🚀 RUN GPS
            </button>
            <button
              v-else-if="simState.status === 'RUNNING'"
              class="btn-sim-ctl font-mono text-amber"
              @click="pauseGpsSim"
            >
              ⏸️ PAUSE
            </button>
            <button
              v-else-if="simState.status === 'PAUSED'"
              class="btn-sim-ctl font-mono text-cyan"
              @click="resumeGpsSim"
            >
              ▶️ RESUME
            </button>
            <button
              v-if="simState.status !== 'IDLE'"
              class="btn-sim-ctl font-mono text-slate-400"
              @click="resetGpsSim"
            >
              🔄 RESET
            </button>
          </div>
        </div>
      </main>

      <!-- ========================================================= -->
      <!-- COLUMN 3 (RIGHT): RADIAL ARC + GLOWING BAR CHART + INCIDENT FEED -->
      <!-- ========================================================= -->
      <aside class="col-right">
        <!-- 3A. Semi-Circular Arc Radial Gauge (124 Active Units) -->
        <div class="tactical-card card-arc-gauge">
          <div class="arc-header font-mono">
            <span>RESOURCE ALLOCATION</span>
            <span class="text-emerald font-bold text-xs">OPTIMAL</span>
          </div>

          <div class="arc-gauge-container">
            <svg viewBox="0 0 160 90" class="arc-svg">
              <path
                d="M 20,80 A 60,60 0 0,1 140,80"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                stroke-width="12"
                stroke-linecap="round"
              />
              <path
                d="M 20,80 A 60,60 0 0,1 110,25"
                fill="none"
                stroke="#38bdf8"
                stroke-width="12"
                stroke-linecap="round"
              />
              <path
                d="M 115,28 A 60,60 0 0,1 140,80"
                fill="none"
                stroke="#10b981"
                stroke-width="12"
                stroke-linecap="round"
              />
            </svg>
            <div class="arc-center-number font-mono">
              <span class="arc-big-val">124</span>
              <span class="arc-sub-label text-slate-400 text-xs">Active Fleet</span>
            </div>
          </div>

          <div class="arc-legend-row font-mono text-xs">
            <span class="leg-item"><span class="dot-cyan"></span> Paramedics: <strong>86</strong></span>
            <span class="leg-item"><span class="dot-emerald"></span> Trauma: <strong>38</strong></span>
          </div>
        </div>

        <!-- 3B. Glowing Amber / Gold Vertical Bar Chart (90,675) -->
        <div class="tactical-card card-bar-chart">
          <div class="bar-chart-top font-mono">
            <div>
              <span class="text-xs text-slate-400 block">HOSPITAL BED MESH</span>
              <span class="bar-total-num font-mono">90,675</span>
            </div>
            <span class="text-amber font-mono text-xs">82% OCCUPANCY</span>
          </div>

          <!-- Glowing Rounded Vertical Bars -->
          <div class="vertical-bars-row">
            <div class="bar-col">
              <div class="bar-fill-track">
                <div class="bar-fill" style="height: 65%;"></div>
              </div>
              <span class="bar-label font-mono text-xs">1-2h</span>
            </div>
            <div class="bar-col">
              <div class="bar-fill-track">
                <div class="bar-fill" style="height: 85%;"></div>
              </div>
              <span class="bar-label font-mono text-xs">2-3h</span>
            </div>
            <div class="bar-col">
              <div class="bar-fill-track">
                <div class="bar-fill" style="height: 95%;"></div>
              </div>
              <span class="bar-label font-mono text-xs">3-4h</span>
            </div>
            <div class="bar-col">
              <div class="bar-fill-track">
                <div class="bar-fill" style="height: 45%;"></div>
              </div>
              <span class="bar-label font-mono text-xs">4-5h</span>
            </div>
            <div class="bar-col">
              <div class="bar-fill-track">
                <div class="bar-fill" style="height: 70%;"></div>
              </div>
              <span class="bar-label font-mono text-xs">5-6h</span>
            </div>
          </div>
        </div>

        <!-- 3C. Live Priority Incident Queue & Fast Dispatch -->
        <div class="tactical-card card-incident-stream">
          <div class="stream-header font-mono">
            <div class="stream-title-row">
              <span>PRIORITY INCIDENT STREAM</span>
              <span class="badge badge-critical font-mono">{{ incidentStore.incidents.length }} TOTAL</span>
            </div>
            <input
              type="text"
              v-model="searchFilter"
              placeholder="Filter incidents..."
              class="stream-filter-input font-mono"
            />
          </div>

          <div class="stream-list-flow">
            <div
              v-for="inc in filteredIncidents"
              :key="inc.id"
              :class="['stream-item-card', { 'active-selected': incidentStore.selectedIncident?.id === inc.id, 'is-critical': inc.severity === 'CRITICAL' }]"
              @click="handleSelectIncident(inc)"
            >
              <div class="inc-head-row font-mono">
                <span class="inc-id text-cyan font-bold">#{{ inc.id }}</span>
                <span :class="['inc-badge', inc.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high']">
                  {{ inc.severity }}
                </span>
              </div>
              <span class="inc-title">{{ inc.title }}</span>
              <div class="inc-meta-row font-mono text-xs text-slate-400">
                <span>📍 {{ inc.district || 'Metro Core' }}</span>
                <span :class="inc.status === 'RESOLVED' ? 'text-emerald' : 'text-amber'">{{ inc.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
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

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const searchFilter = ref('');
const operationalTime = ref('');
const isMuted = ref(false);

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

const filteredIncidents = computed(() => {
  if (!searchFilter.value.trim()) return incidentStore.incidents;
  const q = searchFilter.value.toLowerCase();
  return incidentStore.incidents.filter(
    i => (i.title && i.title.toLowerCase().includes(q)) ||
         (i.id && i.id.toLowerCase().includes(q)) ||
         (i.district && i.district.toLowerCase().includes(q))
  );
});

function handleSelectIncident(inc) {
  incidentStore.selectIncident(inc);
}

function handleToggleDisasterMode(activate) {
  disasterStore.toggleDisasterMode(activate);
  if (activate && !isMuted.value) {
    audioAlert.playCriticalAlert();
  }
}

function toggleAudioMute() {
  isMuted.value = !isMuted.value;
  audioAlert.setMuted(isMuted.value);
}

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
</script>

<style scoped>
.pinterest-command-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  padding-bottom: 2rem;
}

/* TOP COMMAND BAR */
.top-command-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: rgba(13, 20, 36, 0.85);
  border-radius: 14px;
}

.cmd-identity {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.pinterest-logo-icon {
  position: relative;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-glyph {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.25rem;
  color: #38bdf8;
  letter-spacing: -0.05em;
}

.live-pulse-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.cmd-titles h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

.cmd-subtitle {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #94a3b8;
  letter-spacing: 0.05em;
}

/* TOP KPI PILL GROUP (Pinterest layout) */
.top-kpi-pill-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kpi-pill-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.pill-val {
  font-weight: 800;
  color: #f8fafc;
}

.pill-label {
  font-size: 0.6rem;
  color: #94a3b8;
}

/* ACTIONS */
.cmd-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.telemetry-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(56, 189, 248, 0.25);
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  font-size: 0.72rem;
}

.btn-disaster-act {
  background: #ef4444;
  border: none;
  color: white;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.65rem;
  cursor: pointer;
}

.btn-disaster-deact {
  background: #10b981;
  border: none;
  color: white;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.65rem;
  cursor: pointer;
}

.btn-mute-toggle {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #cbd5e1;
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  font-size: 0.72rem;
  cursor: pointer;
}

.disaster-surge-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.25rem;
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid #ef4444;
  border-radius: 10px;
  color: #fca5a5;
  font-size: 0.8rem;
}

/* ========================================================= */
/* MAIN 3-COLUMN PINTEREST GRID */
/* ========================================================= */
.pinterest-main-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 1rem;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .pinterest-main-grid {
    grid-template-columns: 1fr;
  }
}

/* COLUMN LEFT */
.col-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-hero-metric {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.hero-num-wrap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.hero-big-number {
  font-size: 1.85rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-delta-badge {
  font-size: 0.75rem;
  font-weight: 700;
}

/* SPLINE WAVE CARD */
.card-spline-wave {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.spline-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.spline-big-stat {
  font-size: 2.2rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1;
}

.stat-unit {
  font-size: 1.2rem;
  color: #818cf8;
}

.spline-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  color: #c7d2fe;
}

.dot-purple {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #818cf8;
}

.dot-cyan {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  margin-right: 4px;
}

.dot-emerald {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-right: 4px;
}

.spline-graph-container {
  width: 100%;
  height: 110px;
}

.spline-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.spline-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  padding-top: 0.4rem;
}

/* RING GAUGE CARD */
.card-ring-gauge {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ring-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
}

.ring-body-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.circular-ring-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 800;
}

.ring-details-wrap h2 {
  font-size: 1.35rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1.1;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.35rem;
}

/* COLUMN CENTER (MAP & GLOBE) */
.col-center {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 580px;
  overflow: hidden;
  padding: 0;
  background: #060913;
}

.map-floating-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

.floating-telemetry-tag {
  position: absolute;
  padding: 0.25rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  backdrop-filter: blur(8px);
  animation: float-pulse 3s ease-in-out infinite alternate;
}

.tag-purple {
  background: rgba(129, 140, 248, 0.25);
  border: 1px solid rgba(129, 140, 248, 0.5);
  color: #c7d2fe;
}
.tag-purple .pill-dot { background: #818cf8; }

.tag-red {
  background: rgba(244, 63, 94, 0.25);
  border: 1px solid rgba(244, 63, 94, 0.5);
  color: #fecdd3;
}
.tag-red .pill-dot { background: #f43f5e; }

.tag-blue {
  background: rgba(56, 189, 248, 0.25);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #bae6fd;
}
.tag-blue .pill-dot { background: #38bdf8; }

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

@keyframes float-pulse {
  0% { transform: translateY(0); }
  100% { transform: translateY(-6px); }
}

.embedded-map-wrap {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 520px;
}

.map-bottom-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: rgba(11, 17, 34, 0.9);
  border-top: 1px solid rgba(56, 189, 248, 0.2);
  font-size: 0.72rem;
  z-index: 20;
}

.strip-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pulse-sim-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}

.pulse-sim-dot.sim-active {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: blink 1s infinite;
}

.btn-sim-ctl {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #f8fafc;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.68rem;
}

/* COLUMN RIGHT */
.col-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ARC GAUGE */
.card-arc-gauge {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.arc-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
}

.arc-gauge-container {
  position: relative;
  width: 160px;
  height: 90px;
}

.arc-svg {
  width: 100%;
  height: 100%;
}

.arc-center-number {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.arc-big-val {
  font-size: 1.65rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1;
}

.arc-legend-row {
  width: 100%;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  padding-top: 0.4rem;
}

/* VERTICAL BAR CHART */
.card-bar-chart {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bar-chart-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bar-total-num {
  font-size: 1.45rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1.1;
}

.vertical-bars-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 85px;
  padding: 0 0.5rem;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  width: 20px;
}

.bar-fill-track {
  flex: 1;
  width: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #f59e0b, #fbbf24);
  border-radius: 9999px;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  transition: height 0.5s ease;
}

.bar-label {
  color: #64748b;
  font-size: 0.6rem;
}

/* INCIDENT STREAM */
.card-incident-stream {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 280px;
}

.stream-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stream-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
}

.stream-filter-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  color: #f8fafc;
  font-size: 0.7rem;
}

.stream-list-flow {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
  padding-right: 2px;
}

.stream-item-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stream-item-card:hover, .stream-item-card.active-selected {
  background: rgba(30, 41, 59, 0.8);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.stream-item-card.is-critical {
  border-left: 3px solid #ef4444;
}

.inc-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
}

.inc-title {
  font-size: 0.72rem;
  color: #cbd5e1;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inc-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
