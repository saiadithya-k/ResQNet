<template>
  <div class="transfer-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4>🚚 Active Resource & Logistical Transfers</h4>
        <span class="sub-text">Live In-Transit Movement & Destination Receipts</span>
      </div>
      <div class="filter-controls">
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved (Ready)</option>
          <option value="IN_TRANSIT">In Transit 🚚</option>
          <option value="DELIVERED">Delivered 🏁</option>
          <option value="RECEIVED">Received & Stocked ✅</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredTransfers.length === 0" class="empty-state">
      No resource transfers matching the selected criteria.
    </div>

    <!-- Transfer Cards Grid -->
    <div v-else class="transfers-grid">
      <div 
        v-for="t in filteredTransfers" 
        :key="t.id"
        class="transfer-card"
        :class="`border-${t.status.toLowerCase()}`"
      >
        <div class="card-top">
          <div class="res-info">
            <span class="res-name">{{ t.resource?.name || 'Emergency Units' }}</span>
            <span class="res-qty">Qty: <strong>{{ t.quantity }}</strong></span>
          </div>
          <span class="status-pill" :class="`pill-${t.status.toLowerCase()}`">
            {{ t.status }}
          </span>
        </div>

        <div class="route-box">
          <div class="route-point">
            <span class="point-label">From:</span>
            <span class="point-name">{{ t.fromHospital?.hospitalName || t.fromDistrict || 'Source Hub' }}</span>
          </div>
          <div class="route-arrow">➔</div>
          <div class="route-point">
            <span class="point-label">To:</span>
            <span class="point-name">{{ t.toHospital?.hospitalName || t.toDistrict || 'Destination Hub' }}</span>
          </div>
        </div>

        <!-- Progress Timeline -->
        <div class="timeline-bar">
          <div class="step" :class="{ completed: isStepCompleted(t.status, 'APPROVED') }">
            <span class="step-dot"></span>
            <span class="step-label">Approved</span>
          </div>
          <div class="step-line" :class="{ completed: isStepCompleted(t.status, 'IN_TRANSIT') }"></div>
          <div class="step" :class="{ completed: isStepCompleted(t.status, 'IN_TRANSIT') }">
            <span class="step-dot"></span>
            <span class="step-label">In Transit</span>
          </div>
          <div class="step-line" :class="{ completed: isStepCompleted(t.status, 'DELIVERED') }"></div>
          <div class="step" :class="{ completed: isStepCompleted(t.status, 'DELIVERED') }">
            <span class="step-dot"></span>
            <span class="step-label">Delivered</span>
          </div>
          <div class="step-line" :class="{ completed: isStepCompleted(t.status, 'RECEIVED') }"></div>
          <div class="step" :class="{ completed: isStepCompleted(t.status, 'RECEIVED') }">
            <span class="step-dot"></span>
            <span class="step-label">Received</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <!-- Dispatch / Start by Source -->
          <button 
            v-if="t.status === 'APPROVED'" 
            class="btn-action btn-dispatch"
            @click="$emit('start-transfer', t.id)"
          >
            🚚 Dispatch Into Transit
          </button>

          <!-- Deliver by Courier / Source -->
          <button 
            v-if="t.status === 'IN_TRANSIT'" 
            class="btn-action btn-deliver"
            @click="$emit('deliver-transfer', t.id)"
          >
            🏁 Mark Delivered
          </button>

          <!-- Receive & Stock by Destination -->
          <button 
            v-if="t.status === 'DELIVERED' || t.status === 'IN_TRANSIT'" 
            class="btn-action btn-receive"
            @click="$emit('receive-transfer', t.id)"
          >
            📦 Confirm Receipt & Stock Inventory
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalTransferPanel',
  props: {
    transfers: {
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
    filteredTransfers() {
      if (!this.filterStatus) return this.transfers;
      return this.transfers.filter(t => t.status === this.filterStatus);
    }
  },
  methods: {
    isStepCompleted(currentStatus, step) {
      const order = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED'];
      return order.indexOf(currentStatus) >= order.indexOf(step);
    }
  }
};
</script>

<style scoped>
.transfer-panel {
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

.transfers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.transfer-card {
  background: #1e293b;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #334155;
  border-left: 4px solid #475569;
}

.border-approved { border-left-color: #3b82f6; }
.border-in_transit { border-left-color: #eab308; }
.border-delivered { border-left-color: #06b6d4; }
.border-received { border-left-color: #10b981; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.res-name {
  font-weight: 700;
  font-size: 0.95rem;
  display: block;
}

.res-qty {
  font-size: 0.8rem;
  color: #94a3b8;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.pill-approved { background: #1e3a8a; color: #93c5fd; }
.pill-in_transit { background: #854d0e; color: #fde047; }
.pill-delivered { background: #155e75; color: #67e8f9; }
.pill-received { background: #065f46; color: #34d399; }

.route-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.route-point {
  display: flex;
  flex-direction: column;
}

.point-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.point-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f8fafc;
}

.route-arrow {
  color: #38bdf8;
  font-size: 1rem;
}

.timeline-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0 10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #475569;
}

.step-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.step.completed .step-dot { background: #10b981; }
.step.completed .step-label { color: #34d399; font-weight: 600; }

.step-line {
  flex: 1;
  height: 2px;
  background: #475569;
  margin: 0 4px 12px;
}

.step-line.completed { background: #10b981; }

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.btn-action {
  flex: 1;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-dispatch { background: #eab308; color: #000; }
.btn-deliver { background: #06b6d4; color: #000; }
.btn-receive { background: #10b981; color: #fff; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}
</style>
