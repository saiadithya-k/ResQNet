<template>
  <header class="tactical-navbar">
    <!-- Brand Logo & Live Radar Indicator + Slide Toggle -->
    <div class="brand-section">
      <!-- Sidebar Slide Toggle Button (Internal Screens Only) -->
      <button
        v-if="!isPublicRoute"
        class="sidebar-slide-toggle"
        @click="uiStore.toggleSidebar"
        :title="uiStore.sidebarOpen ? 'Slide Close Sidebar' : 'Slide Open Sidebar'"
      >
        <span class="toggle-icon">{{ uiStore.sidebarOpen ? '◀' : '' }}</span>
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
        <span class="siren-icon"></span>
        <span class="text">DISASTER MODE ACTIVE: {{ disasterStore.activeDisaster?.type || 'MAJOR EMERGENCY' }}</span>
      </div>
      <div v-else class="system-status-badge">
        <span class="status-dot"></span>
        <span class="text">COMMAND STATUS: OPERATIONAL</span>
      </div>
    </div>

    <!-- Quick Stats & User Profile / Sign In -->
    <div class="right-section">
      <div class="quick-kpi">
        <span class="label">ACTIVE:</span>
        <span class="val text-amber">{{ incidentStore.activeIncidentsCount }}</span>
      </div>
      <div class="quick-kpi">
        <span class="label">CRITICAL:</span>
        <span class="val text-red">{{ incidentStore.criticalIncidents.length }}</span>
      </div>

      <!-- Tactical Workflow Button (Public Architecture Webpage) -->
      <router-link to="/workflow" class="nav-workflow-btn" title="Open Tactical Emergency Workflow Canvas">
        <span class="wf-btn-icon">⚡</span>
        <span class="wf-btn-label">WORKFLOW</span>
      </router-link>

      <!-- Interactive User Account Menu (When Authenticated) -->
      <div v-if="authStore.isAuthenticated && authStore.user" class="user-menu-wrapper">
        <div class="user-pill" @click="toggleUserMenu" title="Account Menu">
          <div class="avatar">{{ authStore.user?.name?.charAt(0) || authStore.user?.role?.charAt(0) || '' }}</div>
          <div class="user-meta">
            <span class="user-name">{{ authStore.user?.name || authStore.user?.mobileNumber || 'User' }}</span>
            <span class="user-role badge-role">{{ authStore.user?.role || 'CITIZEN' }}</span>
          </div>
          <span class="dropdown-caret">{{ userMenuOpen ? '▲' : '▼' }}</span>
        </div>

        <!-- Dropdown Menu -->
        <div v-if="userMenuOpen" class="user-dropdown-menu">
          <div class="dropdown-header">
            <div class="dh-name">{{ authStore.user?.name || 'Verified User' }}</div>
            <div class="dh-mobile" v-if="authStore.user?.mobileNumber"> {{ authStore.user.mobileNumber }}</div>
            <span class="dh-badge">{{ authStore.user?.role || 'CITIZEN' }}</span>
          </div>

          <div class="dropdown-actions">
            <router-link
              v-if="authStore.user?.role === 'CITIZEN'"
              to="/citizen/profile"
              class="dropdown-item"
              @click="userMenuOpen = false"
            >
              <span class="di-icon"></span> My Citizen Profile
            </router-link>
            <router-link
              v-if="authStore.user?.role === 'CITIZEN'"
              to="/citizen/emergencies"
              class="dropdown-item"
              @click="userMenuOpen = false"
            >
              <span class="di-icon"></span> My Emergencies
            </router-link>
            <router-link
              v-if="['ADMIN', 'DISPATCHER'].includes(authStore.user?.role)"
              to="/admin/command"
              class="dropdown-item"
              @click="userMenuOpen = false"
            >
              <span class="di-icon"></span> Tactical Command
            </router-link>

            <button class="dropdown-item logout-item" @click="handleLogout">
              <span class="di-icon"></span> Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Sign In Button (When Unauthenticated) -->
      <div v-else class="auth-actions">
        <router-link to="/login" class="nav-signin-btn">
          <span class="di-icon"></span>
          <span>Sign In</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useDisasterStore } from '../../stores/disasterStore';
import { useUiStore } from '../../stores/uiStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const incidentStore = useIncidentStore();
const disasterStore = useDisasterStore();
const uiStore = useUiStore();

const isPublicRoute = computed(() => {
  return route.path === '/' || route.path.startsWith('/login') || route.path === '/workflow' || route.path === '/admin/workflow';
});

const userMenuOpen = ref(false);

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function handleLogout() {
  userMenuOpen.value = false;
  authStore.logout();
  router.push('/');
}

function handleDocumentClick(e) {
  if (!e.target.closest('.user-menu-wrapper')) {
    userMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  if (incidentStore.incidents.length === 0) {
    incidentStore.fetchIncidents();
  }
  if (!disasterStore.shelters || disasterStore.shelters.length === 0) {
    disasterStore.fetchStatus();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});
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

.user-menu-wrapper {
  position: relative;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: rgba(30, 41, 59, 0.7);
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(51, 65, 85, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.user-pill:hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(59, 130, 246, 0.5);
}

.dropdown-caret {
  font-size: 0.55rem;
  color: #94a3b8;
  margin-left: 0.15rem;
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(51, 65, 85, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(59, 130, 246, 0.15);
  z-index: 1100;
  animation: dropdown-fade 0.15s ease-out;
}

@keyframes dropdown-fade {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dh-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f8fafc;
}

.dh-mobile {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.dh-badge {
  font-size: 0.625rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
  margin-top: 0.2rem;
  font-family: var(--font-mono);
}

.dropdown-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  font-size: 0.775rem;
  color: #cbd5e1;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(30, 41, 59, 0.8);
  color: #38bdf8;
}

.logout-item {
  color: #f87171;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  margin-top: 0.25rem;
  padding-top: 0.6rem;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #fca5a5 !important;
}

.di-icon {
  font-size: 0.95rem;
}

.auth-actions {
  display: flex;
  align-items: center;
}

.nav-signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(30, 58, 138, 0.3));
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #93c5fd;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);
}

.nav-signin-btn:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(29, 78, 216, 0.5));
  border-color: #3b82f6;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

/* ─── Tactical Workflow Nav Button ───────────────── */
.nav-workflow-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(129, 140, 248, 0.2));
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-workflow-btn:hover {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(129, 140, 248, 0.35));
  border-color: #38bdf8;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
}

.nav-workflow-btn:active {
  transform: translateY(0);
}

.wf-btn-icon {
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .wf-btn-label {
    display: none;
  }
  .nav-workflow-btn {
    padding: 0.35rem 0.5rem;
  }
}
</style>
