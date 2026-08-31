<template>
  <div class="resource-inventory-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4>📦 Hospital Resource Inventory</h4>
        <span class="sub-text">Critical Equipment & Medical Supplies Management</span>
      </div>
      <div class="filter-controls">
        <select v-model="filterCategory" class="filter-select">
          <option value="">All Categories</option>
          <option value="OXYGEN">Oxygen Cylinders</option>
          <option value="BLOOD">Blood Units</option>
          <option value="VENTILATOR">Ventilators</option>
          <option value="PPE">PPE Kits</option>
          <option value="MEDICATION">Emergency Meds</option>
          <option value="AMBULANCE">Ambulances</option>
          <option value="TRAUMA_KIT">Trauma Kits</option>
          <option value="GENERATOR">Generators</option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredResources.length === 0" class="empty-state">
      No resources found matching the filter criteria.
    </div>

    <!-- Resources Grid -->
    <div v-else class="resources-grid">
      <div 
        v-for="res in filteredResources" 
        :key="res.id"
        class="resource-card"
      >
        <div class="card-top">
          <div class="res-info">
            <span class="res-icon">{{ getCategoryIcon(res.category) }}</span>
            <div class="name-box">
              <span class="res-name">{{ res.name }}</span>
              <span class="res-cat">{{ res.category }}</span>
            </div>
          </div>
          <span class="status-pill" :class="getStatusClass(res.status)">
            {{ res.status }}
          </span>
        </div>

        <div class="quantity-section">
          <div class="qty-numbers">
            <span class="qty-avail">{{ res.availableQty }}</span>
            <span class="qty-slash">/</span>
            <span class="qty-total">{{ res.quantity }}</span>
            <span class="qty-unit">{{ res.unit || 'units' }} available</span>
          </div>

          <div class="qty-bar-track">
            <div 
              class="qty-bar-fill"
              :class="getBarClass(res.availableQty, res.quantity)"
              :style="{ width: `${res.quantity > 0 ? (res.availableQty / res.quantity) * 100 : 0}%` }"
            ></div>
          </div>

          <div class="qty-breakdown">
            <span class="breakdown-avail">Available: {{ res.availableQty }}</span>
            <span class="breakdown-alloc">Allocated/In-Use: {{ res.allocatedQty || (res.quantity - res.availableQty) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalResourceInventory',
  props: {
    resources: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      filterCategory: ''
    };
  },
  computed: {
    filteredResources() {
      if (!this.filterCategory) return this.resources;
      return this.resources.filter(r => 
        r.category && r.category.toUpperCase().includes(this.filterCategory.toUpperCase())
      );
    }
  },
  methods: {
    getCategoryIcon(cat) {
      switch ((cat || '').toUpperCase()) {
        case 'OXYGEN': return '💨';
        case 'BLOOD': return '🩸';
        case 'VENTILATOR': return '🫁';
        case 'PPE': return '🥽';
        case 'MEDICATION': return '💊';
        case 'AMBULANCE': return '🚑';
        case 'TRAUMA_KIT': return '🩹';
        case 'GENERATOR': return '⚡';
        default: return '📦';
      }
    },
    getStatusClass(st) {
      switch (st) {
        case 'AVAILABLE': return 'status-avail';
        case 'REQUESTED': return 'status-req';
        case 'IN_TRANSIT': return 'status-transit';
        case 'DEPLOYED': return 'status-deployed';
        default: return 'status-default';
      }
    },
    getBarClass(avail, total) {
      if (!total || avail === 0) return 'bar-red';
      const pct = (avail / total) * 100;
      if (pct > 50) return 'bar-green';
      if (pct > 20) return 'bar-yellow';
      return 'bar-red';
    }
  }
};
</script>

<style scoped>
.resource-inventory-panel {
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

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.resource-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.res-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.res-icon {
  font-size: 1.4rem;
}

.name-box {
  display: flex;
  flex-direction: column;
}

.res-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.res-cat {
  font-size: 0.65rem;
  color: #a5b4fc;
  font-weight: 600;
}

.status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-avail { background: #065f46; color: #34d399; }
.status-req { background: #854d0e; color: #fde047; }
.status-transit { background: #1e3a8a; color: #60a5fa; }
.status-deployed { background: #7f1d1d; color: #f87171; }
.status-default { background: #334155; color: #94a3b8; }

.quantity-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qty-numbers {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.qty-avail {
  font-size: 1.3rem;
  font-weight: 900;
  color: #34d399;
}

.qty-slash {
  font-size: 1rem;
  color: #94a3b8;
}

.qty-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: #cbd5e1;
}

.qty-unit {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 4px;
}

.qty-bar-track {
  width: 100%;
  height: 6px;
  background: #0f172a;
  border-radius: 3px;
  overflow: hidden;
}

.qty-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width .3s ease;
}

.bar-green { background: #10b981; }
.bar-yellow { background: #eab308; }
.bar-red { background: #ef4444; }

.qty-breakdown {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94a3b8;
}

.breakdown-avail { color: #34d399; font-weight: 600; }
.breakdown-alloc { color: #f87171; font-weight: 600; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 0.85rem;
}
</style>
