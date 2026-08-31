<template>
  <div class="patient-intake-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4> Incoming Patient Intake & Triage Queue</h4>
        <span class="sub-text">Operational Arrival & Check-In Management</span>
      </div>
      <div class="status-filter">
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Statuses</option>
          <option value="EXPECTED">Expected</option>
          <option value="ARRIVED">Arrived</option>
          <option value="CHECKED_IN">Checked-In</option>
          <option value="ADMITTED">Admitted</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPatients.length === 0" class="empty-state">
      No incoming patients registered in the intake queue for this filter.
    </div>

    <!-- Patient Queue Table -->
    <div v-else class="patients-list">
      <div 
        v-for="patient in filteredPatients" 
        :key="patient.id"
        class="patient-card"
        :class="`sev-border-${(patient.triageSeverity || 'MEDIUM').toLowerCase()}`"
      >
        <div class="card-header-row">
          <div class="patient-identity">
            <span class="patient-name">{{ patient.name || 'Anonymous Patient' }}</span>
            <span v-if="patient.age" class="patient-meta">Age: {{ patient.age }} • {{ patient.gender || 'UNKNOWN' }}</span>
          </div>
          <div class="status-badges">
            <span class="sev-pill" :class="`sev-${(patient.triageSeverity || 'MEDIUM').toLowerCase()}`">
              {{ patient.triageSeverity }}
            </span>
            <span class="status-pill" :class="`status-${(patient.status || 'EXPECTED').toLowerCase()}`">
              {{ patient.status }}
            </span>
          </div>
        </div>

        <div v-if="patient.conditionSummary" class="condition-box">
          <span class="cond-label">Summary:</span>
          <span class="cond-text">{{ patient.conditionSummary }}</span>
        </div>

        <div class="timing-grid">
          <div class="timing-item">
            <span class="time-label">ETA / Expected:</span>
            <span class="time-val">{{ formatTime(patient.expectedArrival) || (patient.etaMinutes ? `${patient.etaMinutes} mins` : 'N/A') }}</span>
          </div>
          <div v-if="patient.arrivedAt" class="timing-item">
            <span class="time-label">Arrived At:</span>
            <span class="time-val">{{ formatTime(patient.arrivedAt) }}</span>
          </div>
          <div v-if="patient.admittedAt" class="timing-item">
            <span class="time-label">Admitted At:</span>
            <span class="time-val">{{ formatTime(patient.admittedAt) }}</span>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="actions-row">
          <button 
            v-if="patient.status === 'EXPECTED'" 
            @click="$emit('update-status', { id: patient.id, status: 'ARRIVED' })"
            class="btn-action btn-arrived"
          >
            Mark Arrived
          </button>
          <button 
            v-if="patient.status === 'ARRIVED'" 
            @click="$emit('update-status', { id: patient.id, status: 'CHECKED_IN' })"
            class="btn-action btn-checkin"
          >
            Check In
          </button>
          <button 
            v-if="patient.status === 'CHECKED_IN'" 
            @click="$emit('update-status', { id: patient.id, status: 'ADMITTED' })"
            class="btn-action btn-admit"
          >
            Admit Patient
          </button>
          <button 
            v-if="['EXPECTED', 'ARRIVED', 'CHECKED_IN'].includes(patient.status)" 
            @click="$emit('update-status', { id: patient.id, status: 'CANCELLED' })"
            class="btn-action btn-cancel"
          >
            Cancel Intake
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalPatientIntake',
  props: {
    patients: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      filterStatus: ''
    };
  },
  computed: {
    filteredPatients() {
      if (!this.filterStatus) return this.patients;
      return this.patients.filter(p => p.status === this.filterStatus);
    }
  },
  methods: {
    formatTime(dateStr) {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  },
  emits: ['update-status']
};
</script>

<style scoped>
.patient-intake-panel {
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

.patients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
}

.sev-border-critical { border-left: 4px solid #ef4444; }
.sev-border-high { border-left: 4px solid #f97316; }
.sev-border-medium { border-left: 4px solid #eab308; }
.sev-border-low { border-left: 4px solid #10b981; }

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.patient-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.patient-meta {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
}

.status-badges {
  display: flex;
  gap: 6px;
}

.sev-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.sev-critical { background: #7f1d1d; color: #f87171; }
.sev-high { background: #9a3412; color: #fb923c; }
.sev-medium { background: #854d0e; color: #fde047; }
.sev-low { background: #065f46; color: #34d399; }

.status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-expected { background: #1e3a8a; color: #60a5fa; }
.status-arrived { background: #854d0e; color: #fde047; }
.status-checked_in { background: #581c87; color: #c084fc; }
.status-admitted { background: #065f46; color: #34d399; }
.status-cancelled { background: #334155; color: #94a3b8; }

.condition-box {
  background: #0f172a;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.cond-label { color: #94a3b8; margin-right: 4px; font-weight: 600; }
.cond-text { color: #f8fafc; }

.timing-grid {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  margin-bottom: 10px;
}

.time-label { color: #94a3b8; margin-right: 4px; }
.time-val { font-weight: 600; color: #e2e8f0; }

.actions-row {
  display: flex;
  gap: 8px;
  border-top: 1px solid #334155;
  padding-top: 8px;
}

.btn-action {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: .2s;
}

.btn-arrived { background: #eab308; color: #0f172a; }
.btn-checkin { background: #a855f7; color: #ffffff; }
.btn-admit { background: #10b981; color: #ffffff; }
.btn-cancel { background: #475569; color: #ffffff; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 0.85rem;
}
</style>
