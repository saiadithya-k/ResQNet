<template>
  <div class="app-layout">
    <!-- Top Tactical Navigation Bar -->
    <AppNavbar />

    <div class="main-body">
      <!-- Role-Based Navigation Sidebar -->
      <AppSidebar />

      <!-- Main Tactical Viewport -->
      <main class="content-viewport">
        <router-view />
      </main>
    </div>

    <!-- Floating Global AI Copilot Assistant -->
    <CopilotChat />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import AppNavbar from './components/common/AppNavbar.vue';
import AppSidebar from './components/common/AppSidebar.vue';
import CopilotChat from './components/ai/CopilotChat.vue';
import { useSocketService } from './services/socketService';

const socket = useSocketService();

onMounted(() => {
  socket.connect();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.content-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  position: relative;
  min-width: 0;
}
</style>
