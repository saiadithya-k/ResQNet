<template>
  <header class="tactical-navbar">
    <!-- Brand Logo & Live Radar Indicator -->
    <div class="brand-section">
      <div class="logo-icon">
        <span class="pulse-radar"></span>
        🚨
      </div>
      <div class="brand-titles">
        <h1 class="logo-text">ResQ<span>Net</span></h1>
        <p class="logo-subtext">AI Emergency Intelligence System</p>
      </div>
    </div>

    <!-- Center Live System Status / Disaster Mode Banner -->
    <div class="center-banner">
      <div v-if="disasterStore.isDisasterMode" class="disaster-active-badge">
        <span class="siren-icon">🚨</span>
        <span class="text">DISASTER MODE ACTIVE: {{ disasterStore.activeDisaster?.type || 'MAJOR EMERGENCY' }}</span>
      </div>
      <div v-else class="system-status-badge">
        <span class="status-dot"></span>
        <span class="text">COMMAND STATUS: OPERATIONAL</span>
      </div>
    </div>

    <!-- Quick Stats & User Profile -->
    <div class="right-section">
      <div class="quick-kpi">
        <span class="label">ACTIVE:</span>
        <span class="val text-amber">{{ incidentStore.activeIncidentsCount }}</span>
      </div>
      <div class="quick-kpi">
        <span class="label">CRITICAL:</span>
        <span class="val text-red">{{ incidentStore.criticalIncidents.length }}</span>
      </div>

      <div class="user-pill">
        <div class="avatar">{{ authStore.user?.name?.charAt(0) || 'A' }}</div>
        <div class="user-meta">
          <span class="user-name">{{ authStore.user?.name || 'Chief Miller' }}</span>
          <span class="user-role badge-role">{{ authStore.user?.role || 'ADMIN' }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '../../stores/authStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useDisasterStore } from '../../stores/disasterStore';

const authStore = useAuthStore();
const incidentStore = useIncidentStore();
const disasterStore = useDisasterStore();
</script>

<style scoped>
.tactical-navbar {
  height: 64px;
  background: rgba(10, 15, 30, 0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.7);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  z-index: 1000;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.logo-icon {
  position: relative;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 10px;
}

.pulse-radar {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  border: 2px solid #ef4444;
  animation: radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes radar-pulse {
  0% { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.1;
}

.logo-text span {
  color: #3b82f6;
}

.logo-subtext {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.center-banner {
  display: flex;
  align-items: center;
}

.system-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(16, 185, 129, 0.4);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: #6ee7b7;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: blink 1.5s infinite;
}

.disaster-active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(220, 38, 38, 0.25);
  border: 1px solid #ef4444;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #fca5a5;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  animation: pulse-border 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.quick-kpi {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
}

.quick-kpi .label {
  color: #64748b;
}

.quick-kpi .val {
  font-weight: 700;
  font-size: 0.9rem;
}

.text-amber { color: #f59e0b; }
.text-red { color: #ef4444; }

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: rgba(30, 41, 59, 0.6);
  padding: 0.25rem 0.75rem 0.25rem 0.35rem;
  border-radius: 9999px;
  border: 1px solid #334155;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: white;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
}

.badge-role {
  font-size: 0.625rem;
  color: #38bdf8;
  font-family: var(--font-mono);
}
</style>
