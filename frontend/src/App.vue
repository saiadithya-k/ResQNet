<template>
  <div class="app-layout">
    <!-- Top Tactical Navigation Bar -->
    <AppNavbar />

    <div class="main-body">
      <!-- Role-Based Navigation Sidebar (Hidden on landing, login, and full-screen workflow) -->
      <AppSidebar v-if="!isPublicRoute && !isWorkflowRoute" />

      <!-- Main Tactical Viewport -->
      <main
        ref="viewportRef"
        :class="['content-viewport', { 'public-viewport': isPublicRoute, 'workflow-viewport': isWorkflowRoute }]"
      >
        <router-view />
      </main>
    </div>

    <!-- Floating Global AI Copilot Assistant (Hidden on full-screen workflow canvas) -->
    <CopilotChat v-if="!isWorkflowRoute" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from './components/common/AppNavbar.vue';
import AppSidebar from './components/common/AppSidebar.vue';
import CopilotChat from './components/ai/CopilotChat.vue';
import { useSocketService } from './services/socketService';

const route = useRoute();
const socket = useSocketService();
const viewportRef = ref(null);

const isWorkflowRoute = computed(() => {
  return route.path === '/workflow' || route.path === '/admin/workflow';
});

const isPublicRoute = computed(() => {
  return route.path === '/' || route.path.startsWith('/login') || isWorkflowRoute.value;
});

function scrollToTop() {
  if (viewportRef.value) {
    viewportRef.value.scrollTop = 0;
    viewportRef.value.scrollLeft = 0;
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

// Reset scroll to top on every route transition
watch(() => route.path, () => {
  scrollToTop();
  nextTick(() => {
    scrollToTop();
  });
  setTimeout(scrollToTop, 50);
  setTimeout(scrollToTop, 200);
  setTimeout(scrollToTop, 500);
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

.workflow-viewport {
  padding: 0 !important;
  height: 100% !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}
</style>
