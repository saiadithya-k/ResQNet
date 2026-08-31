<template>
  <header class="tactical-navbar">
    <!-- Brand Logo & Live Radar Indicator + Slide Toggle -->
    <div class="brand-section">
      <!-- Sidebar Slide Toggle Button -->
      <button
        class="sidebar-slide-toggle"
        @click="uiStore.toggleSidebar"
        :title="uiStore.sidebarOpen ? 'Slide Close Sidebar' : 'Slide Open Sidebar'"
      >
        <span class="toggle-icon">{{ uiStore.sidebarOpen ? '◀' : '☰' }}</span>
      </button>

      <router-link to="/" class="brand-link">
        <div class="logo-icon">
          <span class="pulse-radar"></span>
          🚨
        </div>
        <div class="brand-titles">
          <h1 class="logo-text">ResQ<span>Net</span></h1>
          <p class="logo-subtext">AI Emergency Intelligence System</p>
        </div>
      </router-link>
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
        <div class="avatar">{{ authStore.user?.name?.charAt(0) || authStore.user?.role?.charAt(0) || '👤' }}</div>
        <div class="user-meta">
          <span class="user-name">{{ authStore.user?.name || authStore.user?.mobileNumber || 'Guest User' }}</span>
          <span class="user-role badge-role">{{ authStore.user?.role || 'GUEST' }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Switch Account / Sign In">
          🚪
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useDisasterStore } from '../../stores/disasterStore';
import { useUiStore } from '../../stores/uiStore';

const router = useRouter();
const authStore = useAuthStore();
const incidentStore = useIncidentStore();
const disasterStore = useDisasterStore();
const uiStore = useUiStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
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
  padding: 0 1.25rem;
  z-index: 1000;
  position: relative;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  text-decoration: none;
  cursor: pointer;
}

.sidebar-slide-toggle {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.sidebar-slide-toggle:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-color: #3b82f6;
  transform: scale(1.05);
}

.logo-icon {
  position: relative;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
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
}

.center-banner {
  display: flex;
  align-items: center;
}

.system-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.875rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #34d399;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.disaster-active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 1rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #f87171;
  font-family: var(--font-mono);
  animation: pulse-danger 1.5s infinite;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quick-kpi {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background: rgba(30, 41, 59, 0.5);
  padding: 0.35rem 0.625rem;
  border-radius: 6px;
  border: 1px solid rgba(51, 65, 85, 0.5);
}

.quick-kpi .label {
  color: #94a3b8;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: rgba(30, 41, 59, 0.7);
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(51, 65, 85, 0.6);
}

.avatar {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.2;
}

.badge-role {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  color: #60a5fa;
}

.logout-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  opacity: 0.75;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, 0.25);
  transform: scale(1.1);
}
</style>
