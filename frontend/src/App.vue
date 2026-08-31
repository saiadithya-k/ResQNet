<template>
  <div class="app-layout">
    <!-- Top Tactical Navigation Bar -->
    <AppNavbar />

    <div class="main-body">
      <!-- Role-Based Navigation Sidebar (Internal screens only) -->
      <AppSidebar v-if="!isPublicRoute" />

      <!-- Main Tactical Viewport -->
      <main :class="['content-viewport', { 'public-viewport': isPublicRoute }]">
        <router-view />
      </main>
    </div>

    <!-- Floating Global AI Copilot Assistant -->
    <CopilotChat />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/common/AppNavbar.vue';
import AppSidebar from './components/common/AppSidebar.vue';
import CopilotChat from './components/ai/CopilotChat.vue';
import { useSocketService } from './services/socketService';

const route = useRoute();
const socket = useSocketService();

const isPublicRoute = computed(() => {
  return route.path === '/' || route.path.startsWith('/login');
});

onMounted(() => {
  socket.connect();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.content-viewport {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.25rem;
  position: relative;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.public-viewport {
  padding: 0;
}
</style>
