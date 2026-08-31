<template>
  <div class="command-dashboard">
    <!-- Top Tactical KPI Row -->
    <div class="kpi-banner">
      <div class="kpi-card tactical-card">
        <div class="kpi-icon icon-red">🚨</div>
        <div class="kpi-body">
          <span class="kpi-title">CRITICAL EMERGENCIES</span>
          <span class="kpi-val text-red">{{ incidentStore.criticalIncidents.length }}</span>
        </div>
      </div>

      <div class="kpi-card tactical-card">
        <div class="kpi-icon icon-blue">🚑</div>
        <div class="kpi-body">
          <span class="kpi-title">AVAILABLE AMBULANCES</span>
          <span class="kpi-val text-blue">31</span>
        </div>
      </div>

      <div class="kpi-card tactical-card">
        <div class="kpi-icon icon-emerald">🧑‍🚒</div>
        <div class="kpi-body">
          <span class="kpi-title">ACTIVE RESPONDERS</span>
          <span class="kpi-val text-emerald">{{ responderStore.responders.length + 80 }}</span>
        </div>
      </div>

      <div class="kpi-card tactical-card">
        <div class="kpi-icon icon-purple">🏥</div>
        <div class="kpi-body">
          <span class="kpi-title">HOSPITAL CAPACITY</span>
          <span class="kpi-val text-purple">74%</span>
        </div>
      </div>

      <div class="kpi-card tactical-card">
        <div class="kpi-icon icon-amber">⏱️</div>
        <div class="kpi-body">
          <span class="kpi-title">AVERAGE ETA</span>
          <span class="kpi-val text-amber">7.2 min</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace: Incident Triage Feed (Left), GIS Map (Center), Incident Action Detail (Right) -->
    <div class="command-grid">
      <!-- 1. Live Incidents Queue (Left Column) -->
      <section class="incidents-feed tactical-card">
        <div class="section-header">
          <h3>⚡ LIVE INCIDENTS QUEUE</h3>
          <span class="badge badge-critical">{{ incidentStore.incidents.length }} Active</span>
        </div>

        <div class="incident-list">
          <div
            v-for="inc in incidentStore.incidents"
            :key="inc.id"
            :class="['incident-item', { 'active-selection': incidentStore.selectedIncident?.id === inc.id, 'item-critical': inc.severity === 'CRITICAL' }]"
            @click="incidentStore.selectIncident(inc)"
          >
            <div class="item-top">
              <span class="priority-score">
                <span class="score-num">{{ inc.priorityScore }}</span>
                <span class="score-label">PRIORITY</span>
              </span>
              <div class="item-title-meta">
                <span class="inc-title">{{ inc.title }}</span>
                <span class="inc-loc">{{ inc.address }} ({{ inc.district }})</span>
              </div>
            </div>

            <div class="item-badges">
              <StatusBadge :status="inc.severity" />
              <span class="badge-tag">👤 {{ inc.victimCount }} Victims</span>
              <span v-if="inc.aiEmotionState" class="badge-emotion">❤️ {{ inc.aiEmotionState }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Central GIS Interactive Operations Map (Middle Column) -->
      <section class="gis-center-panel">
        <EmergencyMap />
      </section>

      <!-- 3. Tactical Action & Dispatch Console (Right Column) -->
      <section class="action-console tactical-card">
        <div v-if="incidentStore.selectedIncident" class="console-body">
          <div class="section-header">
            <h3>INCIDENT #{{ incidentStore.selectedIncident.id }}</h3>
            <StatusBadge :status="incidentStore.selectedIncident.severity" />
          </div>

          <h4 class="console-incident-title">{{ incidentStore.selectedIncident.title }}</h4>
          <p class="console-desc">{{ incidentStore.selectedIncident.description }}</p>

          <!-- AI Intelligence Breakdown Box -->
          <div class="ai-intel-box">
            <div class="ai-intel-header">
              <span>🧠 AI TRIAGE ENRICHMENT</span>
              <span class="ai-conf">94% Confidence</span>
            </div>
            <div class="ai-grid">
              <div><strong>Emotion:</strong> {{ incidentStore.selectedIncident.aiEmotionState || 'PANICKED' }}</div>
              <div><strong>Spread Risk:</strong> HIGH</div>
              <div><strong>Trapped:</strong> {{ incidentStore.selectedIncident.hasTrapped ? 'YES' : 'NO' }}</div>
              <div><strong>Fire / Hazmat:</strong> {{ incidentStore.selectedIncident.hasFire || incidentStore.selectedIncident.hasHazmat ? 'DETECTED' : 'CLEAR' }}</div>
            </div>
          </div>

          <!-- Quick Dispatch Selection -->
          <div class="dispatch-section">
            <h4>🚑 FAST-ACTION DISPATCH</h4>
            <div class="responder-picker">
              <label>Select Unit:</label>
              <select v-model="selectedResponderId" class="tactical-select">
                <option v-for="r in responderStore.responders" :key="r.id" :value="r.id">
                  {{ r.name }} ({{ r.status }} - ETA {{ r.etaMinutes || 5 }}m)
                </option>
              </select>
            </div>

            <div class="btn-group">
              <button class="btn btn-primary" @click="handleDispatch">
                ⚡ Dispatch Recommended Unit
              </button>
              <button class="btn btn-ghost" @click="resolveIncident">
                ✓ Mark Resolved
              </button>
            </div>
          </div>

          <!-- Operational Audit Timeline -->
          <div class="timeline-section">
            <h4>⏱️ INCIDENT LIFECYCLE TIMELINE</h4>
            <div class="timeline-stream">
              <div v-for="(t, idx) in incidentStore.selectedIncident.timeline" :key="idx" class="timeline-step">
                <div class="step-time">{{ t.time }}</div>
                <div class="step-line"></div>
                <div class="step-content">
                  <strong>{{ t.title }}</strong>
                  <p>{{ t.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-selection">
          Select an incident from the queue or map to inspect details and dispatch units.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';
import EmergencyMap from '../../components/map/EmergencyMap.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';

const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const selectedResponderId = ref('RESP-01');

onMounted(async () => {
  await Promise.all([
    incidentStore.fetchIncidents(),
    responderStore.fetchResponders(),
    hospitalStore.fetchHospitals(),
    disasterStore.fetchStatus()
  ]);
});

async function handleDispatch() {
  if (!incidentStore.selectedIncident || !selectedResponderId.value) return;
  try {
    await responderStore.dispatch(incidentStore.selectedIncident.id, selectedResponderId.value);
    await incidentStore.fetchIncidents();
    alert('✅ Responder Dispatched Successfully via Socket.IO!');
  } catch (err) {
    alert('Failed to dispatch responder');
  }
}

async function resolveIncident() {
  if (!incidentStore.selectedIncident) return;
  await incidentStore.updateStatus(incidentStore.selectedIncident.id, 'RESOLVED', 'Incident officially marked resolved by Command Chief');
}
</script>

<style scoped>
.command-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.kpi-banner {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1rem;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.icon-red { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); }
.icon-blue { background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); }
.icon-emerald { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); }
.icon-purple { background: rgba(168, 85, 247, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); }
.icon-amber { background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); }

.kpi-body {
  display: flex;
  flex-direction: column;
}

.kpi-title {
  font-size: 0.65rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.kpi-val {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--font-display);
}

.text-red { color: #f87171; }
.text-blue { color: #60a5fa; }
.text-emerald { color: #34d399; }
.text-purple { color: #c084fc; }
.text-amber { color: #fbbf24; }

.command-grid {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 1rem;
  flex: 1;
  min-height: 520px;
}

.incidents-feed, .action-console {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
}

.section-header h3 {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-family: var(--font-mono);
}

.incident-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.incident-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.incident-item:hover {
  border-color: #3b82f6;
  background: rgba(30, 41, 59, 0.7);
}

.incident-item.active-selection {
  border-color: #60a5fa;
  background: rgba(37, 99, 235, 0.15);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.incident-item.item-critical {
  border-left: 3px solid #ef4444;
}

.item-top {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.priority-score {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 42px;
}

.score-num {
  font-size: 0.9rem;
  font-weight: 800;
  color: #f87171;
  font-family: var(--font-mono);
}

.score-label {
  font-size: 0.5rem;
  color: #94a3b8;
}

.item-title-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.inc-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.2;
}

.inc-loc {
  font-size: 0.7rem;
  color: #94a3b8;
}

.item-badges {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.badge-tag, .badge-emotion {
  font-size: 0.65rem;
  background: rgba(30, 41, 59, 0.7);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: #cbd5e1;
}

.gis-center-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.console-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.console-incident-title {
  font-size: 1rem;
  color: #f8fafc;
}

.console-desc {
  font-size: 0.775rem;
  color: #94a3b8;
}

.ai-intel-box {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 0.625rem;
}

.ai-intel-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #38bdf8;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.ai-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: #cbd5e1;
}

.dispatch-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dispatch-section h4, .timeline-section h4 {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: #e2e8f0;
}

.responder-picker {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.tactical-select {
  background: #090e1a;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 0.4rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
}

.timeline-stream {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.timeline-step {
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
}

.step-time {
  font-family: var(--font-mono);
  color: #38bdf8;
  font-weight: 700;
  min-width: 35px;
}

.step-content strong {
  color: #f1f5f9;
}

.step-content p {
  color: #94a3b8;
  font-size: 0.65rem;
}
</style>
