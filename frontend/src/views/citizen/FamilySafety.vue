<template>
  <div class="family-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2>‍‍ FAMILY SAFETY NETWORK</h2>
        <p>Private status monitoring for your registered family members and instant survivor safety check-ins.</p>
      </div>
      <div class="header-action">
        <button class="btn btn-ghost btn-xs" @click="loadFamilyMembers" :disabled="loading">
          {{ loading ? 'Refreshing...' : ' Refresh Network' }}
        </button>
      </div>
    </div>

    <div class="family-grid">
      <!-- Monitored Family Members List -->
      <div class="tactical-card list-card">
        <div class="section-title">
          <span>MONITORED FAMILY MEMBERS ({{ familyMembers.length }})</span>
          <span class="sec-subtitle">Encrypted Family Channel</span>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="state-box">
          <div class="spinner-sm"></div>
          <span>Loading family safety network...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="fetchError" class="state-box-error">
          <span>️ {{ fetchError }}</span>
          <button class="btn btn-primary btn-xs mt-2" @click="loadFamilyMembers">Try Again</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="familyMembers.length === 0" class="empty-box">
          <span class="empty-icon">‍‍</span>
          <strong>No Family Members Registered</strong>
          <p>Link your family members by phone number to track their safety during emergency situations.</p>
        </div>

        <!-- Active List -->
        <div v-else class="family-list">
          <div v-for="mem in familyMembers" :key="mem.id" class="fam-item">
            <div class="fam-info">
              <div class="fam-header-line">
                <strong class="fam-name">{{ mem.name }}</strong>
                <span class="fam-rel">{{ mem.relationship }}</span>
              </div>
              <div class="fam-meta">
                <span> {{ mem.location || 'Location Pending' }}</span>
                <span>⏱️ {{ mem.time || 'Recent' }}</span>
              </div>
            </div>
            <div class="fam-status-col">
              <span :class="['status-chip', getStatusClass(mem.status)]">
                <span class="chip-dot"></span>
                <span>{{ mem.status }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Survivor Check-In Form -->
      <div class="tactical-card checkin-card">
        <div class="section-title">
          <span>SURVIVOR SELF CHECK-IN</span>
          <span class="sec-subtitle">Broadcast Your Status</span>
        </div>

        <p class="checkin-intro">
          If you are caught in an active disaster or emergency zone, check in here so responders and your family know you are accounted for.
        </p>

        <!-- Feedback Alert -->
        <div v-if="checkinSuccess" class="checkin-success-banner">
          <span>✓ Safety check-in transmitted to family and emergency authorities!</span>
        </div>

        <form @submit.prevent="submitCheckin" class="checkin-form">
          <div class="form-group">
            <label for="survivorName">Your Name:</label>
            <input
              id="survivorName"
              type="text"
              v-model="form.fullName"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="survivorStatus">Your Current Condition:</label>
            <select id="survivorStatus" v-model="form.status" class="form-input">
              <option value="SAFE"> SAFE (Uninjured / Sheltered)</option>
              <option value="INJURED"> INJURED (Need Medical Attention)</option>
              <option value="MISSING"> MISSING / STRANDED (Need Rescue)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="survivorShelter">Current Location / Shelter Landmark:</label>
            <input
              id="survivorShelter"
              type="text"
              v-model="form.shelterName"
              class="form-input"
              placeholder="e.g. City Memorial Stadium Shelter or 42 Harbour Road"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-checkin"
            :disabled="submittingCheckin"
          >
            <span v-if="submittingCheckin" class="spinner-sm"></span>
            <span>{{ submittingCheckin ? 'Broadcasting Status...' : '✓ Transmit Safety Status to Command & Family' }}</span>
          </button>

          <router-link to="/citizen/survivor" class="btn btn-ghost btn-block btn-xs mt-2 text-center">
            ️ Open Full Dedicated Survivor Check-In →
          </router-link>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const familyMembers = ref([]);
const loading = ref(false);
const fetchError = ref('');
const submittingCheckin = ref(false);
const checkinSuccess = ref(false);

const form = ref({
  fullName: 'Vignesh Kumar',
  status: 'SAFE',
  shelterName: 'City Memorial Stadium Shelter'
});

async function loadFamilyMembers() {
  loading.value = true;
  fetchError.value = '';
  try {
    const res = await api.get('/citizens/family-safety');
    familyMembers.value = res.data.data || [];
  } catch (err) {
    console.error('Failed to load family members', err);
    fetchError.value = 'Unable to connect to Family Safety Network.';
  } finally {
    loading.value = false;
  }
}

async function submitCheckin() {
  submittingCheckin.value = true;
  checkinSuccess.value = false;
  try {
    await api.post('/survivors/checkin', form.value);
    checkinSuccess.value = true;
    // Update or append local status
    const existing = familyMembers.value.find(m => m.name.includes(form.value.fullName));
    if (existing) {
      existing.status = form.value.status;
      existing.location = form.value.shelterName || 'Designated Shelter';
      existing.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      familyMembers.value.unshift({
        id: `FAM-${Date.now().toString().slice(-3)}`,
        name: form.value.fullName,
        relationship: 'Self',
        status: form.value.status,
        location: form.value.shelterName || 'Reported Location',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  } catch (err) {
    console.error('Failed to submit check-in', err);
  } finally {
    submittingCheckin.value = false;
  }
}

function getStatusClass(status) {
  if (status === 'SAFE') return 'chip-safe';
  if (status === 'INJURED') return 'chip-injured';
  if (status === 'MISSING' || status === 'TRAPPED') return 'chip-missing';
  return 'chip-safe';
}

onMounted(() => {
  loadFamilyMembers();
});
</script>

<style scoped>
.family-view {
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

.family-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.25rem;
}

.list-card, .checkin-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
}

.sec-subtitle {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 400;
}

.checkin-intro {
  font-size: 0.775rem;
  color: #94a3b8;
  line-height: 1.4;
}

.family-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.fam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  transition: border-color 0.2s;
}

.fam-item:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.fam-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.fam-header-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fam-name {
  color: #f1f5f9;
  font-size: 0.85rem;
}

.fam-rel {
  font-size: 0.675rem;
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.fam-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.725rem;
  color: #94a3b8;
}

/* Status Chips */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chip-safe {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}
.chip-safe .chip-dot { background: #10b981; }

.chip-injured {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}
.chip-injured .chip-dot { background: #f59e0b; }

.chip-missing {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
}
.chip-missing .chip-dot { background: #ef4444; }

/* Check-In Form */
.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.775rem;
  color: #cbd5e1;
  font-weight: 600;
}

.form-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b82f6;
  outline: none;
}

.btn-checkin {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  font-weight: 700;
}

.checkin-success-banner {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  color: #34d399;
  font-size: 0.775rem;
}

/* States */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.state-box-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  color: #fca5a5;
  font-size: 0.8rem;
}

.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  gap: 0.4rem;
}

.empty-icon { font-size: 2.2rem; }
.empty-box strong { color: #f1f5f9; font-size: 0.875rem; }
.empty-box p { color: #94a3b8; font-size: 0.75rem; max-width: 280px; }

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-xs { font-size: 0.7rem; padding: 0.25rem 0.5rem; }
.mt-2 { margin-top: 0.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .family-grid {
    grid-template-columns: 1fr;
  }
}
</style>

