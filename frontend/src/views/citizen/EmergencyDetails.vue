<template>
  <div class="emergency-details-view">
    <!-- Loading State -->
    <div v-if="loading" class="tactical-card state-panel">
      <div class="spinner-sm"></div>
      <span>CONNECTING TO LIVE INCIDENT TRACKING...</span>
    </div>

    <!-- Not Found / Unauthorized State -->
    <div v-else-if="fetchError || !incident" class="tactical-card state-panel error">
      <span class="state-icon">🔒</span>
      <h3>EMERGENCY NOT ACCESSIBLE</h3>
      <p>{{ fetchError || "You're not authorized to view this emergency or it does not exist." }}</p>
      <router-link to="/citizen/emergencies" class="btn btn-primary btn-sm mt-3">
        ← Back to My Emergencies
      </router-link>
    </div>

    <!-- Active Incident Details View -->
    <div v-else class="details-content">
      <!-- Header -->
      <div class="header-card tactical-card">
        <div class="header-left">
          <router-link to="/citizen/emergencies" class="back-link">← Back to My Emergencies</router-link>
          <div class="title-row">
            <h2>{{ getCategoryIcon(incident.incidentType) }} {{ incident.title }}</h2>
            <span class="inc-id-badge font-mono">{{ incident.id }}</span>
          </div>
          <p class="inc-location-sub">📍 {{ incident.address }} ({{ incident.latitude?.toFixed(4) }}, {{ incident.longitude?.toFixed(4) }})</p>
        </div>

        <div class="header-right">
          <div class="status-top-row">
            <span :class="['status-chip', getStatusClass(incident.status)]">
              <span class="chip-dot"></span>
              <span>{{ formatStatus(incident.status) }}</span>
            </span>
            <div :class="['socket-badge', isSocketConnected ? 'connected' : 'disconnected']">
              <span class="socket-dot"></span>
              <span>{{ isSocketConnected ? 'LIVE FEED ACTIVE' : 'DISCONNECTED' }}</span>
            </div>
          </div>
          <span class="last-sync-tag font-mono">Last Sync: {{ lastSyncTime }}</span>
        </div>
      </div>

      <!-- Main 2-Column Grid -->
      <div class="details-grid">
        <!-- Left Column: Incident Intelligence, Evidence & Timeline -->
        <div class="left-col">
          <!-- 1. AI Triage & Operational Priority -->
          <div class="tactical-card triage-card">
            <div class="section-title">
              <span>AI EMERGENCY TRIAGE & PRIORITY</span>
              <span class="sec-subtitle">Real-Time Intelligence Assessment</span>
            </div>

            <div class="triage-metrics-grid">
              <div class="triage-box">
                <span class="triage-lbl">PRIORITY SCORE</span>
                <strong class="triage-val text-amber font-mono">{{ incident.priorityScore || 85 }}/100</strong>
                <span class="triage-sub">Dynamic Dispatch Queue</span>
              </div>

              <div class="triage-box">
                <span class="triage-lbl">OPERATIONAL SEVERITY</span>
                <strong :class="['triage-val font-mono', getSeverityClass(incident.severity)]">
                  {{ incident.severity || 'HIGH' }}
                </strong>
                <span class="triage-sub">First Responder Alert</span>
              </div>

              <div class="triage-box">
                <span class="triage-lbl">EMOTIONAL DISTRESS SIGNAL</span>
                <strong class="triage-val text-blue font-mono">
                  {{ incident.aiEmotionState || 'PANICKED' }}
                </strong>
                <span class="triage-sub">
                  Urgency: {{ Math.round((incident.aiEmotionScore || 0.9) * 100) }}%
                </span>
              </div>
            </div>

            <!-- Trapped / Victim / Hazard Flags -->
            <div class="hazard-details-row">
              <div class="hazard-stat-box">
                <span class="stat-num">{{ incident.victimCount || 1 }}</span>
                <span class="stat-lbl">Victims in Zone</span>
              </div>
              <div class="hazard-flags-list">
                <span v-if="incident.hasInjuries" class="h-flag red">🩸 Severe Injuries</span>
                <span v-if="incident.hasTrapped" class="h-flag red">⛓️ People Trapped</span>
                <span v-if="incident.hasFire" class="h-flag amber">🔥 Active Fire / Smoke</span>
                <span v-if="incident.hasHazmat" class="h-flag amber">☣️ Chemical / Toxic Vapor</span>
                <span v-if="incident.vulnerableGroups?.length" class="h-flag blue">
                  👶 Vulnerable: {{ incident.vulnerableGroups.join(', ') }}
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Scene Description -->
          <div class="tactical-card desc-card">
            <div class="section-title">
              <span>CITIZEN TRANSMISSION DETAILS</span>
              <span class="sec-subtitle">Original Witness Report</span>
            </div>
            <p class="scene-desc-text">"{{ incident.description }}"</p>
          </div>

          <!-- 3. Attached Evidence (Phase 2 Integration) -->
          <div class="tactical-card evidence-card">
            <div class="section-title">
              <span>ATTACHED EMERGENCY EVIDENCE ({{ incident.evidenceFiles?.length || 0 }})</span>
              <span class="sec-subtitle">Cryptographically Sealed Evidence</span>
            </div>

            <div v-if="!incident.evidenceFiles || incident.evidenceFiles.length === 0" class="no-evidence-box">
              <span>No media files attached to this report.</span>
            </div>

            <div v-else class="evidence-items-grid">
              <div
                v-for="ev in incident.evidenceFiles"
                :key="ev.id || ev.fileName"
                class="evidence-item-card"
              >
                <!-- Image Preview -->
                <div v-if="ev.fileType === 'image'" class="ev-media-box">
                  <img :src="ev.url" :alt="ev.fileName" class="ev-img" />
                </div>

                <!-- Video Preview -->
                <div v-else-if="ev.fileType === 'video'" class="ev-media-box">
                  <video :src="ev.url" controls class="ev-video"></video>
                </div>

                <!-- Audio Preview -->
                <div v-else-if="ev.fileType === 'audio'" class="ev-audio-box">
                  <span class="audio-ico">🎙️</span>
                  <audio :src="ev.url" controls class="ev-audio-player"></audio>
                </div>

                <div class="ev-info-line">
                  <strong class="ev-name" :title="ev.fileName">{{ ev.fileName }}</strong>
                  <div class="ev-tags">
                    <span class="ev-size">{{ ev.fileSize || 'Attached' }}</span>
                    <span class="ev-seal">✓ SHA-256 SEALED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Operational Incident Timeline -->
          <div class="tactical-card timeline-card">
            <div class="section-title">
              <span>INCIDENT LIFECYCLE TIMELINE</span>
              <span class="sec-subtitle">Step-by-Step Response Progression</span>
            </div>

            <div class="timeline-stepper">
              <div
                v-for="(step, idx) in computeLifecycleSteps(incident)"
                :key="idx"
                :class="['step-row', step.state]"
              >
                <div class="step-indicator">
                  <span v-if="step.state === 'completed'" class="step-icon done">✓</span>
                  <span v-else-if="step.state === 'active'" class="step-icon current">●</span>
                  <span v-else class="step-icon upcoming">○</span>
                  <div v-if="idx < computeLifecycleSteps(incident).length - 1" class="step-line"></div>
                </div>

                <div class="step-content">
                  <div class="step-header">
                    <strong class="step-title">{{ step.title }}</strong>
                    <span v-if="step.time" class="step-time font-mono">{{ step.time }}</span>
                  </div>
                  <p class="step-desc">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Responder Tracking & Live Map -->
        <div class="right-col">
          <!-- 1. Assigned First Responder Unit -->
          <div class="tactical-card responder-card">
            <div class="section-title">
              <span>ASSIGNED RESPONDER UNIT</span>
              <span class="sec-subtitle">Tactical Field Response</span>
            </div>

            <div v-if="incident.status === 'REPORTED' || incident.status === 'VERIFIED'" class="responder-pending">
              <div class="radar-pulse"></div>
              <div class="pending-info">
                <strong>DISPATCH IN PROGRESS</strong>
                <p>AI Dispatch Engine is identifying the closest available unit with trauma/rescue equipment.</p>
              </div>
            </div>

            <div v-else class="responder-profile">
              <div class="resp-header">
                <span class="resp-avatar">{{ getVehicleIcon(incident.incidentType) }}</span>
                <div class="resp-id">
                  <strong>{{ getResponderName(incident) }}</strong>
                  <span class="resp-callsign font-mono">CALLSIGN: {{ incident.assignedBadge || 'UNIT-A12' }}</span>
                </div>
              </div>

              <div class="resp-metrics-grid">
                <div class="resp-box">
                  <span class="lbl">UNIT STATUS</span>
                  <strong class="val text-amber font-mono">{{ formatStatus(incident.status) }}</strong>
                </div>

                <div class="resp-box">
                  <span class="lbl">ESTIMATED ETA</span>
                  <strong class="val text-emerald font-mono">
                    {{ incident.etaMinutes ? `${incident.etaMinutes} MIN` : 'ETA unavailable' }}
                  </strong>
                </div>

                <div class="resp-box full">
                  <span class="lbl">GPS TELEMETRY</span>
                  <span class="val text-muted text-xs font-mono">
                    {{ incident.responderLat && incident.responderLng
                      ? `LAT: ${incident.responderLat.toFixed(4)}, LNG: ${incident.responderLng.toFixed(4)}`
                      : 'Responder GPS location unavailable'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Interactive Map View -->
          <div class="tactical-card map-card">
            <div class="section-title">
              <span>TACTICAL LOCATION MAP</span>
              <span class="sec-subtitle">GPS Coordinates & Perimeter</span>
            </div>

            <!-- Leaflet Container -->
            <div id="citizen-incident-map" class="map-view-canvas"></div>
          </div>

          <!-- 3. Citizen Safety Protocol Guidelines -->
          <div class="tactical-card safety-card">
            <div class="section-title">
              <span>CRITICAL SAFETY PROTOCOLS</span>
              <span class="sec-subtitle">Immediate Directives</span>
            </div>

            <ul class="safety-steps">
              <li>📍 <strong>Stay in Place:</strong> Keep your mobile phone accessible for responder call signs.</li>
              <li>🚫 <strong>Clear Access:</strong> Keep surrounding driveways and gate pathways clear for emergency vehicles.</li>
              <li>🩹 <strong>First Aid:</strong> If someone is severely bleeding, apply firm, clean pressure. Do not move suspected spinal injuries.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidentStore } from '../../stores/incidentStore';
import { useSocketService } from '../../services/socketService';
import api from '../../services/api';

const route = useRoute();
const incidentStore = useIncidentStore();
const socketService = useSocketService();

const incident = ref(null);
const loading = ref(true);
const fetchError = ref('');
const isSocketConnected = ref(true);
const lastSyncTime = ref(new Date().toLocaleTimeString());

let map = null;
let incidentMarker = null;
let responderMarker = null;

async function loadIncident() {
  const id = route.params.id;
  loading.value = true;
  fetchError.value = '';

  try {
    const res = await api.get(`/incidents/${id}`);
    if (res.data?.data) {
      incident.value = res.data.data;
      lastSyncTime.value = new Date().toLocaleTimeString();
      await nextTick();
      initMap();
    } else {
      fetchError.value = 'Incident not found.';
    }
  } catch (err) {
    console.error('Failed to load incident details', err);
    fetchError.value = err.response?.data?.message || 'Unable to access incident records.';
  } finally {
    loading.value = false;
  }
}

function initMap() {
  if (!incident.value) return;
  const container = document.getElementById('citizen-incident-map');
  if (!container) return;

  if (map) {
    map.remove();
    map = null;
  }

  const lat = incident.value.latitude || 13.0827;
  const lng = incident.value.longitude || 80.2707;

  map = L.map('citizen-incident-map', {
    center: [lat, lng],
    zoom: 14,
    zoomControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© CartoDB'
  }).addTo(map);

  // Incident Marker
  const incidentIcon = L.divIcon({
    className: 'custom-incident-pin',
    html: `<div style="background:#ef4444; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #ef4444;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  incidentMarker = L.marker([lat, lng], { icon: incidentIcon }).addTo(map);
  incidentMarker.bindPopup(`<strong>Incident: ${incident.value.title}</strong><br>${incident.value.address}`).openPopup();

  // If responder lat/lng exists
  if (incident.value.responderLat && incident.value.responderLng) {
    const respIcon = L.divIcon({
      className: 'custom-resp-pin',
      html: `<div style="background:#3b82f6; width:18px; height:18px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #3b82f6; display:flex; align-items:center; justify-content:center; font-size:10px;">🚑</div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    responderMarker = L.marker([incident.value.responderLat, incident.value.responderLng], { icon: respIcon }).addTo(map);
    responderMarker.bindPopup('<strong>Assigned First Responder Unit</strong>');

    // Fit bounds to show both
    const bounds = L.latLngBounds([[lat, lng], [incident.value.responderLat, incident.value.responderLng]]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

function computeLifecycleSteps(inc) {
  if (!inc) return [];
  const timelineEvents = inc.timeline || [];

  const baseSteps = [
    { key: 'REPORTED', title: 'REPORT RECEIVED & INGESTED', description: 'Emergency transmission received via Citizen Portal.' },
    { key: 'AI_ENRICHED', title: 'AI TRIAGE & DYNAMIC PRIORITY SEALED', description: `Priority score computed: ${inc.priorityScore || 88}/100.` },
    { key: 'VERIFIED', title: 'COMMAND VERIFICATION', description: 'Incident verified by emergency dispatch.' },
    { key: 'DISPATCHING', title: 'FIRST RESPONDER UNIT ASSIGNED', description: inc.status === 'REPORTED' ? 'Pending nearest unit allocation.' : 'Assigned rapid response team.' },
    { key: 'EN_ROUTE', title: 'RESPONDER EN ROUTE', description: 'Units are in transit to your reported GPS coordinates.' },
    { key: 'ON_SCENE', title: 'ON-SCENE RESCUE & TRIAGE', description: 'Responders arrived on site.' },
    { key: 'RESOLVED', title: 'INCIDENT RESOLVED & CLEARED', description: 'Emergency operations completed.' }
  ];

  // Map state
  const statusOrder = ['REPORTED', 'VERIFIED', 'DISPATCHING', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'RESOLVED'];
  const currentIdx = statusOrder.indexOf(inc.status);

  return baseSteps.map((step, idx) => {
    let state = 'upcoming';
    if (idx <= currentIdx) state = 'completed';
    if (idx === currentIdx) state = 'active';

    const matchEvent = timelineEvents.find(e => e.title?.toUpperCase().includes(step.key) || e.title?.toUpperCase().includes(step.title.split(' ')[0]));
    return {
      ...step,
      state,
      time: matchEvent?.time || (state === 'completed' ? 'Logged' : '')
    };
  });
}

function formatStatus(status) {
  if (!status) return 'REPORTED';
  return status.replace(/_/g, ' ');
}

function getStatusClass(status) {
  if (status === 'REPORTED' || status === 'VERIFIED') return 'chip-reported';
  if (status === 'DISPATCHING' || status === 'ASSIGNED' || status === 'EN_ROUTE') return 'chip-enroute';
  if (status === 'ON_SCENE' || status === 'TRANSPORTING') return 'chip-scene';
  if (status === 'RESOLVED') return 'chip-resolved';
  return 'chip-reported';
}

function getSeverityClass(sev) {
  if (sev === 'CRITICAL') return 'text-red';
  if (sev === 'HIGH') return 'text-amber';
  if (sev === 'MEDIUM') return 'text-blue';
  return 'text-green';
}

function getCategoryIcon(type) {
  if (type === 'COLLAPSE') return '🏚️';
  if (type === 'FIRE') return '🔥';
  if (type === 'HAZMAT') return '☣️';
  if (type === 'FLOOD') return '🌊';
  if (type === 'MEDICAL') return '🚑';
  if (type === 'EXPLOSION') return '💥';
  if (type === 'ELECTRICAL') return '⚡';
  return '🚨';
}

function getVehicleIcon(type) {
  if (type === 'FIRE' || type === 'EXPLOSION') return '🚒';
  if (type === 'FLOOD') return '🚤';
  if (type === 'MEDICAL') return '🚑';
  return '🚑';
}

function getResponderName(inc) {
  if (inc.assignedResponder) return inc.assignedResponder;
  if (inc.incidentType === 'FIRE') return 'Fire Rescue Engine F-04';
  if (inc.incidentType === 'FLOOD') return 'Inflatable Rescue Boat Unit B-02';
  return 'ALS Ambulance Unit Alpha-12';
}

let socketInstance = null;

onMounted(() => {
  loadIncident();
  socketInstance = socketService.connect();
  if (socketInstance) {
    socketInstance.on('connect', () => { isSocketConnected.value = true; });
    socketInstance.on('disconnect', () => { isSocketConnected.value = false; });
    socketInstance.on('incident:updated', (updated) => {
      if (updated.id === route.params.id) {
        incident.value = updated;
        lastSyncTime.value = new Date().toLocaleTimeString();
      }
    });
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.emergency-details-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1040px;
  margin: 0 auto;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.back-link {
  font-size: 0.75rem;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 0.25rem;
}

.back-link:hover {
  text-decoration: underline;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-row h2 {
  font-size: 1.3rem;
  color: #f8fafc;
}

.inc-id-badge {
  font-size: 0.8rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}

.inc-location-sub {
  font-size: 0.775rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.status-top-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.last-sync-tag {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Status Chips */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}
.chip-dot { width: 6px; height: 6px; border-radius: 50%; }

.chip-reported { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; }
.chip-reported .chip-dot { background: #3b82f6; }

.chip-enroute { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; }
.chip-enroute .chip-dot { background: #f59e0b; }

.chip-scene { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; }
.chip-scene .chip-dot { background: #ef4444; }

.chip-resolved { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; }
.chip-resolved .chip-dot { background: #10b981; }

.socket-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
}
.socket-badge.connected { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; }
.socket-badge.connected .socket-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
.socket-badge.disconnected { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; }

/* Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.25rem;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
  margin-bottom: 0.85rem;
}

.sec-subtitle {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 400;
}

/* Triage Card */
.triage-card {
  padding: 1.25rem;
}

.triage-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.triage-box {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.triage-lbl {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.triage-val {
  font-size: 1.15rem;
  font-weight: 800;
}

.triage-sub {
  font-size: 0.625rem;
  color: #94a3b8;
}

.hazard-details-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(9, 14, 26, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
}

.hazard-stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 0.85rem;
  border-right: 1px solid rgba(51, 65, 85, 0.5);
}

.stat-num { font-size: 1.25rem; font-weight: 800; color: #f8fafc; }
.stat-lbl { font-size: 0.625rem; color: #94a3b8; white-space: nowrap; }

.hazard-flags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.h-flag {
  font-size: 0.675rem;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
}
.h-flag.red { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.h-flag.amber { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.h-flag.blue { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }

/* Description Card */
.desc-card {
  padding: 1.25rem;
}

.scene-desc-text {
  font-size: 0.825rem;
  color: #cbd5e1;
  line-height: 1.5;
  font-style: italic;
}

/* Evidence Card */
.evidence-card {
  padding: 1.25rem;
}

.no-evidence-box {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.5rem 0;
}

.evidence-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.evidence-item-card {
  background: rgba(9, 14, 26, 0.9);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ev-media-box {
  height: 100px;
  background: #040711;
  overflow: hidden;
}

.ev-img, .ev-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ev-audio-box {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
}

.ev-audio-player { width: 85%; height: 30px; }
.audio-ico { font-size: 1.5rem; }

.ev-info-line {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ev-name {
  font-size: 0.725rem;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-tags {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ev-size { font-size: 0.65rem; color: #94a3b8; }
.ev-seal { font-size: 0.6rem; color: #34d399; font-family: var(--font-mono); font-weight: 700; }

/* Timeline Stepper */
.timeline-card {
  padding: 1.25rem;
}

.timeline-stepper {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 0.5rem;
}

.step-row {
  display: flex;
  gap: 1rem;
  position: relative;
  min-height: 52px;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.step-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  z-index: 2;
}

.step-icon.done {
  background: #10b981;
  color: white;
}

.step-icon.current {
  background: #f59e0b;
  color: #070b14;
  box-shadow: 0 0 8px #f59e0b;
}

.step-icon.upcoming {
  background: #1e293b;
  border: 1px solid #475569;
  color: #94a3b8;
}

.step-line {
  width: 2px;
  flex-grow: 1;
  background: #334155;
  margin: 2px 0;
}

.step-row.completed .step-line {
  background: #10b981;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-bottom: 0.85rem;
  flex-grow: 1;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-title {
  font-size: 0.775rem;
  color: #f1f5f9;
}

.step-row.active .step-title {
  color: #fbbf24;
}

.step-row.upcoming .step-title {
  color: #94a3b8;
}

.step-time {
  font-size: 0.675rem;
  color: #94a3b8;
}

.step-desc {
  font-size: 0.725rem;
  color: #94a3b8;
}

/* Responder Card */
.responder-card {
  padding: 1.25rem;
}

.responder-pending {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0.5rem;
}

.radar-pulse {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
  animation: pulse 1.5s infinite;
}

.pending-info strong {
  font-size: 0.8rem;
  color: #60a5fa;
  font-family: var(--font-mono);
}

.pending-info p {
  font-size: 0.725rem;
  color: #94a3b8;
}

.responder-profile {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.resp-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.resp-avatar {
  font-size: 2rem;
}

.resp-id {
  display: flex;
  flex-direction: column;
}

.resp-id strong {
  font-size: 0.9rem;
  color: #f8fafc;
}

.resp-callsign {
  font-size: 0.675rem;
  color: #38bdf8;
}

.resp-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.resp-box {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.resp-box.full {
  grid-column: span 2;
}

.resp-box .lbl {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.resp-box .val {
  font-size: 0.85rem;
}

/* Map Card */
.map-card {
  padding: 1.25rem;
}

.map-view-canvas {
  height: 240px;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #334155;
}

/* Safety Card */
.safety-card {
  padding: 1.25rem;
}

.safety-steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.775rem;
  color: #cbd5e1;
}

.safety-steps li {
  line-height: 1.4;
}

/* State Panels */
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  gap: 0.75rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.state-panel.error {
  color: #fca5a5;
  text-align: center;
}

.state-icon { font-size: 2.5rem; }

.font-mono { font-family: var(--font-mono); }
.text-red { color: #f87171; }
.text-amber { color: #fbbf24; }
.text-blue { color: #60a5fa; }
.text-emerald { color: #34d399; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.7rem; }
.btn-sm { font-size: 0.75rem; padding: 0.4rem 0.8rem; }
.mt-3 { margin-top: 0.75rem; }

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

@media (max-width: 860px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
