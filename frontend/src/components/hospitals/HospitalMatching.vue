<template>
  <div class="hospital-matching-panel">
    <div class="matching-header">
      <div class="header-left">
        <h4>🎯 Deterministic Hospital Match Console</h4>
        <span class="sub-text">Intelligent Emergency Destination Optimization</span>
      </div>
      <div v-if="matchData" class="incident-badge">
        <span>Incident #{{ matchData.incident ? matchData.incident.id.slice(-6) : '' }}</span>
        <span class="sev-pill" :class="getSevClass(matchData.incident ? matchData.incident.severity : '')">
          {{ matchData.incident ? matchData.incident.severity : '' }}
        </span>
      </div>
    </div>

    <!-- Requirements Summary -->
    <div v-if="matchData && matchData.requirements" class="requirements-banner">
      <div class="req-item">
        <span class="req-label">Beds Needed:</span>
        <span class="req-val">{{ matchData.requirements.requiredBeds }}</span>
      </div>
      <div class="req-item">
        <span class="req-label">ICU Required:</span>
        <span class="req-val" :class="matchData.requirements.requiresIcu ? 'text-red' : 'text-green'">
          {{ matchData.requirements.requiresIcu ? 'YES (Critical)' : 'NO' }}
        </span>
      </div>
      <div v-if="matchData.requirements.requiredSpecialty" class="req-item">
        <span class="req-label">Required Specialty:</span>
        <span class="req-val spec-text">{{ matchData.requirements.requiredSpecialty }}</span>
      </div>
      <div class="req-item eligible-count">
        <span class="req-label">Eligible Matches:</span>
        <span class="req-val text-blue">{{ matchData.eligibleCount }} / {{ matchData.totalEvaluated }}</span>
      </div>
    </div>

    <!-- Ranked Matches List -->
    <div v-if="!matchData || matchData.matches.length === 0" class="no-matches">
      No eligible hospitals found satisfying all emergency requirements.
    </div>

    <div v-else class="matches-list">
      <div 
        v-for="(hosp, idx) in matchData.matches" 
        :key="hosp.hospitalId"
        class="match-card"
        :class="{ 'top-match': idx === 0 }"
      >
        <div class="card-top">
          <div class="rank-and-name">
            <span class="rank-badge">#{{ idx + 1 }}</span>
            <div class="name-info">
              <h5>{{ hosp.hospitalName }}</h5>
              <span class="district-text">{{ hosp.district }} • {{ hosp.distanceKm !== null ? `${hosp.distanceKm} km away` : 'Distance unavailable' }}</span>
            </div>
          </div>
          <div class="score-box">
            <span class="score-val">{{ hosp.score }}%</span>
            <span class="score-label">MATCH SCORE</span>
          </div>
        </div>

        <!-- Factor Breakdown -->
        <div class="factors-grid">
          <div class="factor-item">
            <span class="factor-title">Beds</span>
            <span class="factor-val">{{ hosp.capacity.availableBeds }}/{{ hosp.capacity.totalBeds }}</span>
          </div>
          <div class="factor-item">
            <span class="factor-title">ICU</span>
            <span class="factor-val" :class="hosp.capacity.availableIcu > 0 ? 'text-purple' : 'text-muted'">
              {{ hosp.capacity.availableIcu }}/{{ hosp.capacity.totalIcu }}
            </span>
          </div>
          <div class="factor-item">
            <span class="factor-title">On-Duty Specialists</span>
            <span class="factor-val">{{ hosp.availableSpecialists ? hosp.availableSpecialists.length : 0 }} Active</span>
          </div>
          <div class="factor-item">
            <span class="factor-title">Proximity Pts</span>
            <span class="factor-val">{{ hosp.factors ? hosp.factors.distanceScore : '-' }}/100</span>
          </div>
        </div>

        <!-- Explainable Reasons -->
        <div v-if="hosp.reasons && hosp.reasons.length > 0" class="reasons-list">
          <div v-for="(reason, rIdx) in hosp.reasons" :key="rIdx" class="reason-row">
            <span class="reason-bullet">✓</span>
            <span class="reason-text">{{ reason }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HospitalMatching',
  props: {
    matchData: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    getSevClass(sev) {
      switch (sev) {
        case 'CRITICAL': return 'sev-crit';
        case 'HIGH': return 'sev-high';
        case 'MEDIUM': return 'sev-med';
        default: return 'sev-low';
      }
    }
  }
};
</script>

<style scoped>
.hospital-matching-panel {
  background: #0f172a;
  color: #f8fafc;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
}

.matching-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #334155;
}

.sub-text {
  font-size: 0.75rem;
  color: #94a3b8;
}

.incident-badge {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.sev-pill {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.sev-crit { background: #7f1d1d; color: #f87171; }
.sev-high { background: #9a3412; color: #fb923c; }
.sev-med { background: #854d0e; color: #fde047; }
.sev-low { background: #065f46; color: #34d399; }

.requirements-banner {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 0.8rem;
}

.req-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.req-label { color: #94a3b8; font-weight: 600; }
.req-val { font-weight: 700; }
.spec-text { color: #a5b4fc; }
.text-red { color: #f87171; }
.text-green { color: #34d399; }
.text-blue { color: #38bdf8; }
.text-purple { color: #c084fc; }
.text-muted { color: #64748b; }

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 14px;
  transition: .2s;
}

.top-match {
  border: 2px solid #10b981;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.rank-and-name {
  display: flex;
  gap: 10px;
  align-items: center;
}

.rank-badge {
  background: #334155;
  color: #38bdf8;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 4px 10px;
  border-radius: 6px;
}

.top-match .rank-badge {
  background: #065f46;
  color: #34d399;
}

.name-info h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.district-text {
  font-size: 0.75rem;
  color: #94a3b8;
}

.score-box {
  text-align: right;
}

.score-val {
  font-size: 1.4rem;
  font-weight: 900;
  color: #34d399;
}

.score-label {
  display: block;
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
}

.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  background: #0f172a;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.factor-item {
  display: flex;
  flex-direction: column;
}

.factor-title {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
}

.factor-val {
  font-size: 0.85rem;
  font-weight: 700;
}

.reasons-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reason-row {
  display: flex;
  gap: 6px;
  font-size: 0.75rem;
}

.reason-bullet {
  color: #10b981;
  font-weight: 800;
}

.reason-text {
  color: #cbd5e1;
}

.no-matches {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
