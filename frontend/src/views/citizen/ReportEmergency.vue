<template>
  <div class="report-view">
    <div class="header-card tactical-card">
      <h2>📝 FILE NEW CITIZEN EMERGENCY REPORT</h2>
      <p>Your report will be automatically analyzed by the AI Triage & Prioritization Engine.</p>
    </div>

    <div class="tactical-card form-panel">
      <form @submit.prevent="submitReport" class="report-form">
        <div class="form-row">
          <div class="form-group">
            <label>Incident Emergency Title:</label>
            <input type="text" v-model="form.title" class="form-input" placeholder="e.g. Building Wall Collapse" required />
          </div>
          <div class="form-group">
            <label>Emergency Type:</label>
            <select v-model="form.incidentType" class="form-input">
              <option value="COLLAPSE">Structural Collapse</option>
              <option value="FIRE">Fire & Smoke</option>
              <option value="HAZMAT">Toxic Chemical / Gas Leak</option>
              <option value="FLOOD">Flash Flood Inundation</option>
              <option value="MEDICAL">Medical Trauma</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Emergency Description:</label>
          <textarea v-model="form.description" class="form-textarea" rows="4" placeholder="Describe the scene, number of victims, fire, trapped people..." required></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Location / Address:</label>
            <input type="text" v-model="form.address" class="form-input" placeholder="e.g. 42 Harbour Road, Sector 4" required />
          </div>
          <div class="form-group">
            <label>Victim Count Estimate:</label>
            <input type="number" v-model.number="form.victimCount" min="1" class="form-input" required />
          </div>
        </div>

        <button type="submit" class="btn btn-danger btn-lg" :disabled="submitting">
          🚨 {{ submitting ? 'Submitting to AI Triage...' : 'Transmit Emergency Report to Command Center' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';

const router = useRouter();
const submitting = ref(false);

const form = reactive({
  title: '',
  incidentType: 'COLLAPSE',
  description: '',
  address: '',
  victimCount: 1,
  latitude: 13.0827,
  longitude: 80.2707
});

async function submitReport() {
  submitting.value = true;
  try {
    await api.post('/incidents', form);
    alert('✅ Emergency Report Submitted & Broadcasted to Command Center!');
    router.push('/admin/command');
  } catch (err) {
    alert('Failed to submit report');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.report-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 800px;
  margin: 0 auto;
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

.form-panel {
  padding: 1.5rem;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.form-input, .form-textarea {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.825rem;
}

.form-input:focus, .form-textarea:focus {
  border-color: #3b82f6;
  outline: none;
}
</style>
