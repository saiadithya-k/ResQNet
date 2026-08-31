<template>
  <div class="citizen-view">
    <!-- Hero Emergency Action Banner -->
    <div class="emergency-hero tactical-card">
      <div class="hero-content">
        <div class="brand-tag">
          <span class="live-pulse"></span>
          <span>RESQ CITIZEN EMERGENCY PORTAL</span>
        </div>
        <h1 class="hero-title">Emergency Assistance & AI Response</h1>
        <p class="hero-subtitle">
          Direct connection to Emergency Services, AI Triage, and Responder Dispatch.
        </p>
      </div>

      <!-- Primary Emergency Trigger Actions -->
      <div class="hero-actions">
        <router-link to="/citizen/report" class="btn btn-emergency-primary" id="btn-report-emergency">
          <span class="btn-icon">🚨</span>
          <div class="btn-text">
            <span class="btn-main">REPORT EMERGENCY</span>
            <span class="btn-sub">Text & GPS Incident Filing</span>
          </div>
        </router-link>

        <router-link to="/citizen/voice" class="btn btn-emergency-secondary" id="btn-voice-emergency">
          <span class="btn-icon">🎙️</span>
          <div class="btn-text">
            <span class="btn-main">SPEAK EMERGENCY (SOS)</span>
            <span class="btn-sub">Tamil · English · Hindi · Telugu</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Quick Navigation Bar for Citizen Destinations -->
    <div class="quick-nav-bar tactical-card">
      <router-link to="/citizen" class="nav-pill active">
        <span>📋</span> Dashboard
      </router-link>
      <router-link to="/citizen/emergencies" class="nav-pill">
        <span>🚨</span> My Emergencies ({{ myIncidents.length }})
      </router-link>
      <router-link to="/citizen/family" class="nav-pill">
        <span>👨‍👩‍👧</span> Family Safety
      </router-link>
      <router-link to="/citizen/alerts" class="nav-pill">
        <span>📢</span> Public Alerts
      </router-link>
      <router-link to="/citizen/risk" class="nav-pill">
        <span>🔮</span> Risk Forecast
      </router-link>
      <router-link to="/citizen/profile" class="nav-pill">
        <span>👤</span> Citizen Profile
      </router-link>
    </div>

    <!-- Citizen Grid: Active Reports & Family Safety -->
    <div class="citizen-grid">
      <!-- Active Reports Panel -->
      <div class="tactical-card card-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="dot-red"></span>
            <h3>MY RECENT EMERGENCY REPORTS</h3>
          </div>
          <button class="btn btn-ghost btn-xs" @click="refreshIncidents" :disabled="loadingIncidents">
            {{ loadingIncidents ? 'Refreshing...' : '🔄 Refresh' }}
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loadingIncidents" class="state-box">
          <div class="spinner-sm"></div>
          <span>Loading your reported emergencies...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="myIncidents.length === 0" class="empty-state">
          <div class="empty-icon">🛡️</div>
          <div class="empty-title">No Active Emergencies Reported</div>
          <p class="empty-text">If you or someone nearby is in danger, use the buttons above to transmit an emergency report.</p>
          <router-link to="/citizen/report" class="btn btn-primary btn-sm mt-2">
            File an Incident Report
          </router-link>
        </div>

        <!-- List State -->
        <div v-else class="report-list">
          <div
            v-for="inc in myIncidents"
            :key="inc.id"
            class="report-item clickable"
            @click="$router.push(`/citizen/emergencies/${inc.id}`)"
          >
            <div class="report-main">
              <div class="report-title-row">
                <span class="report-id font-mono">{{ inc.id }}</span>
                <strong class="report-title">{{ inc.title }}</strong>
              </div>
              <div class="report-meta">
                <span>📍 {{ inc.address || 'GPS Coordinates Locked' }}</span>
                <span>⏱️ {{ inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent' }}</span>
                <span>👥 {{ inc.victimCount || 1 }} Victim(s)</span>
              </div>
            </div>
            <div class="report-badges">
              <StatusBadge :status="inc.severity" />
              <span class="badge-status-pill">{{ inc.status }}</span>
              <span class="link-arrow">→</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Family Safety & System Readiness -->
      <div class="side-column">
        <!-- Family Network Card -->
        <div class="tactical-card card-panel">
          <div class="panel-header">
            <div class="panel-title">
              <span class="dot-blue"></span>
              <h3>FAMILY SAFETY NETWORK</h3>
            </div>
            <router-link to="/citizen/family" class="link-action">
              Manage →
            </router-link>
          </div>

          <div class="family-summary">
            <div class="stat-row">
              <div class="stat-chip safe">
                <span class="chip-val">{{ familyStats.safe }}</span>
                <span class="chip-label">Safe</span>
              </div>
              <div class="stat-chip injured">
                <span class="chip-val">{{ familyStats.injured }}</span>
                <span class="chip-label">Injured</span>
              </div>
              <div class="stat-chip missing">
                <span class="chip-val">{{ familyStats.missing }}</span>
                <span class="chip-label">Missing</span>
              </div>
            </div>
            <p class="family-desc">
              Monitor real-time status of family members and send instant safety check-ins during city disasters.
            </p>
            <router-link to="/citizen/family" class="btn btn-ghost btn-sm btn-block">
              Open Family Network & Check-In
            </router-link>
          </div>
        </div>

        <!-- Emergency Readiness Guidelines -->
        <div class="tactical-card card-panel guide-card">
          <div class="panel-header">
            <div class="panel-title">
              <span class="dot-amber"></span>
              <h3>CITIZEN PROTOCOL IN CRISIS</h3>
            </div>
          </div>
          <ul class="protocol-list">
            <li><strong>1. Stay Grounded:</strong> If trapped or injured, conserve phone battery and await dispatched units.</li>
            <li><strong>2. Voice SOS:</strong> Use voice reporting if hands are occupied or in low visibility.</li>
            <li><strong>3. Update Check-In:</strong> Mark yourself as Safe once you reach a designated shelter.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useIncidentStore } from '../../stores/incidentStore';
import StatusBadge from '../../components/common/StatusBadge.vue';
import api from '../../services/api';

const incidentStore = useIncidentStore();
const loadingIncidents = ref(false);

const familyStats = ref({
  safe: 1,
  injured: 1,
  missing: 1
});

const myIncidents = computed(() => {
  return incidentStore.incidents || [];
});

async function refreshIncidents() {
  loadingIncidents.value = true;
  try {
    await incidentStore.fetchIncidents();
  } catch (err) {
    console.error('Failed to refresh incidents', err);
  } finally {
    loadingIncidents.value = false;
  }
}

async function loadFamilyStatus() {
  try {
    const res = await api.get('/citizens/family-safety');
    if (res.data?.data) {
      const list = res.data.data;
      familyStats.value = {
        safe: list.filter(m => m.status === 'SAFE').length,
        injured: list.filter(m => m.status === 'INJURED').length,
        missing: list.filter(m => m.status === 'MISSING').length
      };
    }
  } catch (e) {
    // Graceful fallback to default values
  }
}

onMounted(() => {
  refreshIncidents();
  loadFamilyStatus();
});
</script>

<style scoped>
.citizen-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Hero Section */
.emergency-hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 20, 0.95));
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.brand-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.05em;
  margin-bottom: 0.35rem;
}

.live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulse-dot 1.5s infinite;
}

.hero-title {
  font-size: 1.5rem;
  color: #f8fafc;
  font-weight: 800;
}

.hero-subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 600px;
}

/* Primary/Secondary Buttons */
.hero-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-emergency-primary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 2px solid #ef4444;
  border-radius: 10px;
  color: white;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-emergency-primary:hover {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(220, 38, 38, 0.5);
}

.btn-emergency-secondary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  color: white;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.25);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-emergency-secondary:hover {
  background: linear-gradient(135deg, #2563eb, #1e3a8a);
  border-color: #60a5fa;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.btn-text {
  display: flex;
  flex-direction: column;
}

.btn-main {
  font-size: 1rem;
  font-weight: 800;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

.btn-sub {
  font-size: 0.725rem;
  color: rgba(255, 255, 255, 0.75);
}

/* Quick Navigation Pills */
.quick-nav-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  overflow-x: auto;
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.775rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.nav-pill:hover, .nav-pill.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #60a5fa;
}

/* Grid Layout */
.citizen-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.25rem;
}

.card-panel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.6rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-title h3 {
  font-size: 0.825rem;
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
  color: #f8fafc;
}

.dot-red {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.dot-blue {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
}

.dot-amber {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
}

.link-action {
  font-size: 0.725rem;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}

.link-action:hover {
  text-decoration: underline;
}

/* Report List */
.report-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  transition: all 0.2s;
}

.report-item.clickable {
  cursor: pointer;
}

.report-item.clickable:hover {
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(15, 23, 42, 0.95);
  transform: translateX(2px);
}

.report-item:hover {
  border-color: rgba(59, 130, 246, 0.6);
}

.report-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.report-id {
  font-family: var(--font-mono);
  font-size: 0.675rem;
  background: #1e293b;
  color: #94a3b8;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

.report-title {
  font-size: 0.875rem;
  color: #f1f5f9;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.725rem;
  color: #94a3b8;
}

.report-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.badge-status-pill {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Side Column */
.side-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.family-summary {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
}

.stat-chip.safe {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.08);
}
.stat-chip.safe .chip-val { color: #34d399; }

.stat-chip.injured {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.08);
}
.stat-chip.injured .chip-val { color: #fbbf24; }

.stat-chip.missing {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
}
.stat-chip.missing .chip-val { color: #f87171; }

.chip-val {
  font-size: 1.25rem;
  font-weight: 800;
  font-family: var(--font-mono);
}

.chip-label {
  font-size: 0.675rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.family-desc {
  font-size: 0.775rem;
  color: #cbd5e1;
  line-height: 1.4;
}

.protocol-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  padding-left: 0;
}

.protocol-list strong {
  color: #f8fafc;
}

/* States */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 2.2rem;
}

.empty-title {
  font-size: 0.9rem;
  color: #f1f5f9;
  font-weight: 700;
}

.empty-text {
  font-size: 0.75rem;
  color: #94a3b8;
  max-width: 320px;
}

.btn-block {
  width: 100%;
  text-align: center;
  justify-content: center;
}

.btn-xs {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-actions {
    grid-template-columns: 1fr;
  }
  .citizen-grid {
    grid-template-columns: 1fr;
  }
}
</style>
