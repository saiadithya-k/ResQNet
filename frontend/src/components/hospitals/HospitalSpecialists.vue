<template>
  <div class="specialists-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4>👨‍⚕️ Medical Specialists & On-Call Roster</h4>
        <span class="sub-text">Hospital Specialist Personnel</span>
      </div>
      <div class="specialty-filter">
        <select v-model="selectedSpecialty" @change="$emit('filter-specialty', selectedSpecialty)" class="filter-select">
          <option value="">All Specialties</option>
          <option value="Trauma">Trauma Surgery</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Neurology">Neurosurgery</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Emergency Medicine">Emergency Medicine</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="General Surgery">General Surgery</option>
        </select>
      </div>
    </div>

    <!-- Specialists List -->
    <div v-if="specialists.length === 0" class="empty-state">
      No active specialists on roster for this filter criteria.
    </div>

    <div v-else class="specialists-grid">
      <div 
        v-for="spec in filteredSpecialists" 
        :key="spec.id" 
        class="specialist-card"
      >
        <div class="spec-top">
          <span class="spec-name">{{ spec.name }}</span>
          <span class="status-pill" :class="getStatusClass(spec.status)">
            {{ spec.status }}
          </span>
        </div>
        <div class="spec-specialty">
          <span class="specialty-badge">{{ spec.specialty }}</span>
          <small v-if="spec.subSpecialty" class="sub-specialty">({{ spec.subSpecialty }})</small>
        </div>
        <div v-if="spec.phone || spec.email" class="spec-contact">
          <span v-if="spec.phone">📞 {{ spec.phone }}</span>
          <span v-if="spec.email">✉️ {{ spec.email }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalSpecialists',
  props: {
    specialists: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedSpecialty: ''
    };
  },
  computed: {
    filteredSpecialists() {
      if (!this.selectedSpecialty) {
        return this.specialists;
      }
      return this.specialists.filter(s => 
        s.specialty && s.specialty.toLowerCase().includes(this.selectedSpecialty.toLowerCase())
      );
    }
  },
  methods: {
    getStatusClass(status) {
      switch (status) {
        case 'AVAILABLE': return 'status-avail';
        case 'BUSY': return 'status-busy';
        case 'UNAVAILABLE': return 'status-unavail';
        default: return 'status-offduty';
      }
    }
  },
  emits: ['filter-specialty']
};
</script>

<style scoped>
.specialists-panel {
  background: #0f172a;
  color: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #334155;
}

.sub-text {
  font-size: 0.75rem;
  color: #94a3b8;
}

.filter-select {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #475569;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.specialists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.specialist-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-avail { background: #065f46; color: #34d399; }
.status-busy { background: #854d0e; color: #fde047; }
.status-unavail { background: #7f1d1d; color: #f87171; }
.status-offduty { background: #334155; color: #94a3b8; }

.specialty-badge {
  font-size: 0.75rem;
  background: #312e81;
  color: #a5b4fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.sub-specialty {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-left: 6px;
}

.spec-contact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;
  color: #cbd5e1;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 0.85rem;
}
</style>
