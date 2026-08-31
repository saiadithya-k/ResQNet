<template>
  <div class="hospital-capacity-card">
    <div class="capacity-header">
      <h4> {{ capacity.hospitalName || 'Hospital Capacity Overview' }}</h4>
      <span class="status-badge" :class="capacity.isAccepting ? 'status-active' : 'status-inactive'">
        {{ capacity.isAccepting ? 'ACCEPTING PATIENTS' : 'STANDBY / NOT ACCEPTING' }}
      </span>
    </div>

    <!-- Bed Capacity Grid -->
    <div class="metrics-grid">
      <!-- General Beds -->
      <div class="metric-box">
        <span class="metric-title">GENERAL BEDS</span>
        <div class="metric-val">
          <span class="avail">{{ capacity.availableBeds }}</span>
          <span class="sep">/</span>
          <span class="total">{{ capacity.totalBeds }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${capacity.bedOccupancyRate || 0}%` }"></div>
        </div>
        <small class="metric-sub">{{ capacity.occupiedBeds }} Occupied ({{ capacity.bedOccupancyRate }}%)</small>
      </div>

      <!-- ICU Beds -->
      <div class="metric-box icu-box">
        <span class="metric-title text-purple">ICU CAPACITY</span>
        <div class="metric-val">
          <span class="avail text-purple">{{ capacity.availableIcu }}</span>
          <span class="sep">/</span>
          <span class="total">{{ capacity.totalIcu }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill fill-purple" :style="{ width: `${capacity.icuOccupancyRate || 0}%` }"></div>
        </div>
        <small class="metric-sub">{{ capacity.occupiedIcu }} Occupied ({{ capacity.icuOccupancyRate }}%)</small>
      </div>

      <!-- Trauma Rooms -->
      <div class="metric-box trauma-box">
        <span class="metric-title text-red">TRAUMA ROOMS</span>
        <div class="metric-val">
          <span class="avail text-red">{{ capacity.availableTrauma }}</span>
          <span class="sep">/</span>
          <span class="total">{{ capacity.totalTrauma }}</span>
        </div>
        <small class="metric-sub">{{ capacity.occupiedTrauma }} Occupied</small>
      </div>

      <!-- Life Support -->
      <div class="metric-box">
        <span class="metric-title">VENTILATORS & OR</span>
        <div class="metric-stat-row">
          <span>Ventilators: <strong>{{ capacity.ventilators }}</strong></span>
          <span>ORs: <strong>{{ capacity.operatingRooms }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalCapacity',
  props: {
    capacity: {
      type: Object,
      required: true,
      default: () => ({
        totalBeds: 50,
        availableBeds: 20,
        occupiedBeds: 30,
        bedOccupancyRate: 60,
        totalIcu: 10,
        availableIcu: 3,
        occupiedIcu: 7,
        icuOccupancyRate: 70,
        totalTrauma: 10,
        availableTrauma: 4,
        occupiedTrauma: 6,
        ventilators: 8,
        operatingRooms: 4,
        isAccepting: true
      })
    }
  }
};
</script>

<style scoped>
.hospital-capacity-card {
  background: #0f172a;
  color: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
}

.capacity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #334155;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
}

.status-active {
  background: #065f46;
  color: #34d399;
}

.status-inactive {
  background: #7f1d1d;
  color: #f87171;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.metric-box {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 6px;
}

.metric-val {
  font-size: 1.3rem;
  font-weight: 800;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.avail { color: #38bdf8; }
.sep { color: #64748b; font-size: 1rem; }
.total { color: #cbd5e1; font-size: 1rem; }

.text-purple { color: #c084fc; }
.text-red { color: #f87171; }

.progress-bar {
  background: #334155;
  height: 6px;
  border-radius: 3px;
  margin: 8px 0 4px;
  overflow: hidden;
}

.progress-fill {
  background: #38bdf8;
  height: 100%;
}

.fill-purple {
  background: #a855f7;
}

.metric-sub {
  font-size: 0.7rem;
  color: #94a3b8;
}

.metric-stat-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: #cbd5e1;
}
</style>
