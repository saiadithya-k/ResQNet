<template>
  <div class="location-picker-container tactical-card">
    <div class="picker-header">
      <div class="picker-title-row">
        <span class="picker-badge font-mono">STEP 1: LOCATION SPECIFICATION</span>
        <h3 class="picker-title">EMERGENCY INCIDENT LOCATION</h3>
      </div>
      <p class="picker-sub">
        Specify the exact emergency location using GPS auto-detection, place search, or by clicking/dragging the pin on the map.
      </p>
    </div>

    <!-- Mode Switcher Tabs -->
    <div class="loc-method-tabs">
      <button
        type="button"
        :class="['loc-tab-btn', { active: activeMethod === 'GPS' }]"
        @click="selectGPSMode"
        :disabled="isDetectingGps"
      >
        <span class="tab-icon">📍</span>
        <div class="tab-text">
          <strong>USE MY CURRENT LOCATION</strong>
          <span>High-accuracy browser GPS satellite fix</span>
        </div>
        <span v-if="isDetectingGps" class="spinner-inline"></span>
      </button>

      <button
        type="button"
        :class="['loc-tab-btn', { active: activeMethod === 'SEARCH' }]"
        @click="selectSearchMode"
      >
        <span class="tab-icon">🔎</span>
        <div class="tab-text">
          <strong>SEARCH FOR A PLACE</strong>
          <span>Street address, building, or landmark</span>
        </div>
      </button>
    </div>

    <!-- Search Input & Autocomplete Dropdown (When Search Mode Active) -->
    <div v-if="activeMethod === 'SEARCH'" class="search-input-wrapper">
      <div class="search-field-box">
        <span class="search-field-icon">🔎</span>
        <input
          type="text"
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="showDropdown = searchResults.length > 0"
          class="location-search-input"
          placeholder="Type place name, street or landmark (e.g. 42 Harbour Road, Central Hospital)..."
          autocomplete="off"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="btn-clear-search"
          @click="clearSearch"
          title="Clear search"
        >
          ✕
        </button>
        <span v-if="isSearching" class="spinner-inline search-spinner"></span>
      </div>

      <!-- Autocomplete Dropdown Results -->
      <div v-if="showDropdown && searchResults.length > 0" class="search-results-dropdown">
        <div
          v-for="(res, idx) in searchResults"
          :key="idx"
          class="search-result-item"
          @mousedown="selectSearchResult(res)"
        >
          <div class="res-icon">📍</div>
          <div class="res-info">
            <div class="res-primary">{{ res.shortAddress }}</div>
            <div class="res-secondary">{{ res.displayName }}</div>
          </div>
          <div class="res-coords font-mono">{{ res.latitude.toFixed(4) }}, {{ res.longitude.toFixed(4) }}</div>
        </div>
      </div>

      <!-- Search Error / No Results -->
      <div v-if="searchError" class="search-alert search-alert-warn font-mono">
        <span>⚠️ {{ searchError }}</span>
      </div>
    </div>

    <!-- GPS Status Alert (When GPS Mode Active) -->
    <div v-if="activeMethod === 'GPS' && gpsMessage" class="search-alert font-mono" :class="gpsIsError ? 'search-alert-warn' : 'search-alert-success'">
      <span>{{ gpsIsError ? '⚠️' : '✓' }} {{ gpsMessage }}</span>
    </div>

    <!-- Interactive Map Preview -->
    <div class="map-preview-section">
      <div class="map-wrapper">
        <div ref="mapContainerRef" class="maplibre-loc-container"></div>

        <!-- Map Overlays -->
        <div class="map-hint-banner font-mono">
          <span>💡 CLICK ANYWHERE ON MAP OR DRAG THE PIN TO FINE-TUNE LOCATION</span>
        </div>

        <!-- Reset to Default Button -->
        <button
          type="button"
          class="map-recenter-btn font-mono"
          @click="recenterMap"
          title="Recenter to selected coordinates"
        >
          <span>🎯 RECENTER PIN</span>
        </button>
      </div>
    </div>

    <!-- Location Telemetry & Verification Box -->
    <div class="location-confirmation-box">
      <div class="confirm-grid">
        <div class="confirm-col main-loc">
          <span class="confirm-lbl">RESOLVED ADDRESS / PLACE NAME</span>
          <div class="confirm-val address-highlight">
            {{ modelAddress || 'No location selected yet' }}
          </div>
        </div>

        <div class="confirm-col">
          <span class="confirm-lbl">COORDINATES (LAT, LNG)</span>
          <div class="confirm-val font-mono text-cyan">
            {{ currentLat.toFixed(6) }}, {{ currentLng.toFixed(6) }}
          </div>
        </div>

        <div class="confirm-col">
          <span class="confirm-lbl">LOCATION SOURCE</span>
          <div class="confirm-val">
            <span :class="['source-tag font-mono', getSourceClass(modelSource)]">
              ● {{ modelSource || 'GPS' }}
            </span>
          </div>
        </div>

        <div class="confirm-col status-col">
          <span class="confirm-lbl">AUDIT STATUS</span>
          <div class="confirm-val text-emerald font-mono">
            ✓ LOCATION CONFIRMED
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import geocodingService from '../../services/geocoding';

const props = defineProps({
  latitude: {
    type: Number,
    default: 13.082680
  },
  longitude: {
    type: Number,
    default: 80.270718
  },
  address: {
    type: String,
    default: '42 Harbour Road, Sector 4'
  },
  locationSource: {
    type: String,
    default: 'SEARCH' // 'GPS' | 'SEARCH' | 'MAP_PIN'
  },
  district: {
    type: String,
    default: 'Central Zone'
  }
});

const emit = defineEmits([
  'update:latitude',
  'update:longitude',
  'update:address',
  'update:locationSource',
  'update:district',
  'location-changed'
]);

const activeMethod = ref('SEARCH'); // 'GPS' | 'SEARCH'
const searchQuery = ref(props.address || '42 Harbour Road');
const searchResults = ref([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const searchError = ref('');

const isDetectingGps = ref(false);
const gpsMessage = ref('');
const gpsIsError = ref(false);

const currentLat = ref(props.latitude || 13.082680);
const currentLng = ref(props.longitude || 80.270718);
const modelAddress = ref(props.address || '42 Harbour Road, Sector 4');
const modelSource = ref(props.locationSource || 'SEARCH');
const modelDistrict = ref(props.district || 'Central Zone');

const mapContainerRef = ref(null);
let map = null;
let marker = null;
let searchDebounceTimeout = null;

// Watchers to keep in sync with parent props
watch(() => props.latitude, (newLat) => {
  if (newLat && newLat !== currentLat.value) {
    currentLat.value = newLat;
    updateMarkerPosition(currentLat.value, currentLng.value);
  }
});

watch(() => props.longitude, (newLng) => {
  if (newLng && newLng !== currentLng.value) {
    currentLng.value = newLng;
    updateMarkerPosition(currentLat.value, currentLng.value);
  }
});

watch(() => props.address, (newAddr) => {
  if (newAddr && newAddr !== modelAddress.value) {
    modelAddress.value = newAddr;
  }
});

onMounted(async () => {
  await nextTick();
  initMap();
});

onBeforeUnmount(() => {
  if (marker) {
    marker.remove();
    marker = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});

/* ─── MAP INITIALIZATION ─────────────────────────────── */
function initMap() {
  if (!mapContainerRef.value || map) return;

  map = new maplibregl.Map({
    container: mapContainerRef.value,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [currentLng.value, currentLat.value], // MapLibre takes [lng, lat]
    zoom: 15,
    attributionControl: false
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

  map.on('load', () => {
    createIncidentMarker(currentLat.value, currentLng.value);
  });

  // Allow clicking anywhere on map to reposition pin
  map.on('click', async (e) => {
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    await applyNewCoordinates(lat, lng, 'MAP_PIN');
  });
}

function createIncidentMarker(lat, lng) {
  if (marker) marker.remove();

  const el = document.createElement('div');
  el.className = 'incident-loc-marker-element';
  el.innerHTML = `
    <div class="loc-pin-halo"></div>
    <div class="loc-pin-core">
      <span class="loc-pin-emoji">🚨</span>
    </div>
    <div class="loc-pin-label">INCIDENT LOCATION</div>
  `;

  marker = new maplibregl.Marker({
    element: el,
    draggable: true,
    anchor: 'bottom'
  })
    .setLngLat([lng, lat]) // MapLibre takes [lng, lat]
    .addTo(map);

  // Drag pin event
  marker.on('dragend', async () => {
    const lngLat = marker.getLngLat();
    await applyNewCoordinates(lngLat.lat, lngLat.lng, 'MAP_PIN');
  });
}

function updateMarkerPosition(lat, lng, shouldFly = true) {
  if (marker) {
    marker.setLngLat([lng, lat]);
  } else if (map && map.isStyleLoaded()) {
    createIncidentMarker(lat, lng);
  }

  if (map && shouldFly) {
    map.flyTo({
      center: [lng, lat],
      zoom: 16,
      essential: true
    });
  }
}

function recenterMap() {
  if (map) {
    map.flyTo({
      center: [currentLng.value, currentLat.value],
      zoom: 16,
      essential: true
    });
  }
}

/* ─── APPLY COORDINATES & REVERSE GEOCODE ───────────── */
async function applyNewCoordinates(lat, lng, source) {
  currentLat.value = lat;
  currentLng.value = lng;
  modelSource.value = source;

  updateMarkerPosition(lat, lng, false);

  try {
    const geo = await geocodingService.reverseGeocode(lat, lng);
    modelAddress.value = geo.shortAddress || geo.displayName;
    modelDistrict.value = geo.district || 'Central Zone';
    searchQuery.value = modelAddress.value;
  } catch (err) {
    console.warn('Reverse geocoding failed', err);
    modelAddress.value = `Location at (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  }

  emitValues();
}

function emitValues() {
  emit('update:latitude', currentLat.value);
  emit('update:longitude', currentLng.value);
  emit('update:address', modelAddress.value);
  emit('update:locationSource', modelSource.value);
  emit('update:district', modelDistrict.value);
  emit('location-changed', {
    latitude: currentLat.value,
    longitude: currentLng.value,
    address: modelAddress.value,
    locationSource: modelSource.value,
    district: modelDistrict.value
  });
}

/* ─── OPTION A: GPS FLOW ─────────────────────────────── */
function selectGPSMode() {
  activeMethod.value = 'GPS';
  detectGPS();
}

function detectGPS() {
  if (!navigator.geolocation) {
    gpsIsError.value = true;
    gpsMessage.value = 'Geolocation is not supported by your browser. Please use search.';
    return;
  }

  isDetectingGps.value = true;
  gpsIsError.value = false;
  gpsMessage.value = 'Acquiring satellite GPS position...';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      isDetectingGps.value = false;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      gpsIsError.value = false;
      gpsMessage.value = `GPS fix locked (Accuracy: ±${Math.round(pos.coords.accuracy || 10)}m)`;

      await applyNewCoordinates(lat, lng, 'GPS');
      updateMarkerPosition(lat, lng, true);
    },
    (err) => {
      isDetectingGps.value = false;
      gpsIsError.value = true;
      if (err.code === 1) {
        gpsMessage.value = 'Location permission denied. Please search for place manually.';
      } else if (err.code === 2) {
        gpsMessage.value = 'GPS position unavailable. Please search for place manually.';
      } else {
        gpsMessage.value = 'GPS request timed out. Please search for place manually.';
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/* ─── OPTION B: SEARCH & GEOCODING FLOW ─────────────── */
function selectSearchMode() {
  activeMethod.value = 'SEARCH';
}

function onSearchInput() {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
  searchError.value = '';

  if (!searchQuery.value || searchQuery.value.trim().length < 2) {
    searchResults.value = [];
    showDropdown.value = false;
    isSearching.value = false;
    return;
  }

  isSearching.value = true;
  searchDebounceTimeout = setTimeout(async () => {
    try {
      const results = await geocodingService.search(searchQuery.value);
      searchResults.value = results;
      showDropdown.value = results.length > 0;
      isSearching.value = false;
      if (results.length === 0) {
        searchError.value = 'No exact location found. Try a landmark or click the map.';
      }
    } catch (err) {
      isSearching.value = false;
      searchError.value = 'Geocoding service unavailable. You can click on the map to pin.';
    }
  }, 350);
}

async function selectSearchResult(item) {
  showDropdown.value = false;
  searchQuery.value = item.shortAddress;
  modelAddress.value = item.shortAddress || item.displayName;
  modelDistrict.value = item.district || 'Central Zone';
  currentLat.value = item.latitude;
  currentLng.value = item.longitude;
  modelSource.value = 'SEARCH';

  updateMarkerPosition(item.latitude, item.longitude, true);
  emitValues();
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  showDropdown.value = false;
}

function getSourceClass(src) {
  if (src === 'GPS') return 'tag-gps';
  if (src === 'SEARCH') return 'tag-search';
  return 'tag-pin';
}
</script>

<style scoped>
.location-picker-container {
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: rgba(15, 23, 42, 0.85);
  border-radius: 10px;
}

.picker-header {
  margin-bottom: 1rem;
}

.picker-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.06em;
}

.picker-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f8fafc;
  margin-top: 0.25rem;
}

.picker-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* ─── METHOD TABS ────────────────────────────────────── */
.loc-method-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.loc-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.loc-tab-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.4);
}

.loc-tab-btn.active {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.tab-icon {
  font-size: 1.35rem;
}

.tab-text {
  display: flex;
  flex-direction: column;
}

.tab-text strong {
  font-size: 0.8rem;
  font-weight: 700;
  color: #f8fafc;
}

.tab-text span {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 2px;
}

/* ─── SEARCH INPUT & AUTOCOMPLETE ────────────────────── */
.search-input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.search-field-box {
  display: flex;
  align-items: center;
  background: rgba(10, 15, 26, 0.95);
  border: 1.5px solid rgba(56, 189, 248, 0.35);
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  gap: 0.5rem;
}

.search-field-box:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.search-field-icon {
  font-size: 1.1rem;
}

.location-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
}

.location-search-input::placeholder {
  color: #64748b;
  font-weight: 400;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0 0.25rem;
}

.btn-clear-search:hover { color: #f8fafc; }

.search-results-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #0f172a;
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.15s ease;
}

.search-result-item:last-child { border-bottom: none; }

.search-result-item:hover {
  background: rgba(56, 189, 248, 0.15);
}

.res-icon { font-size: 1rem; }

.res-info {
  flex: 1;
  min-width: 0;
}

.res-primary {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.res-secondary {
  font-size: 0.68rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.res-coords {
  font-size: 0.65rem;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

/* ─── ALERTS ─────────────────────────────────────────── */
.search-alert {
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.72rem;
  margin-bottom: 0.75rem;
}

.search-alert-warn {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fde68a;
}

.search-alert-success {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

/* ─── MAP PREVIEW ────────────────────────────────────── */
.map-preview-section {
  position: relative;
  margin-bottom: 1rem;
}

.map-wrapper {
  position: relative;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.maplibre-loc-container {
  width: 100%;
  height: 100%;
}

.map-hint-banner {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.3);
  backdrop-filter: blur(8px);
  color: #38bdf8;
  font-size: 0.62rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  pointer-events: none;
  z-index: 10;
}

.map-recenter-btn {
  position: absolute;
  bottom: 0.6rem;
  left: 0.6rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #f8fafc;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 10;
}

.map-recenter-btn:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
  color: #38bdf8;
}

/* ─── TELEMETRY CONFIRMATION BOX ─────────────────────── */
.location-confirmation-box {
  background: rgba(8, 12, 20, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.confirm-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr;
  gap: 1rem;
}

.confirm-col {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.confirm-lbl {
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  color: #64748b;
  text-transform: uppercase;
}

.confirm-val {
  font-size: 0.8rem;
  font-weight: 700;
  color: #f8fafc;
}

.address-highlight {
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
}

.tag-gps {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.tag-search {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.tag-pin {
  background: rgba(245, 158, 11, 0.15);
  color: #fde68a;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── GLOBAL MAPLIBRE MARKER STYLES (NO SCOPING ISSUE) ─ */
:deep(.incident-loc-marker-element) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
}

:deep(.incident-loc-marker-element:active) {
  cursor: grabbing;
}

:deep(.loc-pin-halo) {
  position: absolute;
  top: -8px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.25);
  border: 1.5px solid rgba(239, 68, 68, 0.6);
  animation: marker-pulse 1.8s infinite;
}

:deep(.loc-pin-core) {
  position: relative;
  width: 36px;
  height: 36px;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.6);
  z-index: 2;
}

:deep(.loc-pin-emoji) {
  font-size: 1.1rem;
}

:deep(.loc-pin-label) {
  background: #0f172a;
  color: #ffffff;
  font-family: var(--font-mono, monospace);
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  border: 1px solid rgba(239, 68, 68, 0.8);
  margin-top: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  z-index: 3;
}

@keyframes marker-pulse {
  0% { transform: scale(0.85); opacity: 0.9; }
  50% { transform: scale(1.25); opacity: 0.3; }
  100% { transform: scale(0.85); opacity: 0.9; }
}

@media (max-width: 768px) {
  .loc-method-tabs {
    grid-template-columns: 1fr;
  }
  .confirm-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
