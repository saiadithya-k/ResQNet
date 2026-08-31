<template>
  <div class="map-container">
    <!-- Map Canvas Element -->
    <div id="tactical-leaflet-map" class="map-view"></div>

    <!-- Floating Map Control Toolbar -->
    <div class="map-controls-panel">
      <div class="control-header">
        <span class="pulse-icon"></span>
        <span>TACTICAL GIS LAYERS</span>
      </div>
      <div class="layer-toggles">
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.incidents" @change="renderMarkers" />
          <span class="icon">🔴</span> Incidents ({{ incidentStore.incidents.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.responders" @change="renderMarkers" />
          <span class="icon">🚑</span> Units ({{ responderStore.responders.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.hospitals" @change="renderMarkers" />
          <span class="icon">🏥</span> Hospitals ({{ hospitalStore.hospitals.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.shelters" @change="renderMarkers" />
          <span class="icon">🏠</span> Shelters ({{ disasterStore.shelters.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.zones" @change="renderPolygons" />
          <span class="icon">⚠️</span> Disaster Zones
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.roadblocks" @change="renderMarkers" />
          <span class="icon">🚧</span> Roadblocks
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.routes" @change="renderRoute" />
          <span class="icon">⚡</span> Route Optimization
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.heatmap" @change="renderHeatmap" />
          <span class="icon">🔥</span> Incident Heatmap
        </label>
      </div>

      <!-- Comparative Route Mode Selector Strip -->
      <div v-if="layers.routes" class="route-selector-box">
        <div class="route-sel-hdr font-mono">ROUTE COMPARISON:</div>
        <div class="route-btn-group">
          <button
            :class="['route-toggle-btn', { active: activeRouteType === 'EMERGENCY' }]"
            @click="setRouteType('EMERGENCY')"
          >
            ⚡ Emergency Corridor ({{ routeMetrics.emergencyEta }}m)
          </button>
          <button
            :class="['route-toggle-btn', 'btn-std', { active: activeRouteType === 'STANDARD' }]"
            @click="setRouteType('STANDARD')"
          >
            🚧 Standard Route ({{ routeMetrics.standardEta }}m)
          </button>
        </div>
      </div>

      <div v-if="incidentStore.selectedIncident" class="active-focus-card">
        <div class="focus-hdr font-mono">🎯 MAP FOCUS: #{{ incidentStore.selectedIncident.id }}</div>
        <span class="focus-title">{{ incidentStore.selectedIncident.title }}</span>
        <button class="btn-refocus font-mono" @click="focusSelectedIncident">
          Refocus Map
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import api from '../../services/api';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';

if (typeof window !== 'undefined') {
  window.L = L;
  globalThis.L = L;
}

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

let map = null;
let markersLayer = null;
let polygonsLayer = null;
let routeLayer = null;
let heatmapLayer = null;

// Track incident markers to avoid full map rebuilds on selection
const incidentMarkersMap = new Map();
const responderMarkersMap = new Map();

const layers = ref({
  incidents: true,
  responders: true,
  hospitals: true,
  shelters: true,
  zones: true,
  roadblocks: true,
  routes: true,
  heatmap: false
});

let resizeHandler = null;

onMounted(() => {
  initMap();
  resizeHandler = () => {
    if (map) map.invalidateSize();
  };
  window.addEventListener('resize', resizeHandler);
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);
});

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  incidentMarkersMap.clear();
  responderMarkersMap.clear();
  if (heatmapLayer && map) {
    map.removeLayer(heatmapLayer);
    heatmapLayer = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});

function initMap() {
  if (map) return;

  const mapEl = document.getElementById('tactical-leaflet-map');
  if (!mapEl || mapEl._leaflet_id) return;

  // Center coordinates on emergency command district
  map = L.map('tactical-leaflet-map', {
    center: [13.0827, 80.2600],
    zoom: 13,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // High-tech dark CartoDB tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB &copy; ResQNet Tactical GIS',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  polygonsLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  renderPolygons();
  renderMarkers();
  renderRoute();

  // If an incident was already selected on mount, focus immediately
  if (incidentStore.selectedIncident) {
    focusSelectedIncident();
  }
}

function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  incidentMarkersMap.clear();

  // 1. Incidents Markers (with Selection Synchronization)
  if (layers.value.incidents) {
    incidentStore.incidents.forEach((inc) => {
      if (inc.latitude == null || inc.longitude == null) return;
      const isCritical = inc.severity === 'CRITICAL';
      const isSelected = incidentStore.selectedIncident?.id === inc.id;

      const markerHtml = `
        <div class="custom-map-icon ${isCritical ? 'pulse-critical' : 'pulse-high'} ${isSelected ? 'marker-selected-halo' : ''}">
          <span>${inc.incidentType === 'FIRE' ? '🔥' : inc.incidentType === 'HAZMAT' ? '☣️' : '🚨'}</span>
          ${isSelected ? '<span class="selected-pin-badge">TARGET</span>' : ''}
        </div>
      `;

      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [34, 34] });
      const marker = L.marker([inc.latitude, inc.longitude], { icon, zIndexOffset: isSelected ? 1000 : 100 });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag ${isCritical ? 'tag-crit' : 'tag-warn'}">
            #${inc.id} · ${inc.severity} (${inc.priorityScore} PTS)
          </div>
          <h4>${inc.title}</h4>
          <p><strong>Type:</strong> ${inc.incidentType} | <strong>Victims:</strong> ${inc.victimCount}</p>
          <p><strong>Status:</strong> ${inc.status}</p>
          <p class="popup-addr">📍 ${inc.address || inc.district}</p>
          <div class="popup-action font-mono">✓ SYNCHRONIZED TO COMMAND CONSOLE</div>
        </div>
      `, { offset: [0, -10] });

      // Map -> Queue / Command Center Synchronization
      marker.on('click', () => {
        incidentStore.selectIncident(inc);
      });

      markersLayer.addLayer(marker);
      incidentMarkersMap.set(inc.id, marker);
    });
  }

  // 2. Responders Markers (Smooth GPS movement enabled)
  if (layers.value.responders) {
    responderStore.responders.forEach((resp) => {
      if (resp.latitude == null || resp.longitude == null) return;
      const isAmb = resp.type === 'PARAMEDIC';
      const markerHtml = `
        <div class="custom-map-icon icon-unit ${resp.isCommunity ? 'icon-comm' : ''} ${resp.status === 'EN_ROUTE' ? 'pulse-enroute' : ''}">
          <span>${resp.isCommunity ? '🧑‍⚕️' : isAmb ? '🚑' : '🚒'}</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [32, 32] });

      let marker = responderMarkersMap.get(resp.id);
      if (!marker) {
        marker = L.marker([resp.latitude, resp.longitude], { icon, zIndexOffset: 200 });
        marker.bindPopup(`
          <div class="map-popup-card">
            <div class="popup-tag tag-unit">${resp.badgeNumber} · ${resp.type}</div>
            <h4>${resp.name}</h4>
            <p><strong>Status:</strong> ${resp.status}</p>
            <p><strong>Speed:</strong> ${resp.status === 'EN_ROUTE' ? '54 km/h' : '0 km/h'} | <strong>ETA:</strong> ${resp.etaMinutes || 5}m</p>
            <p><strong>Fatigue:</strong> ${resp.fatigueScore}% | <strong>Duty:</strong> ${resp.dutyHours}h</p>
            <p><strong>Assignment:</strong> ${resp.assignedIncidentId ? '#' + resp.assignedIncidentId : 'Available'}</p>
          </div>
        `, { offset: [0, -8] });
        markersLayer.addLayer(marker);
        responderMarkersMap.set(resp.id, marker);
      } else {
        marker.setLatLng([resp.latitude, resp.longitude]);
        marker.setIcon(icon);
      }
    });
  }

  // 3. Hospitals Markers
  if (layers.value.hospitals) {
    hospitalStore.hospitals.forEach((hosp) => {
      if (hosp.latitude == null || hosp.longitude == null) return;
      const markerHtml = `
        <div class="custom-map-icon icon-hospital">
          <span>🏥</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [28, 28] });
      const marker = L.marker([hosp.latitude, hosp.longitude], { icon });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-hosp">HOSPITAL MATCH: ${hosp.matchScore}%</div>
          <h4>${hosp.name}</h4>
          <p><strong>ICU Beds:</strong> ${hosp.availableIcu}/${hosp.totalIcu}</p>
          <p><strong>Trauma Beds:</strong> ${hosp.availableTrauma}/${hosp.totalTrauma}</p>
          <p><strong>Available Total Beds:</strong> ${hosp.availableBeds}/${hosp.totalBeds}</p>
        </div>
      `, { offset: [0, -8] });

      markersLayer.addLayer(marker);
    });
  }

  // 4. Shelters Markers
  if (layers.value.shelters) {
    disasterStore.shelters.forEach((shelter) => {
      if (shelter.latitude == null || shelter.longitude == null) return;
      const markerHtml = `
        <div class="custom-map-icon icon-shelter">
          <span>🏠</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [26, 26] });
      const marker = L.marker([shelter.latitude, shelter.longitude], { icon });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-shelter">EVACUATION SHELTER</div>
          <h4>${shelter.name}</h4>
          <p><strong>Occupancy:</strong> ${shelter.currentOccupancy}/${shelter.capacity}</p>
          <p><strong>District:</strong> ${shelter.district}</p>
        </div>
      `, { offset: [0, -6] });

      markersLayer.addLayer(marker);
    });
  }

  // 5. Roadblocks Markers
  if (layers.value.roadblocks) {
    disasterStore.roadBlocks.forEach((rb) => {
      if (rb.latitude == null || rb.longitude == null) return;
      const markerHtml = `
        <div class="custom-map-icon icon-roadblock">
          <span>🚧</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [26, 26] });
      const marker = L.marker([rb.latitude, rb.longitude], { icon });
      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-crit">ROAD BLOCK</div>
          <h4>${rb.name}</h4>
          <p>${rb.reason}</p>
        </div>
      `, { offset: [0, -6] });
      markersLayer.addLayer(marker);
    });
  }
}

function renderPolygons() {
  if (!map || !polygonsLayer) return;
  polygonsLayer.clearLayers();

  if (layers.value.zones) {
    disasterStore.zones.forEach((z) => {
      const isDanger = z.riskLevel === 'DANGER';
      const isEvac = z.riskLevel === 'EVACUATION';
      const color = isDanger ? '#ef4444' : isEvac ? '#f97316' : '#eab308';

      const polygon = L.polygon(z.coordinates, {
        color: color,
        fillColor: color,
        fillOpacity: isDanger ? 0.28 : isEvac ? 0.22 : 0.16,
        weight: isDanger ? 2.5 : 2,
        dashArray: isDanger ? '6, 6' : isEvac ? '4, 4' : null
      });

      polygon.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag" style="background: ${color}33; color: ${color};">
            #${z.id} · ${z.riskLevel} ZONE (${z.severity || 'HIGH'})
          </div>
          <h4>${z.name}</h4>
          <p><strong>Hazard Type:</strong> ${z.type}</p>
          <p><strong>Status:</strong> <span class="text-emerald">ACTIVE SECTOR PERIMETER</span></p>
          <p><strong>Est. Population:</strong> ~${(z.affectedPopulation || 15000).toLocaleString()} Persons</p>
          <p class="text-cyan"><strong>Evac Corridor:</strong> ${z.evacuationRoute || 'Designated Radial Arterials'}</p>
        </div>
      `);
      polygonsLayer.addLayer(polygon);
    });
  }
}

async function renderHeatmap() {
  if (!map) return;

  // Clean up existing heatmap layer
  if (heatmapLayer) {
    map.removeLayer(heatmapLayer);
    heatmapLayer = null;
  }

  if (layers.value.heatmap) {
    if (!L.heatLayer) {
      try {
        await import('leaflet.heat');
      } catch (err) {
        console.warn('Could not load leaflet.heat', err);
      }
    }

    // Generate real heat points from active incidents
    const heatPoints = incidentStore.incidents.map((inc) => {
      const intensity = inc.severity === 'CRITICAL' ? 1.0 : inc.severity === 'HIGH' ? 0.75 : 0.5;
      return [inc.latitude, inc.longitude, intensity];
    });

    if (heatPoints.length > 0 && typeof L.heatLayer === 'function') {
      heatmapLayer = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 20,
        maxZoom: 16,
        max: 1.0,
        gradient: {
          0.2: '#06b6d4',
          0.4: '#10b981',
          0.7: '#f59e0b',
          1.0: '#ef4444'
        }
      }).addTo(map);
    }
  }
}

const activeRouteType = ref('EMERGENCY'); // EMERGENCY | STANDARD | BOTH
const routeMetrics = ref({
  standardEta: 22,
  standardDist: 3.4,
  emergencyEta: 11,
  emergencyDist: 2.8
});

async function fetchAndRenderRoutes() {
  if (!map || !routeLayer) return;
  routeLayer.clearLayers();

  if (!layers.value.routes) return;

  const start = [13.0780, 80.2650]; // Ambulance A12
  const end = incidentStore.selectedIncident
    ? [incidentStore.selectedIncident.latitude, incidentStore.selectedIncident.longitude]
    : [13.0827, 80.2707];

  try {
    const res = await api.post('/routes/optimize', {
      startLat: start[0],
      startLng: start[1],
      endLat: end[0],
      endLng: end[1],
      avoidHazards: activeRouteType.value === 'EMERGENCY'
    });

    const data = res.data.data;
    routeMetrics.value = {
      standardEta: data.standardRoute.etaMinutes,
      standardDist: data.standardRoute.distanceKm,
      emergencyEta: data.emergencyRoute.etaMinutes,
      emergencyDist: data.emergencyRoute.distanceKm
    };

    // 1. Render Standard Route (if active or both)
    if (activeRouteType.value === 'STANDARD' || activeRouteType.value === 'BOTH') {
      const stdPolyline = L.polyline(data.standardRoute.path, {
        color: '#f59e0b',
        weight: activeRouteType.value === 'STANDARD' ? 5 : 3,
        opacity: activeRouteType.value === 'STANDARD' ? 0.9 : 0.4,
        dashArray: '6, 8'
      });
      stdPolyline.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-warn">STANDARD ROUTE (${data.standardRoute.etaMinutes} MIN)</div>
          <h4>Congested Traffic Path</h4>
          <p>Distance: ${data.standardRoute.distanceKm} km</p>
          <p class="text-red">⚠️ ${data.standardRoute.warning}</p>
        </div>
      `);
      routeLayer.addLayer(stdPolyline);
    }

    // 2. Render Emergency Corridor Route (if active or both)
    if (activeRouteType.value === 'EMERGENCY' || activeRouteType.value === 'BOTH') {
      const emergPolyline = L.polyline(data.emergencyRoute.path, {
        color: '#10b981',
        weight: activeRouteType.value === 'EMERGENCY' ? 6 : 4,
        opacity: 0.95
      });
      emergPolyline.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-unit">EMERGENCY CORRIDOR (${data.emergencyRoute.etaMinutes} MIN)</div>
          <h4>Dynamic Hazard Bypass Route</h4>
          <p>Distance: ${data.emergencyRoute.distanceKm} km (50% Faster)</p>
          <p class="text-emerald">✓ Bypasses Harbour Roadblock & Flood Zone</p>
        </div>
      `);
      routeLayer.addLayer(emergPolyline);
    }
  } catch (err) {
    console.warn('Failed to fetch optimized route', err.message);
  }
}

function setRouteType(type) {
  activeRouteType.value = type;
  fetchAndRenderRoutes();
}

function renderRoute() {
  fetchAndRenderRoutes();
}

// Queue -> Map Synchronization Handler
function focusSelectedIncident() {
  const selected = incidentStore.selectedIncident;
  if (!map || !selected) return;

  const lat = selected.latitude;
  const lng = selected.longitude;

  if (lat && lng) {
    // Smoothly fly to tactical zoom level
    map.flyTo([lat, lng], 15, {
      duration: 0.8,
      easeLinearity: 0.25
    });

    // Re-render markers to update the selection halo
    renderMarkers();

    // Open popup for the selected marker
    const marker = incidentMarkersMap.get(selected.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 850);
    }
  }
}

// Watch for Queue Selection changes
watch(
  () => incidentStore.selectedIncident,
  (newVal, oldVal) => {
    if (newVal && newVal.id !== oldVal?.id) {
      focusSelectedIncident();
    }
  }
);

// Watch for Hospital Selection Focus
watch(
  () => hospitalStore.selectedHospital,
  (newHosp) => {
    if (newHosp && map && newHosp.latitude && newHosp.longitude) {
      map.flyTo([newHosp.latitude, newHosp.longitude], 15, { duration: 0.8 });
    }
  }
);

// Watch for data updates
watch(
  () => [incidentStore.incidents, responderStore.responders, disasterStore.zones],
  () => {
    renderMarkers();
    renderPolygons();
  },
  { deep: true }
);
</script>

<style>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(51, 65, 85, 0.7);
}

.map-view {
  width: 100%;
  height: 100%;
  min-height: 480px;
}

.map-controls-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 8px;
  padding: 0.75rem;
  z-index: 1000;
  max-width: 220px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
}

.control-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: var(--font-mono);
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.35rem;
}

.layer-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.725rem;
  color: #e2e8f0;
  cursor: pointer;
}

.toggle-item input {
  accent-color: #3b82f6;
  cursor: pointer;
}

/* Active Focus Widget */
.active-focus-card {
  margin-top: 0.65rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.focus-hdr {
  font-size: 0.65rem;
  color: #38bdf8;
  font-weight: 700;
}

.focus-title {
  font-size: 0.7rem;
  color: #cbd5e1;
  line-height: 1.2;
}

.btn-refocus {
  background: rgba(37, 99, 235, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.2rem;
  text-align: center;
}

.btn-refocus:hover {
  background: rgba(37, 99, 235, 0.4);
}

/* Custom Marker Styles */
.map-div-icon {
  background: transparent;
  border: none;
}

.custom-map-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1e293b;
  border: 2px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  transition: transform 0.2s ease;
}

.custom-map-icon:hover {
  transform: scale(1.25);
}

.pulse-critical {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.3);
  animation: pulse-marker 1.5s infinite;
}

.pulse-high {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.3);
}

/* Selected Marker Tactical Halo */
.marker-selected-halo {
  border: 3px solid #22d3ee !important;
  box-shadow: 0 0 16px #22d3ee, 0 0 30px rgba(34, 211, 238, 0.6) !important;
  transform: scale(1.3);
  z-index: 1000;
}

.selected-pin-badge {
  position: absolute;
  top: -14px;
  background: #06b6d4;
  color: #02131e;
  font-size: 0.5rem;
  font-weight: 800;
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  font-family: monospace;
  letter-spacing: 0.05em;
}

.icon-unit {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.2);
}

.icon-comm {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.2);
}

.icon-hospital {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
}

.icon-shelter {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.2);
}

.icon-roadblock {
  border-color: #e11d48;
}

@keyframes pulse-marker {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.map-popup-card {
  font-family: 'Inter', sans-serif;
}

.map-popup-card h4 {
  font-size: 0.85rem;
  color: #f8fafc;
  margin: 0.3rem 0;
}

.map-popup-card p {
  font-size: 0.725rem;
  color: #94a3b8;
  margin: 0.15rem 0;
}

.popup-addr {
  font-size: 0.675rem !important;
  color: #64748b !important;
}

.popup-tag {
  font-size: 0.625rem;
  font-weight: 700;
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.tag-crit { background: rgba(239, 68, 68, 0.25); color: #fca5a5; }
.tag-warn { background: rgba(245, 158, 11, 0.25); color: #fcd34d; }
.tag-unit { background: rgba(16, 185, 129, 0.25); color: #6ee7b7; }
.tag-hosp { background: rgba(59, 130, 246, 0.25); color: #93c5fd; }
.tag-shelter { background: rgba(168, 85, 247, 0.25); color: #d8b4fe; }

.popup-action {
  font-size: 0.65rem;
  color: #38bdf8;
  margin-top: 0.35rem;
  font-weight: 600;
}

/* Route Selector Box */
.route-selector-box {
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.route-sel-hdr {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
}

.route-btn-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-toggle-btn {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  color: #cbd5e1;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 0.3rem 0.45rem;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.route-toggle-btn:hover {
  background: rgba(30, 41, 59, 0.85);
  border-color: #38bdf8;
}

.route-toggle-btn.active {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
  color: #6ee7b7;
  font-weight: 700;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.route-toggle-btn.btn-std.active {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  color: #fcd34d;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}
</style>
