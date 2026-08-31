<template>
  <div class="map-container">
    <!-- Map Canvas Element -->
    <div ref="mapContainer" class="map-view"></div>

    <!-- Floating Map Control Toolbar -->
    <div class="map-controls-panel">
      <div class="control-header">
        <div class="header-left">
          <span class="pulse-icon"></span>
          <span>TACTICAL GIS LAYERS</span>
        </div>
        <div class="theme-switcher font-mono">
          <button
            type="button"
            :class="['theme-pill', { active: currentTheme === 'light' }]"
            @click="switchTheme('light')"
            title="White / Positron Theme"
          >
            ☀️ White
          </button>
          <button
            type="button"
            :class="['theme-pill', { active: currentTheme === 'dark' }]"
            @click="switchTheme('dark')"
            title="Dark Tactical Theme"
          >
            🌙 Dark
          </button>
        </div>
      </div>
      <div class="layer-toggles">
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.incidents" @change="updateLayersVisibility" />
          <span class="icon">🔴</span> Incidents ({{ incidentStore.incidents.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.responders" @change="updateLayersVisibility" />
          <span class="icon">🚑</span> Units ({{ responderStore.responders.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.hospitals" @change="updateLayersVisibility" />
          <span class="icon">🏥</span> Hospitals ({{ hospitalStore.hospitals.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.shelters" @change="updateLayersVisibility" />
          <span class="icon">🏠</span> Shelters ({{ disasterStore.shelters.length }})
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.zones" @change="updateLayersVisibility" />
          <span class="icon">⚠️</span> Disaster Zones
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.roadblocks" @change="updateLayersVisibility" />
          <span class="icon">🚧</span> Roadblocks
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.routes" @change="updateLayersVisibility" />
          <span class="icon">⚡</span> Route Optimization
        </label>
        <label class="toggle-item">
          <input type="checkbox" v-model="layers.heatmap" @change="updateLayersVisibility" />
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

      <!-- Active Focus Card -->
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
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import api from '../../services/api';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const mapContainer = ref(null);
let map = null;

// Marker tracking maps for dynamic updates
const incidentMarkers = new Map();
const responderMarkers = new Map();
const hospitalMarkers = new Map();
const shelterMarkers = new Map();
const roadblockMarkers = new Map();

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

const activeRouteType = ref('EMERGENCY'); // EMERGENCY | STANDARD | BOTH
const routeMetrics = ref({
  standardEta: 22,
  standardDist: 3.4,
  emergencyEta: 11,
  emergencyDist: 2.8
});

const currentTheme = ref('light');
const themeStyles = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  bright: 'https://tiles.openfreemap.org/styles/bright'
};

let resizeObserver = null;

onMounted(async () => {
  await nextTick();
  initMap();

  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (map) map.resize();
    });
    resizeObserver.observe(mapContainer.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  clearAllMarkers();
  if (map) {
    map.remove();
    map = null;
  }
});

function clearAllMarkers() {
  incidentMarkers.forEach(m => m.remove());
  incidentMarkers.clear();

  responderMarkers.forEach(m => m.remove());
  responderMarkers.clear();

  hospitalMarkers.forEach(m => m.remove());
  hospitalMarkers.clear();

  shelterMarkers.forEach(m => m.remove());
  shelterMarkers.clear();

  roadblockMarkers.forEach(m => m.remove());
  roadblockMarkers.clear();
}

function switchTheme(newTheme) {
  currentTheme.value = newTheme;
  if (!map) return;

  const targetStyle = themeStyles[newTheme] || themeStyles.light;
  map.setStyle(targetStyle);

  map.once('style.load', () => {
    setupSourcesAndLayers();
    renderAll();
  });
}

function initMap() {
  if (map || !mapContainer.value) return;

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: themeStyles[currentTheme.value] || themeStyles.light,
    center: [80.2600, 13.0827], // [lng, lat]
    zoom: 13,
    attributionControl: true
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  map.on('load', () => {
    setupSourcesAndLayers();
    renderAll();

    if (incidentStore.selectedIncident) {
      focusSelectedIncident();
    }
  });

  map.on('error', (e) => {
    console.warn('MapLibre tactical map event:', e.error?.message || e);
  });
}

function setupSourcesAndLayers() {
  if (!map) return;

  // 1. Disaster Zones GeoJSON source & layers
  if (!map.getSource('disaster-zones-source')) {
    map.addSource('disaster-zones-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'disaster-zones-fill',
      type: 'fill',
      source: 'disaster-zones-source',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'opacity']
      }
    });

    map.addLayer({
      id: 'disaster-zones-outline',
      type: 'line',
      source: 'disaster-zones-source',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
        'line-dasharray': [3, 2]
      }
    });

    map.on('click', 'disaster-zones-fill', (e) => {
      if (e.features && e.features[0]) {
        const p = e.features[0].properties;
        new maplibregl.Popup({ offset: [0, -5] })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="map-popup-card">
              <div class="popup-tag" style="background: ${p.color}33; color: ${p.color};">
                #${p.id} · ${p.riskLevel} ZONE (${p.severity || 'HIGH'})
              </div>
              <h4>${p.name}</h4>
              <p><strong>Hazard Type:</strong> ${p.type}</p>
              <p><strong>Status:</strong> <span class="text-emerald">ACTIVE SECTOR PERIMETER</span></p>
              <p><strong>Est. Population:</strong> ~${Number(p.affectedPopulation || 15000).toLocaleString()} Persons</p>
              <p class="text-cyan"><strong>Evac Corridor:</strong> ${p.evacuationRoute || 'Designated Radial Arterials'}</p>
            </div>
          `)
          .addTo(map);
      }
    });
  }

  // 2. Incident Heatmap Source & Layer
  if (!map.getSource('incident-heatmap-source')) {
    map.addSource('incident-heatmap-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'incident-heatmap-layer',
      type: 'heatmap',
      source: 'incident-heatmap-source',
      layout: {
        visibility: layers.value.heatmap ? 'visible' : 'none'
      },
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(6, 182, 212, 0)',
          0.2, '#06b6d4',
          0.4, '#10b981',
          0.7, '#f59e0b',
          1.0, '#ef4444'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 15,
          15, 35
        ],
        'heatmap-opacity': 0.8
      }
    });
  }

  // 3. Routes GeoJSON Source & Layers
  if (!map.getSource('routes-source')) {
    map.addSource('routes-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: 'routes-standard-layer',
      type: 'line',
      source: 'routes-source',
      filter: ['==', ['get', 'routeType'], 'STANDARD'],
      paint: {
        'line-color': '#f59e0b',
        'line-width': 4,
        'line-opacity': 0.85,
        'line-dasharray': [2, 2]
      }
    });

    map.addLayer({
      id: 'routes-emergency-layer',
      type: 'line',
      source: 'routes-source',
      filter: ['==', ['get', 'routeType'], 'EMERGENCY'],
      paint: {
        'line-color': '#10b981',
        'line-width': 6,
        'line-opacity': 0.95
      }
    });

    map.on('click', 'routes-emergency-layer', (e) => {
      new maplibregl.Popup({ offset: [0, -5] })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="map-popup-card">
            <div class="popup-tag tag-unit">EMERGENCY CORRIDOR (${routeMetrics.value.emergencyEta} MIN)</div>
            <h4>Dynamic Hazard Bypass Route</h4>
            <p>Distance: ${routeMetrics.value.emergencyDist} km (50% Faster)</p>
            <p class="text-emerald">✓ Bypasses Harbour Roadblock & Flood Zone</p>
          </div>
        `)
        .addTo(map);
    });

    map.on('click', 'routes-standard-layer', (e) => {
      new maplibregl.Popup({ offset: [0, -5] })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="map-popup-card">
            <div class="popup-tag tag-warn">STANDARD ROUTE (${routeMetrics.value.standardEta} MIN)</div>
            <h4>Congested Traffic Path</h4>
            <p>Distance: ${routeMetrics.value.standardDist} km</p>
            <p class="text-red">⚠️ Passes through active roadblock</p>
          </div>
        `)
        .addTo(map);
    });
  }
}

function renderAll() {
  renderDisasterZones();
  renderIncidents();
  renderResponders();
  renderHospitals();
  renderShelters();
  renderRoadblocks();
  renderHeatmap();
  fetchAndRenderRoutes();
  updateLayersVisibility();
}

function updateLayersVisibility() {
  if (!map || !map.isStyleLoaded()) return;

  // Toggle MapLibre GeoJSON layers
  if (map.getLayer('disaster-zones-fill')) {
    map.setLayoutProperty('disaster-zones-fill', 'visibility', layers.value.zones ? 'visible' : 'none');
    map.setLayoutProperty('disaster-zones-outline', 'visibility', layers.value.zones ? 'visible' : 'none');
  }

  if (map.getLayer('incident-heatmap-layer')) {
    map.setLayoutProperty('incident-heatmap-layer', 'visibility', layers.value.heatmap ? 'visible' : 'none');
  }

  if (map.getLayer('routes-emergency-layer')) {
    const isEmerg = layers.value.routes && (activeRouteType.value === 'EMERGENCY' || activeRouteType.value === 'BOTH');
    map.setLayoutProperty('routes-emergency-layer', 'visibility', isEmerg ? 'visible' : 'none');
  }

  if (map.getLayer('routes-standard-layer')) {
    const isStd = layers.value.routes && (activeRouteType.value === 'STANDARD' || activeRouteType.value === 'BOTH');
    map.setLayoutProperty('routes-standard-layer', 'visibility', isStd ? 'visible' : 'none');
  }

  // Toggle Marker visibility
  incidentMarkers.forEach(m => {
    const el = m.getElement();
    if (el) el.style.display = layers.value.incidents ? 'block' : 'none';
  });

  responderMarkers.forEach(m => {
    const el = m.getElement();
    if (el) el.style.display = layers.value.responders ? 'block' : 'none';
  });

  hospitalMarkers.forEach(m => {
    const el = m.getElement();
    if (el) el.style.display = layers.value.hospitals ? 'block' : 'none';
  });

  shelterMarkers.forEach(m => {
    const el = m.getElement();
    if (el) el.style.display = layers.value.shelters ? 'block' : 'none';
  });

  roadblockMarkers.forEach(m => {
    const el = m.getElement();
    if (el) el.style.display = layers.value.roadblocks ? 'block' : 'none';
  });
}

function renderDisasterZones() {
  if (!map || !map.getSource('disaster-zones-source')) return;

  const features = disasterStore.zones.map(z => {
    const isDanger = z.riskLevel === 'DANGER';
    const isEvac = z.riskLevel === 'EVACUATION';
    const color = isDanger ? '#ef4444' : isEvac ? '#f97316' : '#eab308';
    const opacity = isDanger ? 0.28 : isEvac ? 0.22 : 0.16;

    // Convert [lat, lng] -> [lng, lat] and close ring
    const ring = (z.coordinates || []).map(pt => [pt[1], pt[0]]);
    if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
      ring.push([...ring[0]]);
    }

    return {
      type: 'Feature',
      properties: {
        id: z.id,
        name: z.name,
        type: z.type,
        riskLevel: z.riskLevel,
        severity: z.severity,
        affectedPopulation: z.affectedPopulation,
        evacuationRoute: z.evacuationRoute,
        color,
        opacity
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring]
      }
    };
  });

  map.getSource('disaster-zones-source').setData({
    type: 'FeatureCollection',
    features
  });
}

function renderIncidents() {
  if (!map) return;

  // Track active ids to remove pruned markers
  const activeIds = new Set();

  incidentStore.incidents.forEach(inc => {
    if (inc.latitude == null || inc.longitude == null) return;
    activeIds.add(inc.id);

    const isCritical = inc.severity === 'CRITICAL';
    const isSelected = incidentStore.selectedIncident?.id === inc.id;

    let markerObj = incidentMarkers.get(inc.id);

    if (!markerObj) {
      const el = document.createElement('div');
      el.className = 'maplibre-marker-wrapper';

      const popup = new maplibregl.Popup({ offset: [0, -14] }).setHTML(`
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
      `);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        incidentStore.selectIncident(inc);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([inc.longitude, inc.latitude])
        .setPopup(popup)
        .addTo(map);

      incidentMarkers.set(inc.id, marker);
      markerObj = marker;
    } else {
      markerObj.setLngLat([inc.longitude, inc.latitude]);
    }

    // Update inner HTML of element
    const el = markerObj.getElement();
    el.innerHTML = `
      <div class="custom-map-icon ${isCritical ? 'pulse-critical' : 'pulse-high'} ${isSelected ? 'marker-selected-halo' : ''}">
        <span>${inc.incidentType === 'FIRE' ? '🔥' : inc.incidentType === 'HAZMAT' ? '☣️' : '🚨'}</span>
        ${isSelected ? '<span class="selected-pin-badge">TARGET</span>' : ''}
      </div>
    `;
    el.style.display = layers.value.incidents ? 'block' : 'none';
  });

  // Remove markers no longer in state
  incidentMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      incidentMarkers.delete(id);
    }
  });
}

function renderResponders() {
  if (!map) return;

  const activeIds = new Set();

  responderStore.responders.forEach(resp => {
    if (resp.latitude == null || resp.longitude == null) return;
    activeIds.add(resp.id);

    const isAmb = resp.type === 'PARAMEDIC';
    let markerObj = responderMarkers.get(resp.id);

    if (!markerObj) {
      const el = document.createElement('div');
      el.className = 'maplibre-marker-wrapper';

      const popup = new maplibregl.Popup({ offset: [0, -12] }).setHTML(`
        <div class="map-popup-card">
          <div class="popup-tag tag-unit">${resp.badgeNumber || resp.id} · ${resp.type}</div>
          <h4>${resp.name}</h4>
          <p><strong>Status:</strong> ${resp.status}</p>
          <p><strong>Speed:</strong> ${resp.status === 'EN_ROUTE' ? '54 km/h' : '0 km/h'} | <strong>ETA:</strong> ${resp.etaMinutes || 5}m</p>
          <p><strong>Fatigue:</strong> ${resp.fatigueScore || 20}% | <strong>Duty:</strong> ${resp.dutyHours || 4}h</p>
          <p><strong>Assignment:</strong> ${resp.assignedIncidentId ? '#' + resp.assignedIncidentId : 'Available'}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([resp.longitude, resp.latitude])
        .setPopup(popup)
        .addTo(map);

      responderMarkers.set(resp.id, marker);
      markerObj = marker;
    } else {
      // Smooth GPS update
      markerObj.setLngLat([resp.longitude, resp.latitude]);
    }

    const el = markerObj.getElement();
    el.innerHTML = `
      <div class="custom-map-icon icon-unit ${resp.isCommunity ? 'icon-comm' : ''} ${resp.status === 'EN_ROUTE' ? 'pulse-enroute' : ''}">
        <span>${resp.isCommunity ? '🧑‍⚕️' : isAmb ? '🚑' : '🚒'}</span>
      </div>
    `;
    el.style.display = layers.value.responders ? 'block' : 'none';
  });

  responderMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      responderMarkers.delete(id);
    }
  });
}

function renderHospitals() {
  if (!map) return;

  const activeIds = new Set();

  hospitalStore.hospitals.forEach(hosp => {
    if (hosp.latitude == null || hosp.longitude == null) return;
    activeIds.add(hosp.id);

    let markerObj = hospitalMarkers.get(hosp.id);

    if (!markerObj) {
      const el = document.createElement('div');
      el.className = 'maplibre-marker-wrapper';

      const popup = new maplibregl.Popup({ offset: [0, -10] }).setHTML(`
        <div class="map-popup-card">
          <div class="popup-tag tag-hosp">HOSPITAL MATCH: ${hosp.matchScore || 90}%</div>
          <h4>${hosp.name}</h4>
          <p><strong>ICU Beds:</strong> ${hosp.availableIcu}/${hosp.totalIcu}</p>
          <p><strong>Trauma Beds:</strong> ${hosp.availableTrauma}/${hosp.totalTrauma}</p>
          <p><strong>Available Total Beds:</strong> ${hosp.availableBeds}/${hosp.totalBeds}</p>
        </div>
      `);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        hospitalStore.selectHospital(hosp);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([hosp.longitude, hosp.latitude])
        .setPopup(popup)
        .addTo(map);

      hospitalMarkers.set(hosp.id, marker);
      markerObj = marker;
    } else {
      markerObj.setLngLat([hosp.longitude, hosp.latitude]);
    }

    const el = markerObj.getElement();
    el.innerHTML = `
      <div class="custom-map-icon icon-hospital">
        <span>🏥</span>
      </div>
    `;
    el.style.display = layers.value.hospitals ? 'block' : 'none';
  });

  hospitalMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      hospitalMarkers.delete(id);
    }
  });
}

function renderShelters() {
  if (!map) return;

  const activeIds = new Set();

  disasterStore.shelters.forEach(shelter => {
    if (shelter.latitude == null || shelter.longitude == null) return;
    activeIds.add(shelter.id);

    let markerObj = shelterMarkers.get(shelter.id);

    if (!markerObj) {
      const el = document.createElement('div');
      el.className = 'maplibre-marker-wrapper';

      const popup = new maplibregl.Popup({ offset: [0, -10] }).setHTML(`
        <div class="map-popup-card">
          <div class="popup-tag tag-shelter">EVACUATION SHELTER</div>
          <h4>${shelter.name}</h4>
          <p><strong>Occupancy:</strong> ${shelter.currentOccupancy}/${shelter.capacity}</p>
          <p><strong>District:</strong> ${shelter.district}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(popup)
        .addTo(map);

      shelterMarkers.set(shelter.id, marker);
      markerObj = marker;
    } else {
      markerObj.setLngLat([shelter.longitude, shelter.latitude]);
    }

    const el = markerObj.getElement();
    el.innerHTML = `
      <div class="custom-map-icon icon-shelter">
        <span>🏠</span>
      </div>
    `;
    el.style.display = layers.value.shelters ? 'block' : 'none';
  });

  shelterMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      shelterMarkers.delete(id);
    }
  });
}

function renderRoadblocks() {
  if (!map) return;

  const activeIds = new Set();

  disasterStore.roadBlocks.forEach(rb => {
    if (rb.latitude == null || rb.longitude == null) return;
    activeIds.add(rb.id);

    let markerObj = roadblockMarkers.get(rb.id);

    if (!markerObj) {
      const el = document.createElement('div');
      el.className = 'maplibre-marker-wrapper';

      const popup = new maplibregl.Popup({ offset: [0, -10] }).setHTML(`
        <div class="map-popup-card">
          <div class="popup-tag tag-crit">ROAD BLOCK</div>
          <h4>${rb.name}</h4>
          <p>${rb.reason}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([rb.longitude, rb.latitude])
        .setPopup(popup)
        .addTo(map);

      roadblockMarkers.set(rb.id, marker);
      markerObj = marker;
    } else {
      markerObj.setLngLat([rb.longitude, rb.latitude]);
    }

    const el = markerObj.getElement();
    el.innerHTML = `
      <div class="custom-map-icon icon-roadblock">
        <span>🚧</span>
      </div>
    `;
    el.style.display = layers.value.roadblocks ? 'block' : 'none';
  });

  roadblockMarkers.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      roadblockMarkers.delete(id);
    }
  });
}

function renderHeatmap() {
  if (!map || !map.getSource('incident-heatmap-source')) return;

  const features = incidentStore.incidents
    .filter(inc => inc.latitude != null && inc.longitude != null)
    .map(inc => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [inc.longitude, inc.latitude]
      },
      properties: {
        weight: inc.severity === 'CRITICAL' ? 1.0 : inc.severity === 'HIGH' ? 0.75 : 0.4
      }
    }));

  map.getSource('incident-heatmap-source').setData({
    type: 'FeatureCollection',
    features
  });
}

async function fetchAndRenderRoutes() {
  if (!map || !map.getSource('routes-source')) return;

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

    const features = [];

    // Standard Route: [lat, lng] -> [lng, lat]
    if (data.standardRoute?.path) {
      features.push({
        type: 'Feature',
        properties: {
          routeType: 'STANDARD',
          eta: data.standardRoute.etaMinutes,
          distance: data.standardRoute.distanceKm,
          warning: data.standardRoute.warning
        },
        geometry: {
          type: 'LineString',
          coordinates: data.standardRoute.path.map(pt => [pt[1], pt[0]])
        }
      });
    }

    // Emergency Route: [lat, lng] -> [lng, lat]
    if (data.emergencyRoute?.path) {
      features.push({
        type: 'Feature',
        properties: {
          routeType: 'EMERGENCY',
          eta: data.emergencyRoute.etaMinutes,
          distance: data.emergencyRoute.distanceKm
        },
        geometry: {
          type: 'LineString',
          coordinates: data.emergencyRoute.path.map(pt => [pt[1], pt[0]])
        }
      });
    }

    map.getSource('routes-source').setData({
      type: 'FeatureCollection',
      features
    });

    updateLayersVisibility();
  } catch (err) {
    console.warn('Failed to fetch optimized route', err.message);
  }
}

function setRouteType(type) {
  activeRouteType.value = type;
  fetchAndRenderRoutes();
}

function focusSelectedIncident() {
  const selected = incidentStore.selectedIncident;
  if (!map || !selected || selected.longitude == null || selected.latitude == null) return;

  map.flyTo({
    center: [selected.longitude, selected.latitude],
    zoom: 15,
    essential: true,
    speed: 2.4,
    curve: 1.1
  });

  renderIncidents();

  const marker = incidentMarkers.get(selected.id);
  if (marker) {
    setTimeout(() => {
      marker.togglePopup();
    }, 120);
  }
}

// Watchers for Queue & Selection Changes
watch(
  () => incidentStore.selectedIncident,
  (newVal, oldVal) => {
    if (newVal && newVal.id !== oldVal?.id) {
      focusSelectedIncident();
      fetchAndRenderRoutes();
    }
  }
);

watch(
  () => responderStore.selectedResponder,
  (newResp) => {
    if (newResp && map && newResp.latitude && newResp.longitude) {
      map.flyTo({
        center: [newResp.longitude, newResp.latitude],
        zoom: 15,
        essential: true,
        speed: 2.4,
        curve: 1.1
      });
      const marker = responderMarkers.get(newResp.id);
      if (marker) {
        setTimeout(() => marker.togglePopup(), 120);
      }
    }
  }
);

watch(
  () => hospitalStore.selectedHospital,
  (newHosp) => {
    if (newHosp && map && newHosp.latitude && newHosp.longitude) {
      map.flyTo({
        center: [newHosp.longitude, newHosp.latitude],
        zoom: 15,
        essential: true,
        speed: 2.4,
        curve: 1.1
      });
      const marker = hospitalMarkers.get(newHosp.id);
      if (marker) {
        setTimeout(() => marker.togglePopup(), 120);
      }
    }
  }
);

// Watch for Real-time Store Updates
watch(
  () => [incidentStore.incidents, responderStore.responders, disasterStore.zones, disasterStore.shelters, disasterStore.roadBlocks],
  () => {
    renderIncidents();
    renderResponders();
    renderHospitals();
    renderShelters();
    renderRoadblocks();
    renderDisasterZones();
    renderHeatmap();
  },
  { deep: true }
);
</script>

<style>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(51, 65, 85, 0.7);
  background: #0b1120;
}

.map-view {
  width: 100%;
  height: 100%;
  min-height: 520px;
}

/* OpenFreeMap Dark Aesthetic Filter Overlay */
.map-view .maplibregl-canvas {
  filter: brightness(0.85) contrast(1.15) saturate(0.9);
}

.map-controls-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.85);
  border-radius: 8px;
  padding: 0.75rem;
  z-index: 10;
  max-width: 220px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
}

.control-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: var(--font-mono, monospace);
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.45rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.theme-switcher {
  display: flex;
  gap: 0.25rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 6px;
  padding: 2px;
}

.theme-pill {
  flex: 1;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.625rem;
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.theme-pill.active {
  background: #3b82f6;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.theme-pill:hover:not(.active) {
  color: #f1f5f9;
  background: rgba(51, 65, 85, 0.5);
}

.pulse-icon {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
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
  gap: 0.3rem;
}

.route-toggle-btn {
  font-size: 0.65rem;
  font-family: var(--font-mono, monospace);
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  cursor: pointer;
  text-align: left;
}

.route-toggle-btn.active {
  background: rgba(16, 185, 129, 0.35);
  border-color: #10b981;
  font-weight: 700;
}

.route-toggle-btn.btn-std {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fcd34d;
}

.route-toggle-btn.btn-std.active {
  background: rgba(245, 158, 11, 0.35);
  border-color: #f59e0b;
  font-weight: 700;
}

/* Marker Wrapper & Styling */
.maplibre-marker-wrapper {
  cursor: pointer;
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

/* MapLibre Popup Styling to Match Dark Theme */
.maplibregl-popup-content {
  background: #0f172a !important;
  border: 1px solid #334155 !important;
  border-radius: 8px !important;
  padding: 0.75rem !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7) !important;
  color: #f8fafc !important;
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: #334155 !important; }
.maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: #334155 !important; }
.maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: #334155 !important; }
.maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: #334155 !important; }

.maplibregl-popup-close-button {
  color: #94a3b8 !important;
  font-size: 1rem !important;
  padding: 0.2rem 0.4rem !important;
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

.text-emerald { color: #34d399; }
.text-cyan { color: #22d3ee; }
.text-red { color: #f87171; }
</style>
