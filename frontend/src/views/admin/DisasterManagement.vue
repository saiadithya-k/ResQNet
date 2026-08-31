<template>
  <div class="disaster-view">
    <!-- Disaster Mode Escalation Header Card -->
    <div class="tactical-card disaster-banner-card" :class="{ 'active-mode': disasterStore.isDisasterMode }">
      <div class="banner-left">
        <div class="siren-circle">🚨</div>
        <div>
          <h2>TACTICAL DISASTER MODE CONTROLLER</h2>
          <p>Instantly escalates platform state, activates multi-agency resource sharing, and issues geo-targeted broadcast alerts.</p>
        </div>
      </div>

      <div class="banner-right">
        <button
          v-if="!disasterStore.isDisasterMode"
          class="btn btn-danger btn-lg"
          @click="activateDisaster"
        >
          🚨 ACTIVATE DISASTER MODE
        </button>
        <button
          v-else
          class="btn btn-ghost btn-lg"
          @click="standDownDisaster"
        >
          STAND-DOWN DISASTER MODE
        </button>
      </div>
    </div>

    <!-- Disaster Operations Grid -->
    <div class="disaster-grid">
      <!-- 1. Active Disaster Zones -->
      <div class="tactical-card panel-card">
        <div class="panel-header">
          <h3>⚠️ AFFECTED DISASTER ZONES</h3>
          <span class="badge badge-critical">{{ disasterStore.zones.length }} Active</span>
        </div>
        <div class="zone-list">
          <div v-for="z in disasterStore.zones" :key="z.id" class="zone-row">
            <div class="zone-info">
              <strong>{{ z.name }}</strong>
              <span>Type: {{ z.type }}</span>
            </div>
            <StatusBadge :status="z.riskLevel" />
          </div>
        </div>
      </div>

      <!-- 2. Evacuation Shelters Status -->
      <div class="tactical-card panel-card">
        <div class="panel-header">
          <h3>🏠 EVACUATION SHELTERS & OCCUPANCY</h3>
          <span class="badge badge-success">{{ disasterStore.shelters.length }} Open</span>
        </div>
        <div class="shelter-list">
          <div v-for="s in disasterStore.shelters" :key="s.id" class="shelter-row">
            <div class="shelter-header">
              <strong>{{ s.name }} ({{ s.district }})</strong>
              <span class="shelter-ratio">{{ s.currentOccupancy }} / {{ s.capacity }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${Math.round((s.currentOccupancy / s.capacity) * 100)}%` }"
              ></div>
            </div>
            <div class="shelter-badges">
              <span>🍲 Food: {{ s.foodSupply }}</span>
              <span>💧 Water: {{ s.waterSupply }}</span>
              <span>🏥 Medical: {{ s.medicalStation ? 'READY' : 'NO' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Public Emergency Alert Broadcast -->
      <div class="tactical-card panel-card">
        <div class="panel-header">
          <h3>📢 PUBLIC EMERGENCY BROADCAST</h3>
          <span class="badge badge-high">SMS / Web Push</span>
        </div>
        <form class="alert-form" @submit.prevent="broadcastAlert">
          <div>
            <label>Alert Title:</label>
            <input type="text" v-model="alertTitle" class="form-input" placeholder="e.g. ⚠️ FLOOD LEVEL 3 WARNING" required />
          </div>
          <div>
            <label>Message Content:</label>
            <textarea v-model="alertMessage" class="form-textarea" rows="3" placeholder="Instruction to citizens..." required></textarea>
          </div>
          <div>
            <label>Target District:</label>
            <select v-model="alertDistrict" class="form-input">
              <option value="All Districts">All Districts (Metropolitan Area)</option>
              <option value="Riverbank South">Riverbank South</option>
              <option value="Central Zone">Central Zone</option>
              <option value="North Industrial">North Industrial</option>
            </select>
          </div>
          <button type="submit" class="btn btn-danger">
            📡 Broadcast Emergency Alert Now
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDisasterStore } from '../../stores/disasterStore';
import StatusBadge from '../../components/common/StatusBadge.vue';
import api from '../../services/api';

const disasterStore = useDisasterStore();
const alertTitle = ref('⚠️ FLASH FLOOD EVACUATION WARNING');
const alertMessage = ref('Water levels rising rapidly in low-lying river areas. Move to designated high-ground shelters immediately.');
const alertDistrict = ref('Riverbank South');

async function activateDisaster() {
  await disasterStore.toggleDisasterMode(true, {
    disasterType: 'FLASH_FLOOD_DISASTER_LEVEL_3',
    district: 'Riverbank South & Central Zone',
    severity: 'CRITICAL'
  });
}

async function standDownDisaster() {
  await disasterStore.toggleDisasterMode(false);
}

async function broadcastAlert() {
  await api.post('/alerts/broadcast', {
    title: alertTitle.value,
    message: alertMessage.value,
    district: alertDistrict.value,
    severity: 'CRITICAL'
  });
  alert('📢 Emergency Broadcast Dispatched to All Citizen Terminals & Push Channels!');
}
</script>

<style scoped>
.disaster-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.disaster-banner-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-left: 4px solid #f59e0b;
}

.disaster-banner-card.active-mode {
  border-left: 4px solid #ef4444;
  background: rgba(220, 38, 38, 0.1);
  box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.siren-circle {
  font-size: 2rem;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
}

.disaster-banner-card h2 {
  font-size: 1.2rem;
  color: #f8fafc;
}

.disaster-banner-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.disaster-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.panel-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
}

.panel-header h3 {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-family: var(--font-mono);
}

.zone-list, .shelter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.zone-row, .shelter-row {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.75rem;
}

.zone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.zone-info {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
}

.zone-info strong {
  color: #f1f5f9;
}

.zone-info span {
  color: #94a3b8;
  font-size: 0.7rem;
}

.shelter-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}

.shelter-ratio {
  font-family: var(--font-mono);
  color: #38bdf8;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: #1e293b;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #ef4444);
  border-radius: 4px;
}

.shelter-badges {
  display: flex;
  gap: 0.5rem;
  font-size: 0.65rem;
  color: #94a3b8;
}

.alert-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.form-input, .form-textarea {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: white;
  padding: 0.5rem;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}
</style>
