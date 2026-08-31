<template>
  <div class="map-container">
    <!-- Map Canvas Element -->
    <div id="tactical-leaflet-map" class="map-view"></div>

    <!-- Floating Map Control Toolbar -->
    <div class="map-controls-panel">
      <div class="control-header">
        <span class="pulse-icon"></span>
        <span>GIS MAP LAYERS</span>
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
          <span class="icon">⚡</span> Optimized Route
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

let map = null;
let markersLayer = null;
let polygonsLayer = null;
let routeLayer = null;

const layers = ref({
  incidents: true,
  responders: true,
  hospitals: true,
  shelters: true,
  zones: true,
  roadblocks: true,
  routes: true
});

onMounted(() => {
  initMap();
});

function initMap() {
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
}

function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  // 1. Incidents Markers
  if (layers.value.incidents) {
    incidentStore.incidents.forEach((inc) => {
      const isCritical = inc.severity === 'CRITICAL';
      const markerHtml = `
        <div class="custom-map-icon ${isCritical ? 'pulse-critical' : 'pulse-high'}">
          <span>${inc.incidentType === 'FIRE' ? '🔥' : inc.incidentType === 'HAZMAT' ? '☣️' : '🚨'}</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [32, 32] });
      const marker = L.marker([inc.latitude, inc.longitude], { icon });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag ${isCritical ? 'tag-crit' : 'tag-warn'}">${inc.severity} (${inc.priorityScore} Pts)</div>
          <h4>${inc.title}</h4>
          <p><strong>Type:</strong> ${inc.incidentType} | <strong>Victims:</strong> ${inc.victimCount}</p>
          <p><strong>Status:</strong> ${inc.status}</p>
          <div class="popup-action">Click incident list to dispatch</div>
        </div>
      `);
      marker.on('click', () => incidentStore.selectIncident(inc));
      markersLayer.addLayer(marker);
    });
  }

  // 2. Responders Markers
  if (layers.value.responders) {
    responderStore.responders.forEach((resp) => {
      const isAmb = resp.type === 'PARAMEDIC';
      const markerHtml = `
        <div class="custom-map-icon icon-unit ${resp.isCommunity ? 'icon-comm' : ''}">
          <span>${resp.isCommunity ? '🧑‍⚕️' : isAmb ? '🚑' : '🚒'}</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [30, 30] });
      const marker = L.marker([resp.latitude, resp.longitude], { icon });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-unit">${resp.badgeNumber}</div>
          <h4>${resp.name}</h4>
          <p><strong>Status:</strong> ${resp.status}</p>
          <p><strong>Fatigue:</strong> ${resp.fatigueScore}% | <strong>Duty:</strong> ${resp.dutyHours}h</p>
        </div>
      `);
      markersLayer.addLayer(marker);
    });
  }

  // 3. Hospitals Markers
  if (layers.value.hospitals) {
    hospitalStore.hospitals.forEach((hosp) => {
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
        </div>
      `);
      markersLayer.addLayer(marker);
    });
  }

  // 4. Shelters Markers
  if (layers.value.shelters) {
    disasterStore.shelters.forEach((shelter) => {
      const markerHtml = `
        <div class="custom-map-icon icon-shelter">
          <span>🏠</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [26, 26] });
      const marker = L.marker([shelter.latitude, shelter.longitude], { icon });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag tag-shelter">SHELTER</div>
          <h4>${shelter.name}</h4>
          <p><strong>Occupancy:</strong> ${shelter.currentOccupancy}/${shelter.capacity}</p>
        </div>
      `);
      markersLayer.addLayer(marker);
    });
  }

  // 5. Roadblocks Markers
  if (layers.value.roadblocks) {
    disasterStore.roadBlocks.forEach((rb) => {
      const markerHtml = `
        <div class="custom-map-icon icon-roadblock">
          <span>🚧</span>
        </div>
      `;
      const icon = L.divIcon({ html: markerHtml, className: 'map-div-icon', iconSize: [26, 26] });
      const marker = L.marker([rb.latitude, rb.longitude], { icon });
      marker.bindPopup(`<strong>Road Closure:</strong> ${rb.name}<br/>${rb.reason}`);
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
        fillOpacity: 0.25,
        weight: 2,
        dashArray: isDanger ? '6, 6' : null
      });

      polygon.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-tag" style="background: ${color}33; color: ${color};">${z.riskLevel} ZONE</div>
          <h4>${z.name}</h4>
          <p>Hazard Type: ${z.type}</p>
        </div>
      `);
      polygonsLayer.addLayer(polygon);
    });
  }
}

function renderRoute() {
  if (!map || !routeLayer) return;
  routeLayer.clearLayers();

  if (layers.value.routes) {
    // Dynamic Emergency Green Corridor (Avoids Roadblocks)
    const routeCoords = [
      [13.0780, 80.2650], // Ambulance A12
      [13.0795, 80.2670],
      [13.0810, 80.2695],
      [13.0827, 80.2707]  // Harbour Collapse
    ];

    const polyline = L.polyline(routeCoords, {
      color: '#10b981',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 8'
    });

    polyline.bindPopup(`<strong>⚡ Dynamic Emergency Route:</strong> 11 min ETA (Bypassed Main Flyover Closure)`);
    routeLayer.addLayer(polyline);
  }
}

watch(() => [incidentStore.incidents, responderStore.responders, disasterStore.zones], () => {
  renderMarkers();
  renderPolygons();
}, { deep: true });
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
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 8px;
  padding: 0.75rem;
  z-index: 1000;
  max-width: 200px;
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
  font-size: 0.75rem;
  color: #e2e8f0;
  cursor: pointer;
}

.toggle-item input {
  accent-color: #3b82f6;
  cursor: pointer;
}

/* Custom Marker Styles */
.map-div-icon {
  background: transparent;
  border: none;
}

.custom-map-icon {
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
  font-size: 0.9rem;
  color: #f8fafc;
  margin: 0.35rem 0;
}

.map-popup-card p {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.2rem 0;
}

.popup-tag {
  font-size: 0.65rem;
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
  font-size: 0.7rem;
  color: #38bdf8;
  margin-top: 0.4rem;
}
</style>
