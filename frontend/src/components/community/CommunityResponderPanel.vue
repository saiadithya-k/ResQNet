<template>
  <div class="community-panel">
    <div class="panel-header">
      <div class="header-left">
        <h3> Community First Responder Terminal</h3>
        <span class="volunteer-tag">Verified Volunteer Mesh</span>
      </div>
      <div class="availability-toggle">
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            :checked="isAvailable" 
            @change="$emit('toggle-availability', $event.target.checked)"
          />
          <span class="slider"></span>
        </label>
        <span class="status-label" :class="isAvailable ? 'text-available' : 'text-unavailable'">
          {{ isAvailable ? 'AVAILABLE FOR TASKS' : 'OFF DUTY / UNAVAILABLE' }}
        </span>
      </div>
    </div>

    <!-- Active Assigned Task (if any) -->
    <div v-if="activeTask" class="active-task-banner">
      <div class="task-top">
        <span class="active-badge"> ACTIVE ASSIGNMENT</span>
        <span class="task-status-pill">{{ activeTask.status }}</span>
      </div>
      <h4>{{ activeTask.incident ? activeTask.incident.title : 'Assigned Emergency Task' }}</h4>
      <p class="task-desc">{{ activeTask.incident ? activeTask.incident.description : '' }}</p>
      
      <div class="task-actions">
        <button 
          v-if="activeTask.status === 'DISPATCHED'" 
          class="btn btn-enroute"
          @click="$emit('update-status', activeTask.id, 'EN_ROUTE')"
        >
          Mark En Route
        </button>
        <button 
          v-if="activeTask.status === 'EN_ROUTE'" 
          class="btn btn-onscene"
          @click="$emit('update-status', activeTask.id, 'ON_SCENE')"
        >
          Mark On Scene
        </button>
        <button 
          v-if="activeTask.status === 'ON_SCENE'" 
          class="btn btn-completed"
          @click="$emit('update-status', activeTask.id, 'COMPLETED')"
        >
          Complete Task
        </button>
        <button 
          v-if="activeTask.status !== 'COMPLETED'" 
          class="btn btn-decline"
          @click="$emit('decline-task', activeTask.id)"
        >
          Cancel / Decline
        </button>
      </div>
    </div>

    <!-- Nearby Task Discovery Feed -->
    <div class="nearby-feed">
      <div class="feed-header">
        <h4>Nearby Safe Tasks</h4>
        <small class="feed-sub">* Hazardous incidents are filtered out for volunteer safety</small>
      </div>

      <div v-if="!isAvailable" class="unavailable-notice">
        You are currently marked unavailable. Toggle availability above to discover nearby response tasks.
      </div>

      <div v-else-if="nearbyTasks.length === 0" class="no-tasks">
        No active tasks nearby at this moment.
      </div>

      <div 
        v-for="task in nearbyTasks" 
        :key="task.taskId"
        class="task-card"
      >
        <div class="task-card-header">
          <span class="task-title">{{ task.title }}</span>
          <span class="task-dist">{{ task.distanceKm !== null ? `${task.distanceKm} km away` : 'Nearby' }}</span>
        </div>
        <p class="task-card-desc">{{ task.description }}</p>
        <div class="task-card-meta">
          <span class="meta-tag type-pill">{{ task.incidentType }}</span>
          <span class="meta-tag sev-pill">{{ task.severity }}</span>
          <span v-if="task.hasInjuries" class="meta-tag inj-pill">Injuries</span>
        </div>
        <div class="task-card-footer">
          <button 
            class="accept-btn" 
            :disabled="hasActiveTask"
            @click="$emit('accept-task', task.taskId)"
          >
            {{ hasActiveTask ? 'Already On Task' : 'Accept Task' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommunityResponderPanel',
  props: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    activeTask: {
      type: Object,
      default: () => null
    },
    nearbyTasks: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasActiveTask() {
      return Boolean(this.activeTask && this.activeTask.status !== 'COMPLETED');
    }
  },
  emits: ['toggle-availability', 'accept-task', 'update-status', 'decline-task']
};
</script>

<style scoped>
.community-panel {
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.volunteer-tag {
  font-size: 0.75rem;
  background: #065f46;
  color: #34d399;
  padding: 2px 8px;
  border-radius: 12px;
}

.availability-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-size: 0.8rem;
  font-weight: 700;
}

.text-available { color: #34d399; }
.text-unavailable { color: #94a3b8; }

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #475569;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }

.active-task-banner {
  background: #1e293b;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 16px;
}

.task-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.active-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #60a5fa;
}

.task-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  background: #2563eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.task-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-enroute { background: #d97706; color: #fff; }
.btn-onscene { background: #2563eb; color: #fff; }
.btn-completed { background: #059669; color: #fff; }
.btn-decline { background: #dc2626; color: #fff; }

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.feed-sub {
  font-size: 0.7rem;
  color: #64748b;
  font-style: italic;
}

.task-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}

.task-dist {
  font-size: 0.8rem;
  color: #38bdf8;
}

.task-card-desc {
  font-size: 0.8rem;
  color: #cbd5e1;
  margin: 6px 0;
}

.task-card-meta {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.meta-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-pill { background: #334155; }
.sev-pill { background: #854d0e; }
.inj-pill { background: #991b1b; }

.accept-btn {
  background: #059669;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.accept-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unavailable-notice, .no-tasks {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
