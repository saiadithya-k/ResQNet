<template>
  <div class="community-view">
    <div class="header-card tactical-card">
      <div>
        <h2>🧑‍🚒 COMMUNITY RESPONDER MESH (500M HYPER-LOCAL)</h2>
        <p>Verified CPR & First Aid certified citizen responders receiving instant localized alerts within 500 meters of critical incidents.</p>
      </div>
    </div>

    <div class="community-grid">
      <div class="tactical-card nearby-card">
        <div class="section-title">🚨 NEARBY EMERGENCY ALERTS (WITHIN 500m)</div>
        <div class="alert-box">
          <div class="alert-top">
            <span class="badge badge-critical">280 METERS AWAY</span>
            <span class="text-cyan font-mono">EST. ARRIVAL: 2 MIN</span>
          </div>
          <h3>Structural Collapse & Trapped Persons</h3>
          <p>42 Harbour Road · Certified CPR / First Aid requested immediately</p>

          <div class="btn-group">
            <button class="btn btn-primary" @click="acceptAssistance">
              ✓ Accept & Check-In On Scene
            </button>
            <button class="btn btn-ghost">
              Decline
            </button>
          </div>
        </div>
      </div>

      <div class="tactical-card cert-card">
        <div class="section-title">VERIFIED SKILLS & CERTIFICATIONS</div>
        <div class="cert-list">
          <div class="cert-item">
            <span>🫀 Advanced CPR Certified</span>
            <span class="badge badge-success">VERIFIED</span>
          </div>
          <div class="cert-item">
            <span>🩹 Red Cross Emergency First Aid</span>
            <span class="badge badge-success">VERIFIED</span>
          </div>
          <div class="cert-item">
            <span>🧯 Basic Fire Extinguisher Handling</span>
            <span class="badge badge-success">VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '../../services/api';

async function acceptAssistance() {
  await api.post('/community-responders/checkin', {
    responderId: 'RESP-COMM-01',
    incidentId: 'INC-1042',
    status: 'ON_SCENE'
  });
  alert('✅ Checked in on scene! Command Center notified via Socket.IO.');
}
</script>

<style scoped>
.community-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-card {
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

.community-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.nearby-card, .cert-card {
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

.alert-box {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.cert-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #f1f5f9;
}

.text-cyan { color: #06b6d4; }
.font-mono { font-family: var(--font-mono); }
</style>
