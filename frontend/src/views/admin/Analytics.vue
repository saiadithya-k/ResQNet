<template>
  <div class="analytics-view">
    <div class="header-card tactical-card">
      <div class="hdr-text">
        <h2>📊 RESQNET COMMAND & OPERATIONAL ANALYTICS</h2>
        <p>Real-time emergency volume distribution, response velocity benchmarks, and end-to-end incident lifecycle duration tracking.</p>
      </div>
      <div class="hdr-kpis" v-if="stats">
        <div class="mini-kpi">
          <span class="m-lbl">ACTIVE EMERGENCIES</span>
          <span class="m-val text-amber font-mono">{{ stats.activeEmergencies }}</span>
        </div>
        <div class="mini-kpi">
          <span class="m-lbl">AVG DISPATCH</span>
          <span class="m-val text-emerald font-mono">{{ stats.averageDispatchSeconds }}s</span>
        </div>
        <div class="mini-kpi">
          <span class="m-lbl">AVG RESPONSE</span>
          <span class="m-val text-cyan font-mono">{{ stats.averageEtaMinutes }}m</span>
        </div>
        <div class="mini-kpi">
          <span class="m-lbl">PERSONS RESCUED</span>
          <span class="m-val text-purple font-mono">{{ stats.peopleRescued }}</span>
        </div>
      </div>
    </div>

    <!-- Analytics Dashboard Grid -->
    <div v-if="stats" class="analytics-grid">
      <!-- 1. Incident Volume Over Time (Hourly Distribution) -->
      <div class="tactical-card chart-card">
        <div class="card-title">INCIDENT VOLUME OVER TIME (HOURLY INFLOW)</div>
        <div class="hourly-volume-chart">
          <div v-for="h in stats.hourlyVolume || []" :key="h.hour" class="h-col">
            <div class="h-vals">
              <span class="h-total font-mono">{{ h.total }}</span>
              <span class="h-crit font-mono text-red" v-if="h.critical">({{ h.critical }}⚡)</span>
            </div>
            <div class="h-bar-track">
              <div class="h-bar-fill fill-crit" :style="{ height: `${(h.critical / 15) * 100}%` }"></div>
              <div class="h-bar-fill fill-normal" :style="{ height: `${((h.total - h.critical) / 15) * 100}%` }"></div>
            </div>
            <span class="h-label font-mono">{{ h.hour }}</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot dot-normal"></span> Standard Emergencies</span>
          <span class="legend-item"><span class="legend-dot dot-crit"></span> Critical Priority</span>
        </div>
      </div>

      <!-- 2. Response Time Telemetry Trend -->
      <div class="tactical-card chart-card">
        <div class="card-title">RESPONSE TIME VELOCITY TREND (MINUTES)</div>
        <div class="trend-grid">
          <div v-for="point in stats.responseTimeTrend || []" :key="point.time" class="trend-col">
            <div class="trend-val font-mono">{{ point.avgMinutes }}m</div>
            <div class="trend-bar-wrapper">
              <div
                class="trend-bar"
                :style="{ height: `${(point.avgMinutes / 12) * 100}%` }"
                :class="point.avgMinutes <= 8 ? 'trend-optimal' : 'trend-warn'"
              ></div>
            </div>
            <div class="trend-label font-mono">{{ point.time }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot dot-emerald"></span> Optimal Target (&le; 8.0 min)</span>
          <span class="legend-item"><span class="legend-dot dot-amber"></span> Elevated SLA Window</span>
        </div>
      </div>

      <!-- 3. Incident Breakdown by Hazard Classification -->
      <div class="tactical-card chart-card">
        <div class="card-title">INCIDENT VOLUME BY CLASSIFICATION</div>
        <div class="bar-chart-container">
          <div v-for="item in stats.incidentsByType || []" :key="item.type" class="bar-item">
            <div class="bar-meta">
              <span class="font-mono">{{ item.type }}</span>
              <strong class="font-mono">{{ item.count }} Incidents</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${Math.min(100, (item.count / 15) * 100)}%`, backgroundColor: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. End-to-End Incident Lifecycle Performance -->
      <div class="tactical-card chart-card">
        <div class="card-title">INCIDENT LIFECYCLE DURATION & STAGE VELOCITY</div>
        <div class="lifecycle-perf-list">
          <div
            v-for="st in stats.lifecyclePerformance || []"
            :key="st.state"
            class="life-perf-row"
          >
            <div class="life-perf-meta">
              <span class="font-mono text-xs text-slate-200">
                <strong>{{ st.state }}</strong>
              </span>
              <span class="font-mono text-xs">
                Avg: <strong class="text-cyan">{{ st.avgDurationMinutes }} min</strong>
                <span class="text-slate-400"> (SLA &le; {{ st.targetMinutes }}m)</span>
              </span>
            </div>
            <div class="life-perf-track">
              <div
                class="life-perf-fill"
                :style="{ width: `${st.targetMinutes ? Math.min(100, (st.avgDurationMinutes / st.targetMinutes) * 100) : 0}%` }"
                :class="st.avgDurationMinutes <= st.targetMinutes ? 'life-optimal' : 'life-warn'"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Loading State Fallback -->
    <div v-else class="tactical-card empty-loading font-mono">
      <span>⚡ Synchronizing real-time operational analytics stream...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const stats = ref(null);

onMounted(async () => {
  try {
    const res = await api.get('/analytics/stats');
    stats.value = res.data.data;
  } catch (err) {
    console.error('Failed to load analytics', err);
  }
});
</script>

<style scoped>
.analytics-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-card {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
}

.hdr-kpis {
  display: flex;
  gap: 0.75rem;
}

.mini-kpi {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-lbl {
  font-size: 0.575rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.m-val {
  font-size: 1.1rem;
  font-weight: 800;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.chart-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.card-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

/* Hourly Volume Chart */
.hourly-volume-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  padding-top: 1rem;
}

.h-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  justify-content: flex-end;
}

.h-vals {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.65rem;
}

.h-total { color: #f8fafc; font-weight: 700; }
.h-crit { font-size: 0.575rem; }

.h-bar-track {
  width: 28px;
  height: 100px;
  background: #090e1a;
  border-radius: 4px;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
}

.h-bar-fill {
  width: 100%;
  transition: height 0.3s ease;
}

.fill-crit { background: #ef4444; }
.fill-normal { background: #3b82f6; }

.h-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  font-size: 0.65rem;
  color: #94a3b8;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(51, 65, 85, 0.4);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-normal { background: #3b82f6; }
.dot-crit { background: #ef4444; }
.dot-emerald { background: #10b981; }
.dot-amber { background: #f59e0b; }

/* Trend Grid */
.trend-grid {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 160px;
  padding-top: 1rem;
}

.trend-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  justify-content: flex-end;
}

.trend-val {
  font-size: 0.7rem;
  color: #38bdf8;
  font-weight: 700;
}

.trend-bar-wrapper {
  width: 28px;
  height: 100px;
  background: #090e1a;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.trend-bar {
  width: 100%;
  border-radius: 4px;
  transition: height 0.3s ease;
}

.trend-optimal { background: linear-gradient(180deg, #10b981, #059669); }
.trend-warn { background: linear-gradient(180deg, #f59e0b, #d97706); }

.trend-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Lifecycle Performance */
.lifecycle-perf-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.life-perf-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.life-perf-meta {
  display: flex;
  justify-content: space-between;
}

.life-perf-track {
  width: 100%;
  height: 6px;
  background: #090e1a;
  border-radius: 3px;
  overflow: hidden;
}

.life-perf-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.life-optimal { background: #10b981; }
.life-warn { background: #f59e0b; }

/* Breakdown by Classification */
.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #e2e8f0;
  margin-bottom: 0.2rem;
}

.bar-track {
  height: 8px;
  background: #090e1a;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
}

.empty-loading {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}

.text-cyan { color: #06b6d4; }
.text-emerald { color: #10b981; }
.text-amber { color: #f59e0b; }
.text-purple { color: #a855f7; }
.text-red { color: #ef4444; }
</style>
