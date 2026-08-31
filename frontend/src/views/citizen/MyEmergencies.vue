<template>
  <div class="my-emergencies-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2> MY REPORTED EMERGENCIES</h2>
        <p>Live status, AI priority triage, and responder dispatch updates for your emergency reports.</p>
      </div>

      <div class="header-actions">
        <div :class="['socket-badge', isSocketConnected ? 'connected' : 'disconnected']">
          <span class="socket-dot"></span>
          <span>{{ isSocketConnected ? 'LIVE UPDATES ACTIVE' : 'RECONNECTING LIVE FEED...' }}</span>
        </div>
        <router-link to="/citizen/report" class="btn btn-primary btn-sm">
          + File Emergency Report
        </router-link>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="tactical-card filter-card">
      <div class="filter-pills">
        <button
          type="button"
          :class="['pill-btn', { active: activeFilter === 'ALL' }]"
          @click="activeFilter = 'ALL'"
        >
          ALL ({{ incidents.length }})
        </button>
        <button
          type="button"
          :class="['pill-btn', { active: activeFilter === 'ACTIVE' }]"
          @click="activeFilter = 'ACTIVE'"
        >
          ACTIVE ({{ activeIncidents.length }})
        </button>
        <button
          type="button"
          :class="['pill-btn', { active: activeFilter === 'HISTORICAL' }]"
          @click="activeFilter = 'HISTORICAL'"
        >
          HISTORICAL ({{ historicalIncidents.length }})
        </button>
        <button
          type="button"
          :class="['pill-btn', { active: activeFilter === 'RESOLVED' }]"
          @click="activeFilter = 'RESOLVED'"
        >
          RESOLVED ({{ resolvedIncidents.length }})
        </button>
        <button
          type="button"
          :class="['pill-btn', { active: activeFilter === 'CANCELLED' }]"
          @click="activeFilter = 'CANCELLED'"
        >
          CANCELLED ({{ cancelledIncidents.length }})
        </button>
      </div>

      <div class="search-and-refresh">
        <input
          type="text"
          v-model="searchQuery"
          class="search-input"
          placeholder=" Search by ID, type, address..."
        />
        <button class="btn btn-ghost btn-xs" @click="loadMyEmergencies" :disabled="loading">
          {{ loading ? 'Refreshing...' : ' Refresh' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="tactical-card state-panel">
      <div class="spinner-sm"></div>
      <span>LOADING YOUR EMERGENCIES...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="tactical-card state-panel error">
      <span class="state-icon">️</span>
      <strong>Unable to load your emergencies.</strong>
      <p class="text-xs text-muted">{{ fetchError }}</p>
      <button class="btn btn-primary btn-sm mt-2" @click="loadMyEmergencies">Retry Connection</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredIncidents.length === 0" class="tactical-card empty-panel">
      <span class="empty-icon">️</span>
      <h3>NO ACTIVE EMERGENCIES</h3>
      <p>
        {{ activeFilter === 'ALL'
          ? "You haven't reported any emergencies. In an active crisis, report immediately for rapid first responder dispatch."
          : `No ${activeFilter.toLowerCase()} emergencies found matching this filter.`
        }}
      </p>
      <router-link to="/citizen/report" class="btn btn-primary mt-3">
         File Emergency Report
      </router-link>
    </div>

    <!-- Incident Cards Grid / List -->
    <div v-else class="incidents-grid">
      <div
        v-for="inc in filteredIncidents"
        :key="inc.id"
        class="tactical-card incident-card"
        @click="goToIncidentDetails(inc.id)"
      >
        <!-- Top Row: ID & Time -->
        <div class="inc-card-header">
          <div class="inc-id-row">
            <span class="inc-id font-mono">{{ inc.id }}</span>
            <span class="inc-type-label">{{ getCategoryIcon(inc.incidentType) }} {{ inc.incidentType }}</span>
          </div>
          <span class="inc-time font-mono">{{ formatTime(inc.createdAt) }}</span>
        </div>

        <!-- Title & Location -->
        <div class="inc-main-info">
          <strong class="inc-title">{{ inc.title }}</strong>
          <span class="inc-loc"> {{ inc.address || 'Reported Location' }}</span>
        </div>

        <!-- Badges: Status, Severity, Priority -->
        <div class="inc-badges-row">
          <span :class="['status-chip', getStatusClass(inc.status)]">
            <span class="chip-dot"></span>
            <span>{{ formatStatus(inc.status) }}</span>
          </span>

          <span :class="['sev-chip', getSeverityClass(inc.severity)]">
            {{ inc.severity || 'MEDIUM' }}
          </span>

          <span class="priority-chip font-mono">
            PRIORITY {{ inc.priorityScore || 85 }}/100
          </span>
        </div>

        <!-- Details Snippet -->
        <p class="inc-desc-snippet">{{ inc.description }}</p>

        <!-- Metadata & Evidence Indicators -->
        <div class="inc-footer-row">
          <div class="meta-indicators">
            <span v-if="inc.victimCount" class="meta-tag"> {{ inc.victimCount }} Victim(s)</span>
            <span v-if="inc.hasTrapped" class="meta-tag red">️ Trapped</span>
            <span v-if="inc.hasInjuries" class="meta-tag red">🩸 Injuries</span>
            <span v-if="inc.hasFire" class="meta-tag amber"> Fire</span>
            <span v-if="inc.hasHazmat" class="meta-tag amber">️ Hazmat</span>
            <span v-if="inc.evidenceFiles?.length" class="meta-tag green">
               {{ inc.evidenceFiles.length }} Evidence File(s)
            </span>
          </div>

          <button
            type="button"
            class="btn-view-details"
            @click.stop="goToIncidentDetails(inc.id)"
          >
            Track Live Status →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIncidentStore } from '../../stores/incidentStore';
import { useSocketService } from '../../services/socketService';
import api from '../../services/api';

const router = useRouter();
const incidentStore = useIncidentStore();
const socketService = useSocketService();

const loading = ref(false);
const fetchError = ref('');
const activeFilter = ref('ALL');
const searchQuery = ref('');
const isSocketConnected = ref(true);

const incidents = computed(() => {
  return incidentStore.incidents || [];
});

const activeIncidents = computed(() => {
  return incidents.value.filter(i => i.status !== 'RESOLVED' && i.status !== 'CANCELLED');
});

const resolvedIncidents = computed(() => {
  return incidents.value.filter(i => i.status === 'RESOLVED');
});

const cancelledIncidents = computed(() => {
  return incidents.value.filter(i => i.status === 'CANCELLED' || i.status === 'DUPLICATE');
});

const historicalIncidents = computed(() => {
  return incidents.value.filter(i => i.status === 'RESOLVED' || i.status === 'CANCELLED' || i.status === 'DUPLICATE');
});

const filteredIncidents = computed(() => {
  let list = incidents.value;
  if (activeFilter.value === 'ACTIVE') list = activeIncidents.value;
  else if (activeFilter.value === 'RESOLVED') list = resolvedIncidents.value;
  else if (activeFilter.value === 'CANCELLED') list = cancelledIncidents.value;
  else if (activeFilter.value === 'HISTORICAL') list = historicalIncidents.value;

  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter(i =>
    (i.id && i.id.toLowerCase().includes(q)) ||
    (i.title && i.title.toLowerCase().includes(q)) ||
    (i.incidentType && i.incidentType.toLowerCase().includes(q)) ||
    (i.address && i.address.toLowerCase().includes(q))
  );
});

async function loadMyEmergencies() {
  loading.value = true;
  fetchError.value = '';
  try {
    const res = await api.get('/incidents');
    if (res.data?.data) {
      incidentStore.incidents = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load emergencies', err);
    fetchError.value = 'Failed to connect to ResQNet Emergency Service.';
  } finally {
    loading.value = false;
  }
}

function goToIncidentDetails(id) {
  router.push(`/citizen/emergencies/${id}`);
}

function getCategoryIcon(type) {
  if (type === 'COLLAPSE') return '️';
  if (type === 'FIRE') return '';
  if (type === 'HAZMAT') return '️';
  if (type === 'FLOOD') return '';
  if (type === 'MEDICAL') return '';
  if (type === 'EXPLOSION') return '';
  if (type === 'ELECTRICAL') return '';
  return '';
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
  if (status === 'CANCELLED' || status === 'DUPLICATE') return 'chip-cancelled';
  return 'chip-reported';
}

function getSeverityClass(sev) {
  if (sev === 'CRITICAL') return 'sev-critical';
  if (sev === 'HIGH') return 'sev-high';
  if (sev === 'MEDIUM') return 'sev-medium';
  return 'sev-low';
}

function formatTime(iso) {
  if (!iso) return 'Just now';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Recent';
  }
}

let socketInstance = null;

onMounted(() => {
  loadMyEmergencies();
  socketInstance = socketService.connect();
  if (socketInstance) {
    socketInstance.on('connect', () => { isSocketConnected.value = true; });
    socketInstance.on('disconnect', () => { isSocketConnected.value = false; });
  }
});

onUnmounted(() => {
  // Clean up if needed
});
</script>

<style scoped>
.my-emergencies-view {
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
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-and-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  min-width: 200px;
}

.search-input:focus {
  border-color: #3b82f6;
  outline: none;
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
  padding: 0.35rem 0.7rem;
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

/* Incident Cards Grid */
.incidents-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.incident-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.incident-card:hover {
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.inc-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inc-id-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.inc-id {
  font-size: 0.85rem;
  font-weight: 700;
  color: #38bdf8;
}

.inc-type-label {
  font-size: 0.75rem;
  color: #cbd5e1;
  font-weight: 600;
  background: rgba(30, 41, 59, 0.8);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.inc-time {
  font-size: 0.725rem;
  color: #94a3b8;
}

.inc-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.inc-title {
  font-size: 0.95rem;
  color: #f8fafc;
}

.inc-loc {
  font-size: 0.775rem;
  color: #94a3b8;
}

.inc-badges-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

/* Status Chips */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chip-reported {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}
.chip-reported .chip-dot { background: #3b82f6; }

.chip-enroute {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}
.chip-enroute .chip-dot { background: #f59e0b; }

.chip-scene {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}
.chip-scene .chip-dot { background: #ef4444; }

.chip-resolved {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}
.chip-resolved .chip-dot { background: #10b981; }

.chip-cancelled {
  background: rgba(100, 116, 139, 0.15);
  border: 1px solid rgba(100, 116, 139, 0.4);
  color: #94a3b8;
}
.chip-cancelled .chip-dot { background: #64748b; }

/* Severity Chips */
.sev-chip {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
}
.sev-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
.sev-high { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.sev-medium { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
.sev-low { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }

.priority-chip {
  font-size: 0.65rem;
  color: #fcd34d;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-weight: 700;
}

.inc-desc-snippet {
  font-size: 0.775rem;
  color: #cbd5e1;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inc-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding-top: 0.6rem;
  margin-top: 0.25rem;
}

.meta-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta-tag {
  font-size: 0.65rem;
  background: rgba(30, 41, 59, 0.7);
  color: #94a3b8;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.meta-tag.red { color: #fca5a5; background: rgba(239, 68, 68, 0.15); }
.meta-tag.amber { color: #fde68a; background: rgba(245, 158, 11, 0.15); }
.meta-tag.green { color: #86efac; background: rgba(16, 185, 129, 0.15); }

.btn-view-details {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s;
}

.btn-view-details:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

/* States */
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  gap: 0.75rem;
  color: #94a3b8;
  font-size: 0.85rem;
  font-family: var(--font-mono);
}

.state-panel.error {
  color: #fca5a5;
}

.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3.5rem 1.5rem;
  gap: 0.6rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.25rem;
}

.empty-panel h3 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.empty-panel p {
  font-size: 0.8rem;
  color: #94a3b8;
  max-width: 420px;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-sm { font-size: 0.75rem; padding: 0.4rem 0.8rem; }
.btn-xs { font-size: 0.7rem; padding: 0.25rem 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }

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
  .inc-footer-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
