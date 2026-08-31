<template>
  <div class="audit-view">
    <div class="header-card tactical-card">
      <div>
        <h2>🧾 IMMUTABLE SYSTEM AUDIT TRAIL LOGS</h2>
        <p>Real-time audit recording of all command actions, dispatch allocations, and AI-computed priority changes.</p>
      </div>
    </div>

    <div class="tactical-card logs-panel">
      <div class="table-container">
        <table class="tactical-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>OPERATOR / AGENT</th>
              <th>ACTION</th>
              <th>TARGET ENTITY</th>
              <th>DETAILS</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="font-mono text-cyan">{{ log.id }}</td>
              <td><strong>{{ log.user }}</strong></td>
              <td><span class="action-tag">{{ log.action }}</span></td>
              <td>{{ log.entity }}</td>
              <td class="text-muted">{{ log.details }}</td>
              <td class="font-mono">{{ log.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const logs = ref([]);

onMounted(async () => {
  try {
    const res = await api.get('/audit');
    logs.value = res.data.data;
  } catch (err) {
    console.error('Failed to load audit logs', err);
  }
});
</script>

<style scoped>
.audit-view {
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

.logs-panel {
  padding: 1.25rem;
}

.table-container {
  overflow-x: auto;
}

.tactical-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  text-align: left;
}

.tactical-table th {
  padding: 0.75rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.8);
}

.tactical-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  color: #cbd5e1;
}

.action-tag {
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #60a5fa;
  font-size: 0.7rem;
  font-family: var(--font-mono);
}

.text-cyan { color: #06b6d4; }
.text-muted { color: #94a3b8; }
.font-mono { font-family: var(--font-mono); }
</style>
