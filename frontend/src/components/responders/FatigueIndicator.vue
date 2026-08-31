<template>
  <div class="fatigue-indicator" :class="`level-${level.toLowerCase()}`">
    <div class="fatigue-header">
      <span class="fatigue-title">Operational Workload / Fatigue</span>
      <span class="fatigue-badge" :class="`badge-${level.toLowerCase()}`">
        {{ level }} ({{ score }}%)
      </span>
    </div>
    
    <div class="fatigue-bar-track">
      <div 
        class="fatigue-bar-fill" 
        :style="{ width: `${Math.min(100, Math.max(0, score))}%` }"
        :class="`fill-${level.toLowerCase()}`"
      ></div>
    </div>

    <div v-if="factors" class="fatigue-factors">
      <div class="factor-item">
        <span class="factor-label">Duty Hours:</span>
        <span class="factor-val">{{ factors.dutyHours }}h</span>
      </div>
      <div class="factor-item">
        <span class="factor-label">Continuous Shifts:</span>
        <span class="factor-val">{{ factors.consecutiveShifts }}</span>
      </div>
      <div class="factor-item">
        <span class="factor-label">Incidents:</span>
        <span class="factor-val">{{ factors.incidentsCount }}</span>
      </div>
    </div>

    <div class="fatigue-disclaimer">
      * Operational dispatch decision-support indicator. Not a medical or clinical assessment.
    </div>
  </div>
</template>

<script>
export default {
  name: 'FatigueIndicator',
  props: {
    score: {
      type: Number,
      default: 0
    },
    level: {
      type: String,
      default: 'LOW'
    },
    factors: {
      type: Object,
      default: () => null
    }
  }
};
</script>

<style scoped>
.fatigue-indicator {
  padding: 12px 16px;
  background: #1e293b;
  border-radius: 8px;
  border: 1px solid #334155;
  color: #f8fafc;
  font-family: inherit;
}

.fatigue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.fatigue-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
}

.fatigue-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.badge-low { background: #065f46; color: #34d399; }
.badge-moderate { background: #854d0e; color: #facc15; }
.badge-high { background: #9a3412; color: #fb923c; }
.badge-critical { background: #991b1b; color: #f87171; }

.fatigue-bar-track {
  width: 100%;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.fatigue-bar-fill {
  height: 100%;
  transition: width 0.4s ease;
}

.fill-low { background: #10b981; }
.fill-moderate { background: #f59e0b; }
.fill-high { background: #f97316; }
.fill-critical { background: #ef4444; }

.fatigue-factors {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #cbd5e1;
  margin-top: 6px;
}

.factor-item {
  display: flex;
  gap: 4px;
}

.factor-label {
  color: #64748b;
}

.factor-val {
  font-weight: 600;
}

.fatigue-disclaimer {
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 8px;
  font-style: italic;
}
</style>
