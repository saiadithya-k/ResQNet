<template>
  <div class="family-view">
    <div class="header-card tactical-card">
      <div>
        <h2>👨‍👩‍👧 FAMILY SAFETY NETWORK & SURVIVOR CHECK-IN</h2>
        <p>Live status of your registered family members and instant survivor safety check-ins during major incidents.</p>
      </div>
    </div>

    <div class="family-grid">
      <!-- Family List -->
      <div class="tactical-card list-card">
        <div class="section-title">MONITORED FAMILY MEMBERS</div>
        <div class="family-list">
          <div v-for="mem in familyMembers" :key="mem.id" class="fam-item">
            <div class="fam-info">
              <strong>{{ mem.name }}</strong>
              <span>{{ mem.relationship }} · Last seen: {{ mem.location }}</span>
            </div>
            <StatusBadge :status="mem.status" />
          </div>
        </div>
      </div>

      <!-- Quick Survivor Check-In -->
      <div class="tactical-card checkin-card">
        <div class="section-title">SURVIVOR SELF CHECK-IN</div>
        <form @submit.prevent="submitCheckin" class="checkin-form">
          <div>
            <label>Full Name:</label>
            <input type="text" v-model="form.fullName" class="form-input" required />
          </div>
          <div>
            <label>Current Status:</label>
            <select v-model="form.status" class="form-input">
              <option value="SAFE">🟢 SAFE (Uninjured)</option>
              <option value="INJURED">🟡 INJURED (Need Medical Assistance)</option>
              <option value="TRAPPED">🔴 TRAPPED (Need Immediate Rescue)</option>
            </select>
          </div>
          <div>
            <label>Current Shelter / Location:</label>
            <input type="text" v-model="form.shelterName" class="form-input" placeholder="e.g. City Memorial Stadium" />
          </div>
          <button type="submit" class="btn btn-primary">
            ✓ Transmit Safety Status to Command & Family
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import StatusBadge from '../../components/common/StatusBadge.vue';
import api from '../../services/api';

const familyMembers = ref([]);
const form = ref({
  fullName: 'Vignesh Kumar',
  status: 'SAFE',
  shelterName: 'City Memorial Stadium Shelter'
});

onMounted(async () => {
  try {
    const res = await api.get('/citizens/family-safety');
    familyMembers.value = res.data.data;
  } catch (err) {
    console.error('Failed to load family members', err);
  }
});

async function submitCheckin() {
  await api.post('/survivors/checkin', form.value);
  alert('✅ Safety check-in broadcasted to family members and disaster command!');
}
</script>

<style scoped>
.family-view {
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

.family-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.list-card, .checkin-card {
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

.family-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.fam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.75rem;
}

.fam-info {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
}

.fam-info strong {
  color: #f1f5f9;
}

.fam-info span {
  font-size: 0.7rem;
  color: #94a3b8;
}

.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.form-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  margin-top: 0.25rem;
}
</style>
