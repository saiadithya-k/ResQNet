<template>
  <div class="survivor-checkin-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen/family" class="back-link">← Back to Family Safety</router-link>
        <h2>🛡️ SURVIVOR SAFETY CHECK-IN</h2>
        <p>Rapid emergency status broadcasting for disaster response coordination and family notification.</p>
      </div>

      <div class="header-status">
        <span class="live-dot"></span>
        <span class="status-txt">DISASTER CHANNELS OPEN</span>
      </div>
    </div>

    <!-- Step 5: Success State -->
    <div v-if="submissionSuccess" class="tactical-card success-panel">
      <div class="success-icon">✅</div>
      <h3>CHECK-IN RECORDED & BROADCASTED</h3>
      <p class="success-desc">
        Your safety status update has been successfully transmitted to the Disaster Command Center and synchronized with your Family Safety Network.
      </p>

      <div class="checkin-summary-card">
        <div class="summary-row">
          <span class="lbl">PERSON:</span>
          <strong class="val">{{ confirmedData.targetName }} ({{ confirmedData.targetType }})</strong>
        </div>
        <div class="summary-row">
          <span class="lbl">REPORTED STATUS:</span>
          <span :class="['status-chip', getStatusChipClass(confirmedData.status)]">
            <span class="chip-dot"></span>
            <span>{{ confirmedData.status }}</span>
          </span>
        </div>
        <div class="summary-row">
          <span class="lbl">LOCATION / SHELTER:</span>
          <span class="val">{{ confirmedData.location || 'Location Pending' }}</span>
        </div>
        <div class="summary-row">
          <span class="lbl">BROADCAST TIME:</span>
          <span class="val font-mono">{{ confirmedData.time }}</span>
        </div>
      </div>

      <div class="success-actions">
        <router-link to="/citizen/family" class="btn btn-primary">
          View Family Safety Network
        </router-link>
        <button class="btn btn-ghost" @click="resetFlow">
          Check In Another Person
        </button>
      </div>
    </div>

    <!-- Main Step-by-Step Check-In Wizard -->
    <div v-else class="tactical-card wizard-panel">
      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner">
        <div class="err-content">
          <span class="err-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
        <button class="btn btn-xs btn-ghost" @click="errorMessage = ''">Dismiss</button>
      </div>

      <!-- STEP 1: ARE YOU SAFE? (Primary Action Screen) -->
      <div v-if="currentStep === 1" class="step-container">
        <div class="step-prompt">
          <span class="step-num">STEP 1 OF 3</span>
          <h3>ARE YOU SAFE?</h3>
          <p>Select your immediate physical and safety condition.</p>
        </div>

        <div class="status-action-grid">
          <!-- SAFE Button -->
          <button
            type="button"
            :class="['status-big-btn safe', { selected: selectedStatus === 'SAFE' }]"
            @click="selectStatus('SAFE')"
          >
            <span class="status-btn-icon">🟢</span>
            <div class="status-btn-text">
              <strong>I'M SAFE</strong>
              <span>Uninjured · In Safe Location / Shelter</span>
            </div>
            <span class="select-indicator">→</span>
          </button>

          <!-- INJURED Button -->
          <button
            type="button"
            :class="['status-big-btn injured', { selected: selectedStatus === 'INJURED' }]"
            @click="selectStatus('INJURED')"
          >
            <span class="status-btn-icon">🟡</span>
            <div class="status-btn-text">
              <strong>I'M INJURED</strong>
              <span>Require Medical Attention / First Aid</span>
            </div>
            <span class="select-indicator">→</span>
          </button>

          <!-- MISSING / STRANDED Button -->
          <button
            type="button"
            :class="['status-big-btn missing', { selected: selectedStatus === 'MISSING' }]"
            @click="selectStatus('MISSING')"
          >
            <span class="status-btn-icon">🔴</span>
            <div class="status-btn-text">
              <strong>I'M MISSING / TRAPPED</strong>
              <span>Need Immediate Search & Rescue</span>
            </div>
            <span class="select-indicator">→</span>
          </button>
        </div>
      </div>

      <!-- STEP 2: WHO ARE YOU CHECKING IN & LOCATION -->
      <div v-else-if="currentStep === 2" class="step-container">
        <div class="step-prompt">
          <span class="step-num">STEP 2 OF 3</span>
          <h3>WHO ARE YOU CHECKING IN?</h3>
          <p>Confirm the person and your current emergency shelter/landmark.</p>
        </div>

        <!-- Target Person Selector -->
        <div class="target-toggle-pills">
          <button
            type="button"
            :class="['target-pill', { active: targetType === 'MYSELF' }]"
            @click="targetType = 'MYSELF'"
          >
            👤 MYSELF ({{ authStore.user?.name || 'Vignesh Kumar' }})
          </button>

          <button
            type="button"
            :class="['target-pill', { active: targetType === 'FAMILY' }]"
            @click="targetType = 'FAMILY'"
          >
            👨‍👩‍👧 A FAMILY MEMBER
          </button>
        </div>

        <!-- If Family Member Selected: Authorized Family Members List -->
        <div v-if="targetType === 'FAMILY'" class="family-select-box">
          <label class="field-label">Select Authorized Family Member:</label>
          <div v-if="loadingFamily" class="loading-box-sm">
            <span class="spinner-sm"></span>
            <span>Loading authorized family members...</span>
          </div>
          <div v-else-if="familyList.length === 0" class="no-fam-box">
            <span>No registered family members found. You can link family in the Family Safety screen.</span>
          </div>
          <div v-else class="family-radio-list">
            <label
              v-for="fam in familyList"
              :key="fam.id"
              :class="['fam-radio-item', { active: selectedFamilyMemberId === fam.id }]"
            >
              <input
                type="radio"
                :value="fam.id"
                v-model="selectedFamilyMemberId"
              />
              <div class="fam-radio-info">
                <strong>{{ fam.name }}</strong>
                <span>{{ fam.relationship }} · Current: {{ fam.status }}</span>
              </div>
              <span class="fam-check-mark">✓</span>
            </label>
          </div>
        </div>

        <!-- Location / Shelter Landmark Input -->
        <div class="location-input-group">
          <div class="label-with-gps">
            <label for="shelterInput" class="field-label">Current Location / Designated Shelter:</label>
            <button
              type="button"
              class="btn-gps-detect"
              @click="detectGPSLocation"
              :disabled="detectingGPS"
            >
              <span>📍</span>
              <span>{{ detectingGPS ? 'Detecting GPS...' : gpsLocked ? '✓ GPS Locked' : 'Auto-Detect Location' }}</span>
            </button>
          </div>
          <input
            id="shelterInput"
            type="text"
            v-model="shelterLocation"
            class="form-input"
            placeholder="e.g. City Memorial Stadium Shelter or 42 Harbour Road"
          />
          <span v-if="gpsCoordinates" class="gps-tag font-mono">{{ gpsCoordinates }}</span>
        </div>

        <!-- Step 2 Actions -->
        <div class="step-nav-actions">
          <button type="button" class="btn btn-ghost" @click="currentStep = 1">
            ← Change Status
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="proceedToConfirmation"
            :disabled="targetType === 'FAMILY' && !selectedFamilyMemberId"
          >
            Review & Broadcast →
          </button>
        </div>
      </div>

      <!-- STEP 3: CONCISE CONFIRMATION -->
      <div v-else-if="currentStep === 3" class="step-container">
        <div class="step-prompt">
          <span class="step-num">STEP 3 OF 3: CONFIRMATION</span>
          <h3>CONFIRM SURVIVOR CHECK-IN</h3>
          <p>Please verify before broadcasting to emergency dispatch and family network.</p>
        </div>

        <div class="confirmation-card">
          <div class="conf-row">
            <span class="conf-lbl">PERSON:</span>
            <strong class="conf-val">{{ getSelectedPersonName() }}</strong>
          </div>

          <div class="conf-row">
            <span class="conf-lbl">SAFETY STATUS:</span>
            <span :class="['status-chip', getStatusChipClass(selectedStatus)]">
              <span class="chip-dot"></span>
              <span>{{ selectedStatus }}</span>
            </span>
          </div>

          <div class="conf-row">
            <span class="conf-lbl">LOCATION / SHELTER:</span>
            <span class="conf-val">{{ shelterLocation || 'Location unavailable' }}</span>
          </div>

          <div class="conf-row">
            <span class="conf-lbl">SYNC NETWORK:</span>
            <span class="conf-val text-emerald font-bold">✓ Family Safety Network & Command Center</span>
          </div>
        </div>

        <!-- Final Submit Buttons -->
        <div class="final-actions">
          <button
            type="button"
            class="btn btn-broadcast-submit"
            @click="submitCheckIn"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-sm"></span>
            <span>{{ submitting ? 'Transmitting Safety Status...' : '✓ CONFIRM & BROADCAST CHECK-IN' }}</span>
          </button>

          <button
            type="button"
            class="btn btn-ghost"
            @click="currentStep = 2"
            :disabled="submitting"
          >
            ✏️ Change Details
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const authStore = useAuthStore();

const currentStep = ref(1);
const selectedStatus = ref('SAFE');
const targetType = ref('MYSELF');
const selectedFamilyMemberId = ref('');
const shelterLocation = ref('City Memorial Stadium Shelter');
const gpsCoordinates = ref('');
const gpsLocked = ref(false);
const detectingGPS = ref(false);

const familyList = ref([]);
const loadingFamily = ref(false);
const submitting = ref(false);
const errorMessage = ref('');
const submissionSuccess = ref(false);

const confirmedData = ref({
  targetName: '',
  targetType: '',
  status: '',
  location: '',
  time: ''
});

async function loadFamilyMembers() {
  loadingFamily.value = true;
  try {
    const res = await api.get('/citizens/family-safety');
    familyList.value = res.data.data || [];
    if (familyList.value.length > 0) {
      selectedFamilyMemberId.value = familyList.value[0].id;
    }
  } catch (err) {
    console.error('Failed to load family members for check-in', err);
  } finally {
    loadingFamily.value = false;
  }
}

function selectStatus(status) {
  selectedStatus.value = status;
  currentStep.value = 2;
}

function detectGPSLocation() {
  if (!navigator.geolocation) {
    gpsCoordinates.value = 'GPS location unavailable';
    return;
  }

  detectingGPS.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      detectingGPS.value = false;
      gpsLocked.value = true;
      gpsCoordinates.value = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      if (!shelterLocation.value) {
        shelterLocation.value = `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
      }
    },
    (err) => {
      detectingGPS.value = false;
      gpsLocked.value = false;
      gpsCoordinates.value = 'GPS position unavailable';
    },
    { timeout: 6000 }
  );
}

function getSelectedPersonName() {
  if (targetType.value === 'MYSELF') {
    return `${authStore.user?.name || 'Vignesh Kumar'} (Myself)`;
  }
  const member = familyList.value.find(f => f.id === selectedFamilyMemberId.value);
  return member ? `${member.name} (${member.relationship})` : 'Selected Family Member';
}

function proceedToConfirmation() {
  errorMessage.value = '';
  currentStep.value = 3;
}

async function submitCheckIn() {
  submitting.value = true;
  errorMessage.value = '';

  const personName = targetType.value === 'MYSELF'
    ? (authStore.user?.name || 'Vignesh Kumar')
    : (familyList.value.find(f => f.id === selectedFamilyMemberId.value)?.name || 'Family Member');

  const payload = {
    fullName: personName,
    status: selectedStatus.value,
    shelterName: shelterLocation.value || 'Reported Zone',
    familyMemberId: targetType.value === 'FAMILY' ? selectedFamilyMemberId.value : null
  };

  try {
    const res = await api.post('/survivors/checkin', payload);
    const data = res.data.data;

    confirmedData.value = {
      targetName: personName,
      targetType: targetType.value === 'MYSELF' ? 'Self' : 'Family Member',
      status: selectedStatus.value,
      location: shelterLocation.value,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    submissionSuccess.value = true;
  } catch (err) {
    console.error('Failed to submit survivor check-in', err);
    errorMessage.value = 'Failed to broadcast safety check-in. Your selection is preserved. Please retry.';
  } finally {
    submitting.value = false;
  }
}

function resetFlow() {
  currentStep.value = 1;
  selectedStatus.value = 'SAFE';
  targetType.value = 'MYSELF';
  submissionSuccess.value = false;
  errorMessage.value = '';
}

function getStatusChipClass(status) {
  if (status === 'SAFE') return 'chip-safe';
  if (status === 'INJURED') return 'chip-injured';
  if (status === 'MISSING') return 'chip-missing';
  return 'chip-safe';
}

onMounted(() => {
  loadFamilyMembers();
});
</script>

<style scoped>
.survivor-checkin-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 760px;
  margin: 0 auto;
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

.header-status {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.status-txt {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #34d399;
}

.wizard-panel {
  padding: 1.75rem;
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step-prompt {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.75rem;
}

.step-num {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
}

.step-prompt h3 {
  font-size: 1.2rem;
  color: #f8fafc;
}

.step-prompt p {
  font-size: 0.8rem;
  color: #94a3b8;
}

/* Big Action Buttons (Step 1) */
.status-action-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.status-big-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid #334155;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.status-btn-icon {
  font-size: 2rem;
  line-height: 1;
}

.status-btn-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex-grow: 1;
}

.status-btn-text strong {
  font-size: 1.05rem;
  color: #f8fafc;
}

.status-btn-text span {
  font-size: 0.75rem;
  color: #94a3b8;
}

.select-indicator {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 700;
  transition: transform 0.15s, color 0.15s;
}

.status-big-btn.safe:hover, .status-big-btn.safe.selected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}
.status-big-btn.safe:hover .select-indicator { color: #10b981; transform: translateX(3px); }

.status-big-btn.injured:hover, .status-big-btn.injured.selected {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}
.status-big-btn.injured:hover .select-indicator { color: #f59e0b; transform: translateX(3px); }

.status-big-btn.missing:hover, .status-big-btn.missing.selected {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
.status-big-btn.missing:hover .select-indicator { color: #ef4444; transform: translateX(3px); }

/* Step 2: Target Selection */
.target-toggle-pills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.target-pill {
  padding: 0.85rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.target-pill.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.family-select-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(9, 14, 26, 0.7);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}

.field-label {
  font-size: 0.775rem;
  color: #cbd5e1;
  font-weight: 600;
}

.family-radio-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.fam-radio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.fam-radio-item input { display: none; }

.fam-radio-item.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
}

.fam-radio-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.fam-radio-info strong { font-size: 0.825rem; color: #f8fafc; }
.fam-radio-info span { font-size: 0.7rem; color: #94a3b8; }

.fam-check-mark {
  color: transparent;
  font-weight: 800;
}
.fam-radio-item.active .fam-check-mark {
  color: #38bdf8;
}

.location-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label-with-gps {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-gps-detect {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.form-input {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  font-size: 0.825rem;
}

.gps-tag {
  font-size: 0.675rem;
  color: #38bdf8;
}

.step-nav-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

/* Step 3: Confirmation */
.confirmation-card {
  background: rgba(9, 14, 26, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.conf-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.conf-lbl {
  color: #94a3b8;
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.conf-val {
  color: #f1f5f9;
}

.final-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-broadcast-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981, #047857);
  border: 2px solid #34d399;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 800;
  font-family: var(--font-display);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  transition: all 0.2s;
}

.btn-broadcast-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
}

.btn-broadcast-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success Panel */
.success-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  gap: 1rem;
}

.success-icon { font-size: 3rem; }
.success-panel h3 { font-size: 1.25rem; color: #f8fafc; }
.success-desc { font-size: 0.825rem; color: #94a3b8; max-width: 460px; }

.checkin-summary-card {
  width: 100%;
  max-width: 460px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
}

.summary-row .lbl { color: #94a3b8; font-family: var(--font-mono); font-size: 0.675rem; }
.summary-row .val { color: #f1f5f9; }

.success-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
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
.chip-dot { width: 6px; height: 6px; border-radius: 50%; }

.chip-safe { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; }
.chip-safe .chip-dot { background: #10b981; }

.chip-injured { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; }
.chip-injured .chip-dot { background: #f59e0b; }

.chip-missing { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; }
.chip-missing .chip-dot { background: #ef4444; }

/* Error Banner */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  color: #fca5a5;
  font-size: 0.775rem;
  margin-bottom: 1rem;
}

.err-content { display: flex; align-items: center; gap: 0.4rem; }

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-box-sm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 0.5rem 0;
}

.no-fam-box { font-size: 0.75rem; color: #94a3b8; font-style: italic; }

.font-mono { font-family: var(--font-mono); }
.text-emerald { color: #34d399; }
.font-bold { font-weight: 700; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .target-toggle-pills {
    grid-template-columns: 1fr;
  }
}
</style>
