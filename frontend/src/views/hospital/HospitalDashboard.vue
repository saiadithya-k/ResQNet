<template>
  <div class="hospital-view">
    <div class="header-card tactical-card">
      <div>
        <h2>HOSPITAL EMERGENCY NETWORK & CAPACITY MANAGEMENT</h2>
        <p>Live ICU, Trauma, and Bed availability synchronization with incoming patient emergency notifications.</p>
      </div>
    </div>

    <!-- Hospital Cards Grid -->
    <div class="hospital-grid">
      <div v-for="h in hospitalStore.hospitals" :key="h.id" class="tactical-card hosp-card">
        <div class="hosp-top">
          <div>
            <h3>{{ h.name }}</h3>
            <span class="text-muted">{{ h.district }}</span>
          </div>
          <span class="match-badge">AI MATCH: {{ h.matchScore }}%</span>
        </div>

        <div class="capacity-stats">
          <div class="cap-pill">
            <span class="label">TOTAL BEDS</span>
            <span class="val">{{ h.availableBeds }} / {{ h.totalBeds }}</span>
          </div>
          <div class="cap-pill bg-purple">
            <span class="label">ICU AVAILABLE</span>
            <span class="val text-purple">{{ h.availableIcu }} / {{ h.totalIcu }}</span>
          </div>
          <div class="cap-pill bg-red">
            <span class="label">TRAUMA ROOMS</span>
            <span class="val text-red">{{ h.availableTrauma }} / {{ h.totalTrauma }}</span>
          </div>
          <div class="cap-pill">
            <span class="label">VENTILATORS</span>
            <span class="val">{{ h.ventilators }}</span>
          </div>
        </div>

        <div class="specialties">
          <strong>Specializations:</strong>
          <div class="spec-tags">
            <span v-for="(sp, idx) in h.specializations" :key="idx" class="spec-tag">{{ sp }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useHospitalStore } from '../../stores/hospitalStore';

const hospitalStore = useHospitalStore();

onMounted(() => {
  hospitalStore.fetchHospitals();
});
</script>

<style scoped>
.hospital-view {
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

.hospital-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.hosp-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hosp-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hosp-top h3 {
  font-size: 0.95rem;
  color: #f1f5f9;
}

.match-badge {
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.7rem;
  color: #60a5fa;
}

.capacity-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.cap-pill {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.cap-pill .label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.cap-pill .val {
  font-size: 1rem;
  font-weight: 700;
  color: #f8fafc;
}

.bg-purple { border-color: rgba(168, 85, 247, 0.4); }
.bg-red { border-color: rgba(239, 68, 68, 0.4); }
.text-purple { color: #c084fc; }
.text-red { color: #f87171; }

.specialties {
  font-size: 0.75rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.spec-tag {
  background: rgba(30, 41, 59, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  color: #94a3b8;
}

.text-muted {
  font-size: 0.7rem;
  color: #94a3b8;
}
</style>
