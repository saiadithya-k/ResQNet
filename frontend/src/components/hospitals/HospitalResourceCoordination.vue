<template>
  <div class="coordination-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4> Cross-Agency Resource Coordination</h4>
        <span class="sub-text">Inter-Hospital Emergency Resource Sharing & Requests</span>
      </div>
      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'discover' }" 
          @click="activeTab = 'discover'"
        >
           External Inventory
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'requests' }" 
          @click="activeTab = 'requests'"
        >
           Coordination Queue ({{ coordinationRequests.length }})
        </button>
      </div>
    </div>

    <!-- TAB 1: EXTERNAL INVENTORY DISCOVERY -->
    <div v-if="activeTab === 'discover'" class="tab-content">
      <div class="discovery-grid">
        <div 
          v-for="res in availableResources" 
          :key="res.id" 
          class="inventory-card"
        >
          <div class="card-header">
            <div class="res-title">
              <span class="res-name">{{ res.name }}</span>
              <span class="res-badge">{{ res.category }}</span>
            </div>
            <span class="hospital-badge">
               {{ res.hospital?.hospitalName || 'External Facility' }}
            </span>
          </div>

          <div class="card-body">
            <div class="avail-row">
              <span class="avail-label">Available Surplus:</span>
              <span class="avail-val">{{ res.availableQty }} {{ res.unit || 'units' }}</span>
            </div>
            <div class="district-row">
              <span> {{ res.district || res.hospital?.district || 'Central Zone' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button 
              class="btn-request" 
              :disabled="res.isOwned"
              @click="$emit('request-resource', res)"
            >
              {{ res.isOwned ? 'Own Inventory' : 'Request Resource' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: COORDINATION REQUESTS QUEUE -->
    <div v-if="activeTab === 'requests'" class="tab-content">
      <div v-if="coordinationRequests.length === 0" class="empty-state">
        No active coordination requests.
      </div>
      <div v-else class="requests-list">
        <div 
          v-for="req in coordinationRequests" 
          :key="req.id" 
          class="request-card"
          :class="`border-${req.status.toLowerCase()}`"
        >
          <div class="req-top">
            <div class="req-title">
              <span class="req-resource">{{ req.resource?.name || 'Emergency Resource' }}</span>
              <span class="req-qty">Quantity: {{ req.quantity }}</span>
            </div>
            <span class="status-pill" :class="`pill-${req.status.toLowerCase()}`">
              {{ req.status }}
            </span>
          </div>

          <div class="req-details">
            <div class="agency-route">
              <span> From: <strong>{{ req.fromHospital?.hospitalName || 'Source Hospital' }}</strong></span>
              <span class="route-arrow">→</span>
              <span> To: <strong>{{ req.toHospital?.hospitalName || 'Destination Hospital' }}</strong></span>
            </div>
            <div v-if="req.notes" class="req-notes">
              <em>"{{ req.notes }}"</em>
            </div>
          </div>

          <!-- Actions for Source Hospital -->
          <div v-if="req.status === 'REQUESTED' && isSourceHospital(req)" class="req-actions">
            <button class="btn-approve" @click="$emit('approve-request', req.id)">
              ✓ Approve Coordination
            </button>
            <button class="btn-reject" @click="$emit('reject-request', req.id)">
              ✕ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalResourceCoordination',
  props: {
    currentHospitalId: {
      type: String,
      default: ''
    },
    availableResources: {
      type: Array,
      default: () => []
    },
    coordinationRequests: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeTab: 'discover'
    };
  },
  methods: {
    isSourceHospital(req) {
      if (!this.currentHospitalId) return true;
      return req.fromHospitalId === this.currentHospitalId;
    }
  }
};
</script>

<style scoped>
.coordination-panel {
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

.tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #475569;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.tab-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.discovery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.inventory-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 14px;
}

.card-header {
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

.res-badge {
  font-size: 0.65rem;
  background: #334155;
  color: #93c5fd;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.hospital-badge {
  font-size: 0.75rem;
  color: #cbd5e1;
}

.avail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.avail-val {
  color: #34d399;
  font-weight: 700;
}

.district-row {
  font-size: 0.75rem;
  color: #94a3b8;
}

.card-footer {
  margin-top: 12px;
}

.btn-request {
  width: 100%;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.btn-request:disabled {
  background: #475569;
  cursor: not-allowed;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.request-card {
  background: #1e293b;
  border-radius: 8px;
  padding: 12px 16px;
  border-left: 4px solid #475569;
}

.border-requested { border-left-color: #eab308; }
.border-approved { border-left-color: #10b981; }
.border-rejected { border-left-color: #ef4444; }
.border-cancelled { border-left-color: #64748b; }

.req-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.req-resource {
  font-weight: 700;
  font-size: 0.95rem;
}

.req-qty {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-left: 10px;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.pill-requested { background: #854d0e; color: #fde047; }
.pill-approved { background: #065f46; color: #34d399; }
.pill-rejected { background: #7f1d1d; color: #f87171; }
.pill-cancelled { background: #334155; color: #94a3b8; }

.agency-route {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.req-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.btn-approve {
  background: #059669;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.btn-reject {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}
</style>
