<template>
  <div class="citizen-risk-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2>🔮 AI RISK & HAZARD FORECAST AWARENESS</h2>
        <p>Predictive hazard telemetry on storm surge pressures, flood risks, and localized crowd surges.</p>
      </div>

      <div class="header-actions">
        <div class="telemetry-badge">
          <span class="pulse-dot"></span>
          <span>LIVE TELEMETRY STREAM</span>
        </div>
        <button class="btn btn-ghost btn-xs" @click="loadRiskPredictions" :disabled="loading">
          {{ loading ? 'Updating...' : '🔄 Refresh Forecasts' }}
        </button>
      </div>
    </div>

    <!-- Official Alert vs AI Forecast Distinction Notice -->
    <div class="tactical-card advisory-notice">
      <div class="notice-left">
        <span class="notice-icon">⚠️</span>
        <div class="notice-text">
          <strong>PREDICTIVE INTELLIGENCE ADVISORY</strong>
          <p>
            AI hazard projections are statistical estimates derived from continuous environmental telemetry and sensor networks.
            <strong>Official Civil Defense orders (Public Alerts) always take precedence.</strong>
          </p>
        </div>
      </div>
      <router-link to="/citizen/alerts" class="btn btn-ghost btn-xs whitespace-nowrap">
        View Official Alerts →
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="tactical-card state-panel">
      <div class="spinner-sm"></div>
      <span>EVALUATING SENSOR TELEMETRY & RISK MODELS...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="tactical-card state-panel error">
      <span class="state-icon">⚠️</span>
      <strong>RISK DATA UNAVAILABLE</strong>
      <p class="text-xs text-muted">{{ fetchError }}</p>
      <button class="btn btn-primary btn-sm mt-2" @click="loadRiskPredictions">Retry Connection</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="riskZones.length === 0" class="tactical-card empty-panel">
      <span class="empty-icon">🛡️</span>
      <h3>NO CURRENT RISK FORECAST</h3>
      <p>Risk prediction data is currently unavailable. Environmental sensor streams report baseline normal levels.</p>
      <button class="btn btn-ghost btn-sm mt-2" @click="loadRiskPredictions">
        🔄 Refresh Streams
      </button>
    </div>

    <!-- Main Grid: Risk Cards & Interactive Tactical Map -->
    <div v-else class="risk-grid">
      <!-- Left Column: Forecast Cards List -->
      <div class="forecasts-column">
        <div
          v-for="zone in riskZones"
          :key="zone.id"
          :class="['tactical-card risk-card', getBorderClass(zone.riskLevel), { active: selectedZone?.id === zone.id }]"
          @click="selectZone(zone)"
        >
          <!-- Top Row: District, Risk Level, Score -->
          <div class="risk-card-top">
            <div class="zone-id-row">
              <span class="zone-name">{{ zone.district }}</span>
              <span :class="['risk-chip font-mono', getRiskChipClass(zone.riskLevel)]">
                {{ getRiskIcon(zone.riskLevel) }} {{ zone.riskLevel }} RISK
              </span>
            </div>

            <div class="score-badge font-mono">
              <span class="score-lbl">RISK SCORE</span>
              <strong class="score-num">{{ zone.riskScore }}/100</strong>
            </div>
          </div>

          <!-- Risk Title & Summary -->
          <div class="risk-body">
            <h3 class="risk-title">{{ zone.riskTitle }}</h3>
            <p class="risk-summary-text">{{ zone.summary }}</p>
          </div>

          <!-- Metrics Row: Horizon, Confidence, Trend -->
          <div class="metrics-row">
            <div class="metric-item">
              <span class="m-lbl">FORECAST WINDOW</span>
              <strong class="m-val font-mono">{{ zone.timeHorizon }}</strong>
            </div>

            <div class="metric-item">
              <span class="m-lbl">MODEL CONFIDENCE</span>
              <strong class="m-val font-mono text-emerald">{{ zone.confidence }}%</strong>
            </div>

            <div class="metric-item">
              <span class="m-lbl">TREND</span>
              <strong :class="['m-val font-mono', getTrendClass(zone.trend)]">
                {{ getTrendIcon(zone.trend) }} {{ zone.trend }}
              </strong>
            </div>

            <div class="metric-item">
              <span class="m-lbl">CROWD PRESSURE</span>
              <strong class="m-val font-mono">{{ zone.crowdSurgeRisk }}</strong>
            </div>
          </div>

          <!-- Safety Guidance Box -->
          <div v-if="zone.safetyGuidance" class="safety-guidance-box">
            <span class="guide-tag font-mono">ADVISORY GUIDANCE:</span>
            <p class="guide-text">{{ zone.safetyGuidance }}</p>
          </div>

          <!-- Card Footer: Stale Indicator & Official Alert Link -->
          <div class="risk-card-footer">
            <div class="footer-left">
              <span class="time-tag font-mono">Updated {{ formatRelativeTime(zone.updatedAt) }}</span>
              <span v-if="isStale(zone.updatedAt)" class="stale-badge font-mono">DATA MAY BE OUTDATED</span>
            </div>

            <router-link
              v-if="zone.relatedAlertId"
              to="/citizen/alerts"
              class="link-official-alert font-mono"
              @click.stop
            >
              📢 View Official Alert ({{ zone.relatedAlertId }}) →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Right Column: Tactical Impact Zone Map -->
      <div class="map-column">
        <div class="tactical-card map-card">
          <div class="section-title">
            <span>TACTICAL IMPACT ZONE MAP</span>
            <span class="sec-sub font-mono">{{ selectedZone ? selectedZone.district : 'Select a Zone' }}</span>
          </div>

          <div id="risk-impact-map" class="risk-map-canvas"></div>

          <div v-if="selectedZone" class="map-legend-box">
            <div class="legend-header">
              <strong>{{ selectedZone.district }} Perimeter</strong>
              <span class="radius-tag font-mono">Radius: {{ selectedZone.radiusKm || 2 }} km</span>
            </div>
            <p class="legend-desc">{{ selectedZone.summary }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import api from '../../services/api';

const riskZones = ref([]);
const selectedZone = ref(null);
const loading = ref(true);
const fetchError = ref('');

let mapInstance = null;
let centerMarker = null;

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

async function loadRiskPredictions() {
  loading.value = true;
  fetchError.value = '';

  try {
    const res = await api.get('/prediction/risk-zones');
    if (res.data?.data) {
      riskZones.value = res.data.data;
      if (riskZones.value.length > 0) {
        selectedZone.value = riskZones.value[0];
      }
    }
  } catch (err) {
    console.error('Failed to load risk prediction forecasts', err);
    fetchError.value = 'Failed to connect to AI Risk Telemetry Engine.';
  } finally {
    loading.value = false;
    if (riskZones.value.length > 0 && selectedZone.value) {
      await nextTick();
      initMap();
    }
  }
}

function selectZone(zone) {
  selectedZone.value = zone;
  if (!mapInstance) {
    initMap();
  } else {
    updateMap(zone);
  }
}

function initMap() {
  const container = document.getElementById('risk-impact-map');
  if (!container || !selectedZone.value) return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const lat = selectedZone.value.latitude || 13.0827;
  const lng = selectedZone.value.longitude || 80.2707;

  mapInstance = new maplibregl.Map({
    container: 'risk-impact-map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [lng, lat],
    zoom: 13,
    attributionControl: true
  });

  mapInstance.on('load', () => {
    const zone = selectedZone.value;
    const color = zone.riskLevel === 'CRITICAL' ? '#ef4444' : zone.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6';
    const circleGeoJSON = createGeoJSONCircle([lng, lat], zone.radiusKm || 2.0);

    mapInstance.addSource('risk-circle-source', {
      type: 'geojson',
      data: circleGeoJSON
    });

    mapInstance.addLayer({
      id: 'risk-circle-fill',
      type: 'fill',
      source: 'risk-circle-source',
      paint: {
        'fill-color': color,
        'fill-opacity': 0.25
      }
    });

    mapInstance.addLayer({
      id: 'risk-circle-outline',
      type: 'line',
      source: 'risk-circle-source',
      paint: {
        'line-color': color,
        'line-width': 2
      }
    });

    updateMap(selectedZone.value);
    setTimeout(() => {
      if (mapInstance) mapInstance.resize();
    }, 100);
  });
}

function updateMap(zone) {
  if (!mapInstance || !zone) return;

  const lat = zone.latitude || 13.0827;
  const lng = zone.longitude || 80.2707;
  const color = zone.riskLevel === 'CRITICAL' ? '#ef4444' : zone.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6';

  // Update GeoJSON source
  if (mapInstance.getSource('risk-circle-source')) {
    const circleGeoJSON = createGeoJSONCircle([lng, lat], zone.radiusKm || 2.0);
    mapInstance.getSource('risk-circle-source').setData(circleGeoJSON);

    if (mapInstance.getLayer('risk-circle-fill')) {
      mapInstance.setPaintProperty('risk-circle-fill', 'fill-color', color);
    }
    if (mapInstance.getLayer('risk-circle-outline')) {
      mapInstance.setPaintProperty('risk-circle-outline', 'line-color', color);
    }
  }

  // Update Marker
  if (centerMarker) {
    centerMarker.remove();
    centerMarker = null;
  }

  const el = document.createElement('div');
  el.className = 'risk-center-pin';
  el.style.background = color;
  el.style.width = '16px';
  el.style.height = '16px';
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.boxShadow = `0 0 10px ${color}`;

  const popup = new maplibregl.Popup({ offset: [0, -10] }).setHTML(
    `<strong>${zone.district}</strong><br>${zone.riskTitle}`
  );

  centerMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(mapInstance);

  centerMarker.togglePopup();

  mapInstance.flyTo({
    center: [lng, lat],
    zoom: 13,
    essential: true
  });
}

function getRiskIcon(lvl) {
  if (lvl === 'CRITICAL') return '🔴';
  if (lvl === 'HIGH') return '🟡';
  if (lvl === 'MEDIUM') return '🔵';
  return '🟢';
}

function getRiskChipClass(lvl) {
  if (lvl === 'CRITICAL') return 'chip-critical';
  if (lvl === 'HIGH') return 'chip-high';
  if (lvl === 'MEDIUM') return 'chip-medium';
  return 'chip-low';
}

function getBorderClass(lvl) {
  if (lvl === 'CRITICAL') return 'border-critical';
  if (lvl === 'HIGH') return 'border-high';
  return 'border-medium';
}

function getTrendIcon(trend) {
  if (trend === 'INCREASING') return '↗';
  if (trend === 'DECREASING') return '↘';
  return '→';
}

function getTrendClass(trend) {
  if (trend === 'INCREASING') return 'text-red';
  if (trend === 'DECREASING') return 'text-emerald';
  return 'text-amber';
}

function formatRelativeTime(iso) {
  if (!iso) return 'Just now';
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  return `${diffMins} mins ago`;
}

function isStale(iso) {
  if (!iso) return false;
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return diffMins >= 20;
}

onMounted(() => {
  loadRiskPredictions();
});

onBeforeUnmount(() => {
  if (centerMarker) {
    centerMarker.remove();
    centerMarker = null;
  }
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<style scoped>
.citizen-risk-view {
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
  gap: 0.4rem;
}

.telemetry-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

/* Advisory Notice Banner */
.advisory-notice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-left: 4px solid #3b82f6;
  gap: 1rem;
}

.notice-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notice-icon {
  font-size: 1.5rem;
}

.notice-text strong {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: #60a5fa;
  display: block;
}

.notice-text p {
  font-size: 0.775rem;
  color: #cbd5e1;
  line-height: 1.35;
}

/* Grid Layout */
.risk-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 1.25rem;
}

.forecasts-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.risk-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  background: rgba(15, 23, 42, 0.75);
}

.risk-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.6);
}

.risk-card.active {
  border-color: #38bdf8;
  background: rgba(15, 23, 42, 0.95);
}

.risk-card.border-critical { border-left: 4px solid #ef4444; }
.risk-card.border-high { border-left: 4px solid #f59e0b; }
.risk-card.border-medium { border-left: 4px solid #3b82f6; }

.risk-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-id-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zone-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #f8fafc;
}

.risk-chip {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.chip-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
.chip-high { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.chip-medium { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }

.score-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.score-lbl { font-size: 0.6rem; color: #94a3b8; }
.score-num { font-size: 1.1rem; color: #f8fafc; }

.risk-title {
  font-size: 0.9rem;
  color: #f1f5f9;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.risk-summary-text {
  font-size: 0.8rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  background: rgba(9, 14, 26, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  padding: 0.6rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.m-lbl { font-size: 0.575rem; color: #94a3b8; font-family: var(--font-mono); }
.m-val { font-size: 0.75rem; color: #f1f5f9; }

.safety-guidance-box {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.guide-tag {
  font-size: 0.625rem;
  color: #fbbf24;
  font-weight: 700;
}

.guide-text {
  font-size: 0.75rem;
  color: #fef08a;
  line-height: 1.35;
}

.risk-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.5rem;
  font-size: 0.7rem;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-tag { color: #94a3b8; }
.stale-badge {
  color: #f59e0b;
  font-size: 0.625rem;
  background: rgba(245, 158, 11, 0.15);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.link-official-alert {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.7rem;
}

.link-official-alert:hover {
  text-decoration: underline;
}

/* Map Column */
.map-column {
  display: flex;
  flex-direction: column;
}

.map-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
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
  padding-bottom: 0.4rem;
}

.sec-sub { font-size: 0.675rem; color: #94a3b8; }

.risk-map-canvas {
  height: 320px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #334155;
  overflow: hidden;
}

.map-legend-box {
  background: rgba(9, 14, 26, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
  color: #f8fafc;
}

.radius-tag { font-size: 0.65rem; color: #38bdf8; }
.legend-desc { font-size: 0.725rem; color: #94a3b8; line-height: 1.35; }

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
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.font-mono { font-family: var(--font-mono); }
.text-red { color: #f87171; }
.text-emerald { color: #34d399; }
.text-amber { color: #fbbf24; }
.text-xs { font-size: 0.7rem; }
.text-muted { color: #94a3b8; }
.btn-sm { font-size: 0.75rem; padding: 0.35rem 0.75rem; }
.btn-xs { font-size: 0.7rem; padding: 0.2rem 0.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 860px) {
  .risk-grid {
    grid-template-columns: 1fr;
  }
  .metrics-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
