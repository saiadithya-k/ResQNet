<template>
  <div class="audit-view">
    <div class="header-card tactical-card">
      <div class="hdr-text">
        <h2> IMMUTABLE SYSTEM AUDIT TRAIL & OPERATIONAL LOGS</h2>
        <p>Real-time forensic audit logging of all command decisions, status transitions, responder dispatches, and SHA-256 integrity verifications.</p>
      </div>
      <div class="audit-stats-strip font-mono" v-if="logs.length">
        <span class="stat-pill"><strong class="text-cyan">{{ logs.length }}</strong> EVENTS RECORDED</span>
        <span class="stat-pill"><strong class="text-emerald">LIVE</strong> REAL-TIME SYNC</span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="tactical-card filter-toolbar">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Filter audit records by actor, action, incident ID..."
          class="audit-search-input font-mono"
        />
      </div>

      <div class="category-filters">
        <button
          v-for="cat in ['ALL', 'INCIDENTS', 'DISPATCH', 'DISASTER', 'EVIDENCE']"
          :key="cat"
          :class="['filter-btn', 'font-mono', { active: activeFilter === cat }]"
          @click="activeFilter = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Main Audit Table -->
    <div class="tactical-card logs-panel">
      <div class="table-container">
        <table class="tactical-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>TIMESTAMP</th>
              <th>OPERATOR / AGENT</th>
              <th>ACTION TYPE</th>
              <th>TARGET ENTITY</th>
              <th>AUDIT METADATA & DIRECTIVES</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="audit-row"
            >
              <td class="font-mono text-cyan font-bold">{{ log.id }}</td>
              <td class="font-mono text-xs text-slate-400">{{ log.time || '10:32:15' }}</td>
              <td>
                <span class="actor-badge font-mono">{{ log.user || 'Command Chief' }}</span>
              </td>
              <td>
                <span :class="['action-tag', 'font-mono', getActionClass(log.action)]">
                  {{ log.action }}
                </span>
              </td>
              <td>
                <strong class="text-slate-200">{{ log.entity }}</strong>
              </td>
              <td class="meta-details font-mono text-xs">
                {{ log.details }}
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="6" class="no-records-cell font-mono">
                No matching operational audit records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '../../services/api';
import socketService from '../../services/socketService';

const logs = ref([]);
const searchQuery = ref('');
const activeFilter = ref('ALL');

onMounted(async () => {
  try {
    const res = await api.get('/audit');
    logs.value = res.data.data;
  } catch (err) {
    console.error('Failed to load audit logs', err);
  }

  // Real-time listener for incoming audit records
  socketService.on('audit:created', handleNewAuditLog);
});

onUnmounted(() => {
  socketService.off('audit:created', handleNewAuditLog);
});

function handleNewAuditLog(newLog) {
  if (!newLog) return;
  // Prepend if not already present
  if (!logs.value.some(l => l.id === newLog.id)) {
    logs.value.unshift(newLog);
  }
}

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    // 1. Category Filter
    if (activeFilter.value === 'INCIDENTS' && !log.action.includes('INCIDENT') && !log.action.includes('STATUS') && !log.action.includes('PRIORITY')) return false;
    if (activeFilter.value === 'DISPATCH' && !log.action.includes('DISPATCH') && !log.action.includes('TRANSFER') && !log.action.includes('ROUTE')) return false;
    if (activeFilter.value === 'DISASTER' && !log.action.includes('DISASTER') && !log.action.includes('ZONE') && !log.action.includes('SURGE')) return false;
    if (activeFilter.value === 'EVIDENCE' && !log.action.includes('EVIDENCE') && !log.action.includes('SHA') && !log.action.includes('TAMPER')) return false;

    // 2. Search Query
    if (!searchQuery.value.trim()) return true;
    const q = searchQuery.value.toLowerCase();
    return (
      (log.id && log.id.toLowerCase().includes(q)) ||
      (log.user && log.user.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.entity && log.entity.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });
});

function getActionClass(action) {
  if (!action) return 'tag-blue';
  if (action.includes('DISASTER') || action.includes('TAMPER')) return 'tag-red';
  if (action.includes('DISPATCH') || action.includes('VERIFIED')) return 'tag-emerald';
  if (action.includes('PRIORITY') || action.includes('TRANSFER')) return 'tag-amber';
  if (action.includes('EVIDENCE')) return 'tag-purple';
  return 'tag-cyan';
}
</script>

<style scoped>
.audit-view {
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
  gap: 0.75rem;
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
}

.audit-stats-strip {
  display: flex;
  gap: 0.5rem;
}

.stat-pill {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.65rem;
  color: #94a3b8;
}

.filter-toolbar {
  padding: 0.75rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-box {
  flex: 1;
  max-width: 420px;
}

.audit-search-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f8fafc;
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
  outline: none;
}

.audit-search-input:focus {
  border-color: #38bdf8;
}

.category-filters {
  display: flex;
  gap: 0.35rem;
}

.filter-btn {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.7);
  color: #94a3b8;
  padding: 0.3rem 0.55rem;
  border-radius: 5px;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  border-color: #38bdf8;
  color: #cbd5e1;
}

.filter-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
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
  padding: 0.65rem 0.75rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  font-size: 0.675rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.8);
}

.tactical-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  color: #cbd5e1;
}

.audit-row:hover td {
  background: rgba(30, 41, 59, 0.35);
}

.actor-badge {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.675rem;
  color: #cbd5e1;
}

.action-tag {
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  display: inline-block;
}

.tag-red { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; }
.tag-emerald { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #6ee7b7; }
.tag-amber { background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); color: #fcd34d; }
.tag-purple { background: rgba(168, 85, 247, 0.2); border: 1px solid rgba(168, 85, 247, 0.5); color: #d8b4fe; }
.tag-cyan { background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.5); color: #67e8f9; }
.tag-blue { background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5); color: #93c5fd; }

.meta-details {
  color: #94a3b8;
}

.no-records-cell {
  text-align: center;
  padding: 2rem !important;
  color: #64748b;
}

.text-cyan { color: #06b6d4; }
.font-mono { font-family: var(--font-mono); }
</style>
