<template>
  <div class="public-alerts-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2> PUBLIC DISASTER & SAFETY ALERTS</h2>
        <p>Official real-time civil defense advisories, severe hazard alerts, and zone evacuation directives.</p>
      </div>

      <div class="header-actions">
        <div :class="['socket-badge', isSocketConnected ? 'connected' : 'disconnected']">
          <span class="socket-dot"></span>
          <span>{{ isSocketConnected ? 'LIVE ALERTS ACTIVE' : 'LIVE UPDATES DISCONNECTED' }}</span>
        </div>
        <button class="btn btn-ghost btn-xs" @click="loadAlerts" :disabled="loading">
          {{ loading ? 'Refreshing...' : ' Refresh Alerts' }}
        </button>
      </div>
    </div>

    <!-- Severity Filter Bar -->
    <div class="tactical-card filter-card">
      <div class="filter-pills">
        <button
          type="button"
          :class="['pill-btn', { active: activeSeverityFilter === 'ALL' }]"
          @click="activeSeverityFilter = 'ALL'"
        >
          ALL ({{ alerts.length }})
        </button>
        <button
          type="button"
          :class="['pill-btn critical', { active: activeSeverityFilter === 'CRITICAL' }]"
          @click="activeSeverityFilter = 'CRITICAL'"
        >
           CRITICAL ({{ criticalCount }})
        </button>
        <button
          type="button"
          :class="['pill-btn high', { active: activeSeverityFilter === 'HIGH' }]"
          @click="activeSeverityFilter = 'HIGH'"
        >
           HIGH ({{ highCount }})
        </button>
        <button
          type="button"
          :class="['pill-btn medium', { active: activeSeverityFilter === 'MEDIUM' }]"
          @click="activeSeverityFilter = 'MEDIUM'"
        >
           ADVISORY ({{ mediumCount }})
        </button>
      </div>

      <span class="active-count-label font-mono text-xs">
        {{ filteredAlerts.length }} Active Directives
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && alerts.length === 0" class="tactical-card state-panel">
      <div class="spinner-sm"></div>
      <span>LOADING PUBLIC ALERTS...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError && alerts.length === 0" class="tactical-card state-panel error">
      <span class="state-icon">️</span>
      <strong>UNABLE TO LOAD PUBLIC ALERTS</strong>
      <p class="text-xs text-muted">{{ fetchError }}</p>
      <button class="btn btn-primary btn-sm mt-2" @click="loadAlerts">Retry Connection</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAlerts.length === 0" class="tactical-card empty-panel">
      <span class="empty-icon">️</span>
      <h3>NO ACTIVE ALERTS</h3>
      <p>
        {{ activeSeverityFilter === 'ALL'
          ? "No public emergency alerts are currently active in your region. Civil defense monitors remain active 24/7."
          : `No ${activeSeverityFilter.toLowerCase()} alerts active matching this filter.`
        }}
      </p>
      <button class="btn btn-ghost btn-sm mt-2" @click="loadAlerts">
         Refresh Feed
      </button>
    </div>

    <!-- Alerts List -->
    <div v-else class="alerts-list">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        :class="['tactical-card alert-item-card', getSeverityBorderClass(alert.severity), { unread: isNewAlert(alert.id) }]"
        @click="openAlertDetails(alert)"
      >
        <!-- Top Row: Category, Severity, Timestamp -->
        <div class="alert-top-row">
          <div class="alert-type-badges">
            <span class="category-tag">{{ getCategoryIcon(alert.category) }} {{ alert.category || 'CIVIL DEFENSE ALERT' }}</span>
            <span :class="['sev-badge font-mono', getSeverityBadgeClass(alert.severity)]">
              {{ getSeverityIcon(alert.severity) }} {{ alert.severity }}
            </span>
          </div>

          <div class="time-meta font-mono">
            <span>ISSUED {{ alert.issuedTime }}</span>
            <span v-if="alert.updatedTime" class="updated-time">· UPDATED {{ alert.updatedTime }}</span>
          </div>
        </div>

        <!-- Main Alert Body -->
        <div class="alert-body">
          <h3 class="alert-title">{{ alert.title }}</h3>
          <div class="alert-area-tag">
            <span> AFFECTED AREA:</span>
            <strong>{{ alert.affectedArea || alert.district }}</strong>
          </div>
          <p class="alert-msg-text">{{ alert.message }}</p>
        </div>

        <!-- Recommended Action Box -->
        <div v-if="alert.recommendedAction" class="recommended-action-box">
          <span class="action-tag font-mono">️ RECOMMENDED ACTION</span>
          <p class="action-desc">{{ alert.recommendedAction }}</p>
        </div>

        <!-- Footer Row -->
        <div class="alert-footer">
          <span class="alert-id font-mono">{{ alert.id }} · STATUS: {{ alert.status || 'ACTIVE' }}</span>
          <button
            type="button"
            class="btn-open-details"
            @click.stop="openAlertDetails(alert)"
          >
            View Directive & Map →
          </button>
        </div>
      </div>
    </div>

    <!-- Alert Details Modal / Drawer -->
    <div v-if="selectedAlert" class="modal-overlay" @click.self="selectedAlert = null">
      <div class="tactical-card modal-panel">
        <div class="modal-header">
          <div class="modal-title-row">
            <span :class="['sev-badge font-mono', getSeverityBadgeClass(selectedAlert.severity)]">
              {{ getSeverityIcon(selectedAlert.severity) }} {{ selectedAlert.severity }}
            </span>
            <span class="modal-category font-mono">{{ selectedAlert.category }}</span>
          </div>
          <button class="btn-close-modal" @click="selectedAlert = null">✕</button>
        </div>

        <div class="modal-body">
          <h2>{{ selectedAlert.title }}</h2>

          <div class="modal-meta-grid">
            <div class="m-box">
              <span class="m-lbl">AFFECTED AREA</span>
              <strong class="m-val text-white"> {{ selectedAlert.affectedArea || selectedAlert.district }}</strong>
            </div>
            <div class="m-box">
              <span class="m-lbl">TIMELINE</span>
              <span class="m-val font-mono">Issued {{ selectedAlert.issuedTime }} · Updated {{ selectedAlert.updatedTime }}</span>
            </div>
            <div class="m-box">
              <span class="m-lbl">OPERATIONAL STATUS</span>
              <span class="m-val font-mono text-emerald font-bold">● {{ selectedAlert.status || 'ACTIVE DIRECTIVE' }}</span>
            </div>
          </div>

          <!-- Full Official Directive Message -->
          <div class="modal-section">
            <span class="sec-lbl">OFFICIAL DIRECTIVE MESSAGE</span>
            <p class="modal-msg">{{ selectedAlert.message }}</p>
          </div>

          <!-- Recommended Safety Actions -->
          <div v-if="selectedAlert.recommendedAction" class="modal-section safety-directive">
            <span class="sec-lbl text-amber">️ MANDATORY CIVIL SAFETY GUIDANCE</span>
            <p class="safety-text">{{ selectedAlert.recommendedAction }}</p>
          </div>

          <!-- Leaflet Map Container for Affected Zone (if coordinates exist) -->
          <div v-if="selectedAlert.latitude && selectedAlert.longitude" class="modal-map-container">
            <span class="sec-lbl">GEOGRAPHIC IMPACT ZONE</span>
            <div id="alert-leaflet-map" class="alert-map-view"></div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <router-link to="/citizen/report" class="btn btn-primary btn-block text-center" @click="selectedAlert = null">
               Report Incident in this Area
            </router-link>
            <button class="btn btn-ghost btn-block" @click="selectedAlert = null">
              Close Directive
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSocketService } from '../../services/socketService';
import api from '../../services/api';

const socketService = useSocketService();

const alerts = ref([]);
const loading = ref(true);
const fetchError = ref('');
const activeSeverityFilter = ref('ALL');
const isSocketConnected = ref(true);
const selectedAlert = ref(null);
const newAlertIds = ref(new Set());

let modalMap = null;
let modalMarker = null;

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const [lng, lat] = center;
  const coords = [];
  const distanceX = radiusInKm / (111.320 * Math.cos(lat * Math.PI / 180));
  const distanceY = radiusInKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]);
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
}

const criticalCount = computed(() => alerts.value.filter(a => a.severity === 'CRITICAL').length);
const highCount = computed(() => alerts.value.filter(a => a.severity === 'HIGH').length);
const mediumCount = computed(() => alerts.value.filter(a => a.severity === 'MEDIUM').length);

const filteredAlerts = computed(() => {
  if (activeSeverityFilter.value === 'ALL') return alerts.value;
  return alerts.value.filter(a => a.severity === activeSeverityFilter.value);
});

function isNewAlert(id) {
  return newAlertIds.value.has(id);
}

async function loadAlerts() {
  loading.value = true;
  fetchError.value = '';

  try {
    const res = await api.get('/alerts');
    if (res.data?.data) {
      alerts.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load public alerts', err);
    fetchError.value = 'Failed to connect to Public Alert Feed.';
  } finally {
    loading.value = false;
  }
}

async function openAlertDetails(alert) {
  selectedAlert.value = alert;
  newAlertIds.value.delete(alert.id);

  if (alert.latitude && alert.longitude) {
    await nextTick();
    initModalMap(alert);
  }
}

function initModalMap(alert) {
  const container = document.getElementById('alert-leaflet-map');
  if (!container) return;

  if (modalMarker) {
    modalMarker.remove();
    modalMarker = null;
  }

  if (modalMap) {
    modalMap.remove();
    modalMap = null;
  }

  const lat = alert.latitude || 13.0827;
  const lng = alert.longitude || 80.2707;
  const color = alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f59e0b' : '#3b82f6';
  const radiusKm = alert.radiusKm || 2.0;

  modalMap = new maplibregl.Map({
    container: 'alert-leaflet-map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [lng, lat],
    zoom: 13,
    attributionControl: true
  });

  modalMap.on('load', () => {
    const circleGeoJSON = createGeoJSONCircle([lng, lat], radiusKm);

    modalMap.addSource('alert-circle-source', {
      type: 'geojson',
      data: circleGeoJSON
    });

    modalMap.addLayer({
      id: 'alert-circle-fill',
      type: 'fill',
      source: 'alert-circle-source',
      paint: {
        'fill-color': color,
        'fill-opacity': 0.25
      }
    });

    modalMap.addLayer({
      id: 'alert-circle-outline',
      type: 'line',
      source: 'alert-circle-source',
      paint: {
        'line-color': color,
        'line-width': 2
      }
    });

    const el = document.createElement('div');
    el.className = 'alert-pin';
    el.style.background = color;
    el.style.width = '16px';
    el.style.height = '16px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = `0 0 10px ${color}`;

    const popup = new maplibregl.Popup({ offset: [0, -10] }).setHTML(
      `<strong>${alert.title}</strong><br>${alert.affectedArea || alert.district}`
    );

    modalMarker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(modalMap);

    modalMarker.togglePopup();

    setTimeout(() => {
      if (modalMap) modalMap.resize();
    }, 100);
  });
}

function getCategoryIcon(cat) {
  if (!cat) return '';
  const c = cat.toUpperCase();
  if (c.includes('FLOOD')) return '';
  if (c.includes('FIRE')) return '';
  if (c.includes('HAZMAT') || c.includes('CHEMICAL')) return '️';
  if (c.includes('WEATHER') || c.includes('STORM')) return '️';
  if (c.includes('EVACUATION')) return '';
  return '';
}

function getSeverityIcon(sev) {
  if (sev === 'CRITICAL') return '';
  if (sev === 'HIGH') return '';
  if (sev === 'MEDIUM') return '';
  return '';
}

function getSeverityBadgeClass(sev) {
  if (sev === 'CRITICAL') return 'sev-badge-critical';
  if (sev === 'HIGH') return 'sev-badge-high';
  if (sev === 'MEDIUM') return 'sev-badge-medium';
  return 'sev-badge-low';
}

function getSeverityBorderClass(sev) {
  if (sev === 'CRITICAL') return 'border-critical';
  if (sev === 'HIGH') return 'border-high';
  if (sev === 'MEDIUM') return 'border-medium';
  return '';
}

let socketInstance = null;

onMounted(() => {
  loadAlerts();
  socketInstance = socketService.connect();
  if (socketInstance) {
    socketInstance.on('connect', () => { isSocketConnected.value = true; });
    socketInstance.on('disconnect', () => { isSocketConnected.value = false; });
    socketInstance.on('alert:created', (newAlert) => {
      alerts.value.unshift(newAlert);
      newAlertIds.value.add(newAlert.id);
    });
  }
});

onBeforeUnmount(() => {
  if (modalMarker) {
    modalMarker.remove();
    modalMarker = null;
  }
  if (modalMap) {
    modalMap.remove();
    modalMap = null;
  }
});
</script>

<style scoped>
.public-alerts-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
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

  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  text-decoration: underline;
}

.header-card h2 {
  font-size: 1.25rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.socket-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.socket-badge.connected {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}
.socket-badge.connected .socket-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.socket-badge.disconnected {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}
.socket-badge.disconnected .socket-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

/* Filter Card */
.filter-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}

.filter-pills {
  display: flex;
  gap: 0.4rem;
}

.pill-btn {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  color: #cbd5e1;
  font-size: 0.725rem;
  font-family: var(--font-mono);
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn:hover {
  border-color: #3b82f6;
  color: #93c5fd;
}

.pill-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.pill-btn.critical.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
}

.pill-btn.high.active {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #fcd34d;
}

.active-count-label {
  color: #94a3b8;
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  position: relative;
}

.alert-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.alert-item-card.border-critical {
  border-left: 4px solid #ef4444;
}

.alert-item-card.border-high {
  border-left: 4px solid #f59e0b;
}

.alert-item-card.border-medium {
  border-left: 4px solid #3b82f6;
}

.alert-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-type-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-tag {
  font-size: 0.725rem;
  color: #cbd5e1;
  font-weight: 700;
  background: rgba(30, 41, 59, 0.8);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.sev-badge {
  font-size: 0.675rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.sev-badge-critical {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
}

.sev-badge-high {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fbbf24;
}

.sev-badge-medium {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #60a5fa;
}

.time-meta {
  font-size: 0.7rem;
  color: #94a3b8;
}

.alert-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.alert-title {
  font-size: 1.05rem;
  color: #f8fafc;
  font-weight: 700;
}

.alert-area-tag {
  display: flex;
  gap: 0.4rem;
  font-size: 0.775rem;
  color: #38bdf8;
}

.alert-area-tag span {
  font-family: var(--font-mono);
  font-size: 0.675rem;
  color: #94a3b8;
}

.alert-msg-text {
  font-size: 0.825rem;
  color: #cbd5e1;
  line-height: 1.4;
}

/* Recommended Action Box */
.recommended-action-box {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.action-tag {
  font-size: 0.65rem;
  color: #fbbf24;
  font-weight: 700;
}

.action-desc {
  font-size: 0.775rem;
  color: #fef08a;
  line-height: 1.35;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.6rem;
}

.alert-id {
  font-size: 0.675rem;
  color: #94a3b8;
}

.btn-open-details {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.775rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-open-details:hover {
  text-decoration: underline;
  color: #7dd3fc;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #090e1a;
  border: 1px solid #334155;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.75rem;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.modal-category {
  font-size: 0.75rem;
  color: #94a3b8;
}

.btn-close-modal {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  color: #cbd5e1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-body h2 {
  font-size: 1.25rem;
  color: #f8fafc;
}

.modal-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.85rem;
}

.m-box {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.m-lbl { font-size: 0.625rem; font-family: var(--font-mono); color: #94a3b8; }
.m-val { font-size: 0.775rem; }

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sec-lbl {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
}

.modal-msg {
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.45;
}

.safety-directive {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
  padding: 0.85rem;
}

.safety-text {
  font-size: 0.825rem;
  color: #fef08a;
  line-height: 1.4;
  font-weight: 600;
}

.modal-map-container {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.alert-map-view {
  height: 180px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #334155;
  overflow: hidden;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* States */
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  gap: 0.75rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.state-panel.error { color: #fca5a5; }

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3.5rem 1.5rem;
  gap: 0.6rem;
}

.empty-icon { font-size: 3rem; }
.empty-panel h3 { font-size: 1.15rem; color: #f8fafc; }
.empty-panel p { font-size: 0.8rem; color: #94a3b8; max-width: 420px; }

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.font-mono { font-family: var(--font-mono); }
.text-xs { font-size: 0.7rem; }
.text-white { color: #f8fafc; }
.text-amber { color: #fbbf24; }
.text-emerald { color: #34d399; }
.text-muted { color: #94a3b8; }
.btn-sm { font-size: 0.75rem; padding: 0.4rem 0.8rem; }
.btn-xs { font-size: 0.7rem; padding: 0.25rem 0.5rem; }
.btn-block { width: 100%; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .header-actions {
    align-items: flex-start;
    width: 100%;
  }
  .alert-top-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}
</style>
