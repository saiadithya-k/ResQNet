<template>
  <div class="reconciliation-panel">
    <div class="panel-header">
      <div class="header-left">
        <h4>️ Resource Transfer Reconciliation & Audit</h4>
        <span class="sub-text">Expected vs Actual Inventory Verification & Discrepancy Settlement</span>
      </div>
      <div class="filter-controls">
        <select v-model="filterType" class="filter-select">
          <option value="">All Results</option>
          <option value="MATCH">Exact Matches ✓</option>
          <option value="SHORTAGE">Shortages ️</option>
          <option value="OVERAGE">Overages </option>
        </select>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredRecords.length === 0" class="empty-state">
      No reconciliation records found matching the filter criteria.
    </div>

    <!-- Records Table / Grid -->
    <div v-else class="reconciliation-grid">
      <div 
        v-for="rec in filteredRecords" 
        :key="rec.id"
        class="reconciliation-card"
        :class="`border-${rec.discrepancyType.toLowerCase()}`"
      >
        <div class="card-top">
          <div class="rec-title">
            <span class="rec-resource">{{ rec.resource?.name || 'Emergency Resource' }}</span>
            <span class="rec-hospitals">
               {{ rec.sourceHospital?.hospitalName || 'Source' }} →  {{ rec.destinationHospital?.hospitalName || 'Destination' }}
            </span>
          </div>
          <span class="status-pill" :class="`pill-${rec.status.toLowerCase()}`">
            {{ rec.status }}
          </span>
        </div>

        <div class="quantities-box">
          <div class="qty-col">
            <span class="qty-label">Expected:</span>
            <span class="qty-num expected">{{ rec.expectedQuantity }}</span>
          </div>
          <div class="qty-col">
            <span class="qty-label">Actual Confirmed:</span>
            <span class="qty-num actual">{{ rec.actualQuantity }}</span>
          </div>
          <div class="qty-col">
            <span class="qty-label">Discrepancy:</span>
            <span class="qty-num diff" :class="getDiffClass(rec.discrepancyQuantity)">
              {{ rec.discrepancyQuantity > 0 ? `+${rec.discrepancyQuantity}` : rec.discrepancyQuantity }}
              <span class="diff-type">({{ rec.discrepancyType }})</span>
            </span>
          </div>
        </div>

        <!-- Resolution Information -->
        <div v-if="rec.status === 'RESOLVED'" class="resolution-box">
          <div class="resolution-badge">
            <span>✓ Resolved by {{ rec.resolvedBy || 'Operations Admin' }}</span>
          </div>
          <p v-if="rec.resolutionReason" class="resolution-reason">
            <strong>Reason:</strong> {{ rec.resolutionReason }}
          </p>
        </div>

        <!-- Resolve Button if Discrepancy Unresolved -->
        <div v-if="rec.status === 'DISCREPANCY'" class="action-footer">
          <button class="btn-resolve" @click="$emit('resolve-discrepancy', rec)">
            ️ Resolve Discrepancy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalReconciliation',
  props: {
    reconciliations: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      filterType: ''
    };
  },
  computed: {
    filteredRecords() {
      if (!this.filterType) return this.reconciliations;
      return this.reconciliations.filter(r => r.discrepancyType === this.filterType);
    }
  },
  methods: {
    getDiffClass(diff) {
      if (diff === 0) return 'diff-zero';
      if (diff < 0) return 'diff-short';
      return 'diff-over';
    }
  }
};
</script>

<style scoped>
.reconciliation-panel {
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

.reconciliation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
}

.reconciliation-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 14px;
  border-left: 4px solid #475569;
}

.border-match { border-left-color: #10b981; }
.border-shortage { border-left-color: #ef4444; }
.border-overage { border-left-color: #3b82f6; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.rec-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-resource {
  font-weight: 700;
  font-size: 0.95rem;
}

.rec-hospitals {
  font-size: 0.75rem;
  color: #94a3b8;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.pill-reconciled { background: #065f46; color: #34d399; }
.pill-discrepancy { background: #7f1d1d; color: #f87171; }
.pill-resolved { background: #1e3a8a; color: #93c5fa; }
.pill-pending { background: #854d0e; color: #fde047; }

.quantities-box {
  display: flex;
  justify-content: space-between;
  background: #0f172a;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.qty-col {
  display: flex;
  flex-direction: column;
}

.qty-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.qty-num {
  font-weight: 700;
  font-size: 1rem;
}

.expected { color: #cbd5e1; }
.actual { color: #f8fafc; }

.diff-zero { color: #34d399; }
.diff-short { color: #f87171; }
.diff-over { color: #60a5fa; }

.diff-type {
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 4px;
}

.resolution-box {
  background: #111827;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.75rem;
  margin-top: 8px;
  border-left: 3px solid #3b82f6;
}

.resolution-badge {
  font-weight: 600;
  color: #93c5fd;
  margin-bottom: 4px;
}

.resolution-reason {
  color: #e2e8f0;
  margin: 0;
}

.action-footer {
  margin-top: 10px;
}

.btn-resolve {
  width: 100%;
  background: #2563eb;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
}
</style>
