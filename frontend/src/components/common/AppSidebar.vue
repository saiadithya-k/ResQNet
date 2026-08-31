<template>
  <div>
    <!-- Mobile Backdrop Overlay when Sidebar Slid Open -->
    <div
      v-if="uiStore.sidebarOpen"
      class="sidebar-backdrop"
      @click="uiStore.closeSidebarOnMobile"
    ></div>

    <!-- Sliding Role-Specific Sidebar -->
    <aside :class="['tactical-sidebar', { 'sidebar-collapsed': !uiStore.sidebarOpen }, isCitizen ? 'citizen-sidebar-theme' : 'ops-sidebar-theme']">
      <!-- Sidebar Header / Slide Collapse Control -->
      <div class="sidebar-header">
        <span class="header-label">{{ sidebarTitle }}</span>
        <button
          class="slide-btn"
          @click="uiStore.toggleSidebar"
          :title="uiStore.sidebarOpen ? 'Slide Close' : 'Slide Open'"
        >
          {{ uiStore.sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>

      <!-- ================= 1. CITIZEN EXCLUSIVE NAVIGATION ================= -->
      <template v-if="isCitizen">
        <!-- Emergency & Safety -->
        <div class="nav-group">
          <div class="group-title">EMERGENCY & SAFETY</div>
          <router-link to="/citizen" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🏠</span>
            <span class="label">Citizen Dashboard</span>
          </router-link>
          <router-link to="/citizen/report" class="nav-item emergency-highlight" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🚨</span>
            <span class="label">Report Incident</span>
          </router-link>
          <router-link to="/citizen/voice" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🎙️</span>
            <span class="label">Multilingual Voice SOS</span>
          </router-link>
          <router-link to="/citizen/alerts" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📢</span>
            <span class="label">Public Safety Alerts</span>
          </router-link>
        </div>

        <!-- My Safety Circle -->
        <div class="nav-group">
          <div class="group-title">MY SAFETY & TRACKING</div>
          <router-link to="/citizen/emergencies" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📋</span>
            <span class="label">My Emergencies</span>
          </router-link>
          <router-link to="/citizen/family" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">👨‍👩‍👧</span>
            <span class="label">Family Safety Circle</span>
          </router-link>
          <router-link to="/citizen/survivor" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🟢</span>
            <span class="label">Survivor Check-In</span>
          </router-link>
          <router-link to="/citizen/risk" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🔮</span>
            <span class="label">Risk & Hazard Models</span>
          </router-link>
        </div>

        <!-- Account -->
        <div class="nav-group">
          <div class="group-title">ACCOUNT</div>
          <router-link to="/citizen/profile" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">👤</span>
            <span class="label">Citizen Profile</span>
          </router-link>
          <button class="nav-item logout-nav-btn" @click="handleLogout">
            <span class="icon">🚪</span>
            <span class="label">Logout</span>
          </button>
        </div>
      </template>

      <!-- ================= 2. ADMIN / DISPATCHER NAVIGATION ================= -->
      <template v-else-if="isAdminOrDispatcher">
        <!-- Command & Operations -->
        <div class="nav-group">
          <div class="group-title">COMMAND & OPERATIONS</div>
          <router-link to="/admin/command" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🚨</span>
            <span class="label">Command Center</span>
          </router-link>
          <router-link to="/admin/disaster" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🌪️</span>
            <span class="label">Disaster Mode</span>
          </router-link>
          <router-link to="/admin/simulation" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🧪</span>
            <span class="label">Disaster Simulator</span>
          </router-link>
          <router-link to="/admin/analytics" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📊</span>
            <span class="label">Command Analytics</span>
          </router-link>
          <router-link to="/admin/evidence" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🔐</span>
            <span class="label">Evidence Vault (SHA)</span>
          </router-link>
          <router-link to="/admin/audit" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🧾</span>
            <span class="label">Audit Logs</span>
          </router-link>
        </div>

        <!-- Tactical Resource Mesh -->
        <div class="nav-group">
          <div class="group-title">RESOURCE & RESPONSE MESH</div>
          <router-link to="/responder" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🚑</span>
            <span class="label">Responder Units</span>
          </router-link>
          <router-link to="/community" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🧑‍🚒</span>
            <span class="label">Community Mesh</span>
          </router-link>
          <router-link to="/hospital" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🏥</span>
            <span class="label">Hospital Capacity</span>
          </router-link>
        </div>

        <!-- Account -->
        <div class="nav-group">
          <div class="group-title">ACCOUNT</div>
          <button class="nav-item logout-nav-btn" @click="handleLogout">
            <span class="icon">🚪</span>
            <span class="label">Logout</span>
          </button>
        </div>
      </template>

      <!-- ================= 3. RESPONDER NAVIGATION ================= -->
      <template v-else-if="isResponder">
        <div class="nav-group">
          <div class="group-title">FIELD RESPONSE CONSOLE</div>
          <router-link to="/responder" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🚑</span>
            <span class="label">Responder Dashboard</span>
          </router-link>
          <router-link to="/hospital" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🏥</span>
            <span class="label">Hospital Intake Mesh</span>
          </router-link>
          <router-link to="/citizen/alerts" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📢</span>
            <span class="label">Public Safety Alerts</span>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="group-title">ACCOUNT</div>
          <button class="nav-item logout-nav-btn" @click="handleLogout">
            <span class="icon">🚪</span>
            <span class="label">Logout</span>
          </button>
        </div>
      </template>

      <!-- ================= 4. COMMUNITY RESPONDER NAVIGATION ================= -->
      <template v-else-if="isCommunity">
        <div class="nav-group">
          <div class="group-title">COMMUNITY MESH CONSOLE</div>
          <router-link to="/community" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🧑‍🚒</span>
            <span class="label">Community Dashboard</span>
          </router-link>
          <router-link to="/citizen/alerts" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📢</span>
            <span class="label">Public Safety Alerts</span>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="group-title">ACCOUNT</div>
          <button class="nav-item logout-nav-btn" @click="handleLogout">
            <span class="icon">🚪</span>
            <span class="label">Logout</span>
          </button>
        </div>
      </template>

      <!-- ================= 5. HOSPITAL NAVIGATION ================= -->
      <template v-else-if="isHospital">
        <div class="nav-group">
          <div class="group-title">HOSPITAL NETWORK</div>
          <router-link to="/hospital" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">🏥</span>
            <span class="label">Hospital Capacity & Intake</span>
          </router-link>
          <router-link to="/citizen/alerts" class="nav-item" @click="uiStore.closeSidebarOnMobile">
            <span class="icon">📢</span>
            <span class="label">Public Safety Alerts</span>
          </router-link>
        </div>

        <div class="nav-group">
          <div class="group-title">ACCOUNT</div>
          <button class="nav-item logout-nav-btn" @click="handleLogout">
            <span class="icon">🚪</span>
            <span class="label">Logout</span>
          </button>
        </div>
      </template>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter();
const uiStore = useUiStore();
const authStore = useAuthStore();

const userRole = computed(() => (authStore.user?.role || 'CITIZEN').toUpperCase());

const isCitizen = computed(() => userRole.value === 'CITIZEN');
const isAdminOrDispatcher = computed(() => ['ADMIN', 'DISPATCHER'].includes(userRole.value));
const isResponder = computed(() => userRole.value === 'RESPONDER');
const isCommunity = computed(() => userRole.value === 'COMMUNITY_RESPONDER');
const isHospital = computed(() => userRole.value === 'HOSPITAL');

const sidebarTitle = computed(() => {
  if (isCitizen.value) return 'CITIZEN PORTAL';
  if (isAdminOrDispatcher.value) return 'TACTICAL CONSOLE';
  if (isResponder.value) return 'FIELD EMT CONSOLE';
  if (isCommunity.value) return 'COMMUNITY CONSOLE';
  if (isHospital.value) return 'HOSPITAL MESH';
  return 'RESQNET PORTAL';
});

function handleLogout() {
  authStore.logout();
  uiStore.closeSidebarOnMobile();
  router.push('/');
}
</script>

<style scoped>
.sidebar-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sidebar-backdrop {
    display: block;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100vw;
    height: calc(100vh - 64px);
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 899;
  }
}

.tactical-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: rgba(10, 15, 30, 0.92);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(51, 65, 85, 0.6);
  display: flex;
  flex-direction: column;
  padding: 0.875rem 0.75rem 1.5rem 0.75rem;
  gap: 1.25rem;
  overflow-y: auto;
  height: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease, margin-left 0.3s ease;
  z-index: 900;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
}

.tactical-sidebar.sidebar-collapsed {
  transform: translateX(-100%);
  margin-left: -250px;
  width: 0;
  padding-left: 0;
  padding-right: 0;
  border-right-color: transparent;
  pointer-events: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem 0.5rem 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
}

.header-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #3b82f6;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
}

.slide-btn {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #94a3b8;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.slide-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-color: #3b82f6;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-title {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  padding: 0.25rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.825rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: rgba(30, 41, 59, 0.6);
  color: #f8fafc;
  border-color: rgba(59, 130, 246, 0.2);
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.2), rgba(30, 58, 138, 0.1));
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.4);
  font-weight: 600;
}

.nav-item .icon {
  font-size: 1rem;
}

.citizen-sidebar-theme {
  border-right-color: rgba(16, 185, 129, 0.3);
}

.citizen-sidebar-theme .nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.4);
}

.emergency-highlight {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3) !important;
  color: #fca5a5 !important;
}

.emergency-highlight:hover {
  background: rgba(239, 68, 68, 0.25) !important;
  border-color: #ef4444 !important;
  color: #ffffff !important;
}

.logout-nav-btn {
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
  color: #f87171;
}

.logout-nav-btn:hover {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
  color: #fca5a5 !important;
}
</style>
