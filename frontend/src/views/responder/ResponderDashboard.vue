<template>
  <div class="responder-view">
    <div class="header-card tactical-card">
      <div>
        <h2>PROFESSIONAL RESPONDER OPERATIONS CONSOLE</h2>
        <p>Field unit terminal with GPS telemetry, incident acceptance, and fatigue monitoring.</p>
      </div>
      <div class="duty-pill">
        <span class="dot"></span>
        <span>ON DUTY · SHIFT 4.5h (Fatigue: 28%)</span>
      </div>
    </div>

    <!-- Active Assigned Incident & Units List -->
    <div class="responder-grid">
      <div class="tactical-card unit-card">
        <div class="section-title">ACTIVE DISPATCH ASSIGNMENT</div>
        <div class="assignment-box">
          <div class="ass-top">
            <span class="badge badge-critical">INCIDENT #INC-1042</span>
            <span class="eta-pill">ETA: 4 MIN (1.4 km)</span>
          </div>
          <h3>Commercial Building Structural Collapse</h3>
          <p>42 Harbour Road, Sector 4 · 8 Trapped Victims</p>
          
          <div class="action-row">
            <button class="btn btn-primary" @click="updateStatus('ON_SCENE')">
              Arrived On Scene
            </button>
            <button class="btn btn-ghost" @click="updateStatus('TRANSPORTING')">
              Transport to Hospital
            </button>
          </div>
        </div>
      </div>

      <div class="tactical-card list-card">
        <div class="section-title">ALL REGISTERED UNITS & TELEMETRY</div>
        <div class="unit-list">
          <div v-for="r in responderStore.responders" :key="r.id" class="unit-row">
            <div>
              <strong>{{ r.name }} ({{ r.badgeNumber }})</strong>
              <p>{{ r.vehicle }} · Fatigue: {{ r.fatigueScore }}%</p>
            </div>
            <StatusBadge :status="r.status" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useResponderStore } from '../../stores/responderStore';
import StatusBadge from '../../components/common/StatusBadge.vue';

const responderStore = useResponderStore();

onMounted(() => {
  responderStore.fetchResponders();
});

function updateStatus(status) {
  alert(`Unit status updated to: ${status}`);
}
</script>

<style scoped>
.responder-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
}

.header-card h2 {
  font-size: 1.2rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.duty-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: #6ee7b7;
}

.duty-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.responder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.unit-card, .list-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.assignment-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ass-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eta-pill {
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  font-size: 0.8rem;
}

.action-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.unit-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 0.65rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.unit-row p {
  font-size: 0.7rem;
  color: #94a3b8;
}
</style>
