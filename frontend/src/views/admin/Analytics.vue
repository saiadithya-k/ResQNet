<template>
  <div class="analytics-view">
    <div class="header-card tactical-card">
      <div>
        <h2>📊 COMMAND OPERATIONS & PERFORMANCE ANALYTICS</h2>
        <p>Real-time emergency intelligence metrics, response time telemetry, and operational resolution tracking.</p>
      </div>
    </div>

    <!-- Analytics Dashboard Grid -->
    <div class="analytics-grid">
      <!-- 1. Incident Breakdown by Type -->
      <div class="tactical-card chart-card">
        <div class="card-title">INCIDENT VOLUME BY CLASSIFICATION</div>
        <div class="bar-chart-container">
          <div v-for="item in stats?.incidentsByType" :key="item.type" class="bar-item">
            <div class="bar-meta">
              <span>{{ item.type }}</span>
              <strong>{{ item.count }} Incidents</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: `${(item.count / 15) * 100}%`, backgroundColor: item.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Response Time Telemetry Trend -->
      <div class="tactical-card chart-card">
        <div class="card-title">HOURLY AVERAGE RESPONSE TIME (MINUTES)</div>
        <div class="trend-grid">
          <div v-for="point in stats?.responseTimeTrend" :key="point.time" class="trend-col">
            <div class="trend-val">{{ point.avgMinutes }}m</div>
            <div class="trend-bar-wrapper">
              <div class="trend-bar" :style="{ height: `${(point.avgMinutes / 12) * 100}%` }"></div>
            </div>
            <div class="trend-label">{{ point.time }}</div>
          </div>
        </div>
      </div>

      <!-- 3. Key Performance Benchmarks -->
      <div class="tactical-card chart-card full-width">
        <div class="card-title">TACTICAL LIFECYCLE BENCHMARKS</div>
        <div class="benchmark-grid">
          <div class="bench-item">
            <span class="b-title">Detection & AI Extraction</span>
            <span class="b-val text-cyan">6 Seconds</span>
            <span class="b-sub">Whisper + LLM Sequential Triage</span>
          </div>
          <div class="bench-item">
            <span class="b-title">Average Dispatch Interval</span>
            <span class="b-val text-emerald">21 Seconds</span>
            <span class="b-sub">Fatigue & Skill-Aware Matching</span>
          </div>
          <div class="bench-item">
            <span class="b-title">Average On-Scene Arrival</span>
            <span class="b-val text-amber">4m 42s</span>
            <span class="b-sub">Emergency Green Corridor Routing</span>
          </div>
          <div class="bench-item">
            <span class="b-title">Total Civilians Rescued</span>
            <span class="b-val text-purple">142 Persons</span>
            <span class="b-sub">Cross-District Mesh Operations</span>
          </div>
        </div>
      </div>
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
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
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
  gap: 1rem;
}

.chart-card.full-width {
  grid-column: span 2;
}

.card-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.bar-chart-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.775rem;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
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
  font-family: var(--font-mono);
  color: #38bdf8;
  font-weight: 700;
}

.trend-bar-wrapper {
  width: 32px;
  height: 100px;
  background: #090e1a;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
}

.trend-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.bench-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.b-title {
  font-size: 0.7rem;
  color: #94a3b8;
}

.b-val {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: var(--font-display);
}

.b-sub {
  font-size: 0.65rem;
  color: #64748b;
}

.text-cyan { color: #06b6d4; }
.text-emerald { color: #10b981; }
.text-amber { color: #f59e0b; }
.text-purple { color: #a855f7; }
</style>
