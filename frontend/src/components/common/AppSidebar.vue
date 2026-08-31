<template>
  <div>
    <!-- Mobile Backdrop Overlay when Sidebar Slid Open -->
    <div
      v-if="uiStore.sidebarOpen"
      class="sidebar-backdrop"
      @click="uiStore.closeSidebarOnMobile"
    ></div>

    <!-- Sliding Tactical Sidebar -->
    <aside :class="['tactical-sidebar', { 'sidebar-collapsed': !uiStore.sidebarOpen }]">
      <!-- Sidebar Header / Slide Collapse Control -->
      <div class="sidebar-header">
        <span class="header-label">TACTICAL CONSOLE</span>
        <button
          class="slide-btn"
          @click="uiStore.toggleSidebar"
          :title="uiStore.sidebarOpen ? 'Slide Close' : 'Slide Open'"
        >
          {{ uiStore.sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>

      <!-- Command & GIS (Team 3) -->
      <div class="nav-group">
        <div class="group-title">COMMAND & GIS (TEAM 3)</div>
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

      <!-- Citizen & AI (Team 1) -->
      <div class="nav-group">
        <div class="group-title">CITIZEN & AI (TEAM 1)</div>
        <router-link to="/citizen" class="nav-item" @click="uiStore.closeSidebarOnMobile">
          <span class="icon">👤</span>
          <span class="label">Citizen Portal</span>
        </router-link>
        <router-link to="/citizen/report" class="nav-item" @click="uiStore.closeSidebarOnMobile">
          <span class="icon">📝</span>
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
        <router-link to="/citizen/emergencies" class="nav-item" @click="uiStore.closeSidebarOnMobile">
          <span class="icon">📋</span>
          <span class="label">My Emergencies</span>
        </router-link>
      </div>

      <!-- Response & Hospital (Team 2) -->
      <div class="nav-group">
        <div class="group-title">RESPONSE & HOSPITAL (TEAM 2)</div>
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
    </aside>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/uiStore';

const uiStore = useUiStore();
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
</style>
