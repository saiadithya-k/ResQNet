<template>
  <div class="citizen-view">
    <div class="header-card tactical-card">
      <div>
        <h2>👤 CITIZEN EMERGENCY PORTAL</h2>
        <p>Instant emergency reporting, voice SOS in native languages, and real-time responder dispatch tracking.</p>
      </div>
      <div class="action-buttons">
        <router-link to="/citizen/voice" class="btn btn-danger">
          🎙️ Speak Emergency (SOS)
        </router-link>
        <router-link to="/citizen/report" class="btn btn-primary">
          📝 File Emergency Report
        </router-link>
      </div>
    </div>

    <!-- Active Reports & Family Safety Cards -->
    <div class="citizen-grid">
      <div class="tactical-card card-pad">
        <h3>🚨 MY ACTIVE EMERGENCY REPORTS</h3>
        <div class="report-list">
          <div v-for="inc in incidentStore.incidents" :key="inc.id" class="report-item">
            <div>
              <strong>{{ inc.title }}</strong>
              <p>{{ inc.address }} · {{ inc.status }}</p>
            </div>
            <StatusBadge :status="inc.severity" />
          </div>
        </div>
      </div>

      <div class="tactical-card card-pad">
        <h3>👨‍👩‍👧 FAMILY SAFETY NETWORK</h3>
        <div class="family-quick">
          <p>3 Family members monitored. All safe or checking in.</p>
          <router-link to="/citizen/family" class="btn btn-ghost btn-sm">
            View Family Safety Status →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIncidentStore } from '../../stores/incidentStore';
import StatusBadge from '../../components/common/StatusBadge.vue';

const incidentStore = useIncidentStore();
</script>

<style scoped>
.citizen-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.citizen-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.card-pad {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-pad h3 {
  font-size: 0.85rem;
  font-family: var(--font-mono);
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.75rem;
}

.report-item strong {
  font-size: 0.85rem;
  color: #f1f5f9;
}

.report-item p {
  font-size: 0.7rem;
  color: #94a3b8;
}

.family-quick {
  font-size: 0.8rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
