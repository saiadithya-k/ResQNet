<template>
  <div class="dispatch-panel">
    <div class="panel-header">
      <h3> Smart Dispatch & Matching Engine</h3>
      <span class="decision-support-tag">Decision-Support Mode</span>
    </div>

    <div v-if="incident" class="incident-summary">
      <h4>{{ incident.title }}</h4>
      <div class="incident-meta">
        <span class="meta-tag type-tag">{{ incident.incidentType }}</span>
        <span class="meta-tag sev-tag" :class="`sev-${(incident.severity || 'medium').toLowerCase()}`">
          {{ incident.severity }}
        </span>
        <span class="meta-tag priority-tag">Priority {{ incident.priorityScore }}</span>
      </div>
      <div class="requirements-box">
        <div v-if="incident.requiredSkills && incident.requiredSkills.length" class="req-group">
          <strong>Skills Required:</strong> {{ incident.requiredSkills.join(', ') }}
        </div>
        <div v-if="incident.requiredEquipment && incident.requiredEquipment.length" class="req-group">
          <strong>Equipment Required:</strong> {{ incident.requiredEquipment.join(', ') }}
        </div>
      </div>
    </div>

    <div class="matches-section">
      <div class="matches-header">
        <h4>Ranked Candidate Responders ({{ matches.length }})</h4>
        <small class="eta-note">* ETA is estimated based on geographic distance and assumed response speed</small>
      </div>

      <div v-if="matches.length === 0" class="no-matches">
        No active eligible responders available.
      </div>

      <div 
        v-for="m in matches" 
        :key="m.responderId"
        class="match-card"
        :class="{ 'high-match': m.matchScore >= 80 }"
      >
        <div class="card-top">
          <div class="responder-info">
            <span class="resp-name">{{ m.name }}</span>
            <span class="resp-badge">Badge: {{ m.badgeNumber || 'N/A' }}</span>
            <span class="resp-type">{{ m.responderType }}</span>
          </div>
          <div class="score-badge">
            <span class="score-num">{{ m.matchScore }}</span>
            <span class="score-label">MATCH</span>
          </div>
        </div>

        <div class="metrics-row">
          <div class="metric-item">
            <span class="metric-lbl">Distance</span>
            <span class="metric-val">{{ m.distanceKm !== null ? `${m.distanceKm} km` : 'N/A' }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">Est. ETA</span>
            <span class="metric-val">{{ m.etaMinutes !== null ? `${m.etaMinutes} min` : 'N/A' }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">Fatigue</span>
            <span class="metric-val" :class="`fatigue-${m.fatigueLevel.toLowerCase()}`">{{ m.fatigueLevel }} ({{ m.breakdown.fatigueScore }}%)</span>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">Workload</span>
            <span class="metric-val">{{ m.activeDispatchesCount }} active</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="matched-pills">
            <span v-for="s in m.matchedSkills" :key="s" class="pill skill-pill">✓ {{ s }}</span>
            <span v-for="e in m.matchedEquipment" :key="e" class="pill eq-pill"> {{ e }}</span>
          </div>
          <button 
            class="dispatch-btn" 
            :disabled="isDispatching" 
            @click="$emit('dispatch', m.responderId)"
          >
            Dispatch Unit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DispatchPanel',
  props: {
    incident: {
      type: Object,
      default: () => null
    },
    matches: {
      type: Array,
      default: () => []
    },
    isDispatching: {
      type: Boolean,
      default: false
    }
  },
  emits: ['dispatch']
};
</script>

<style scoped>
.dispatch-panel {
  background: #0f172a;
  color: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
  font-family: inherit;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.decision-support-tag {
  font-size: 0.75rem;
  background: #1e293b;
  border: 1px solid #475569;
  padding: 2px 8px;
  border-radius: 12px;
  color: #94a3b8;
}

.incident-summary {
  background: #1e293b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.incident-meta {
  display: flex;
  gap: 8px;
  margin: 6px 0;
}

.meta-tag {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.type-tag { background: #3b82f6; color: #fff; }
.sev-critical { background: #dc2626; color: #fff; }
.sev-high { background: #ea580c; color: #fff; }
.sev-medium { background: #d97706; color: #fff; }
.priority-tag { background: #6366f1; color: #fff; }

.requirements-box {
  font-size: 0.8rem;
  color: #cbd5e1;
  margin-top: 8px;
}

.matches-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.eta-note {
  font-size: 0.7rem;
  color: #64748b;
  font-style: italic;
}

.match-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.match-card.high-match {
  border-color: #3b82f6;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.resp-name {
  font-weight: 700;
  font-size: 0.95rem;
  display: block;
}

.resp-badge, .resp-type {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-right: 8px;
}

.score-badge {
  text-align: center;
  background: #0284c7;
  padding: 4px 8px;
  border-radius: 6px;
}

.score-num {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  display: block;
}

.score-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #bae6fd;
}

.metrics-row {
  display: flex;
  gap: 16px;
  background: #0f172a;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-lbl {
  font-size: 0.65rem;
  color: #64748b;
}

.metric-val {
  font-size: 0.8rem;
  font-weight: 600;
}

.fatigue-low { color: #34d399; }
.fatigue-moderate { color: #facc15; }
.fatigue-high { color: #fb923c; }
.fatigue-critical { color: #f87171; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.matched-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pill {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
}

.skill-pill { background: #064e3b; color: #6ee7b7; }
.eq-pill { background: #312e81; color: #a5b4fc; }

.dispatch-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dispatch-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.dispatch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-matches {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
