<template>
  <div class="copilot-container">
    <!-- Toggle Floating Button -->
    <button v-if="!isOpen" class="copilot-fab" @click="isOpen = true">
      <span class="ai-glow"></span>
      <span class="icon">{{ isCitizen ? '🛡️' : '🤖' }}</span>
      <span class="label">{{ isCitizen ? 'SAFETY ASSIST' : 'AI COPILOT' }}</span>
    </button>

    <!-- Expanded Copilot Tactical Console -->
    <div v-else class="copilot-window tactical-card">
      <div class="copilot-header">
        <div class="title-area">
          <span class="status-indicator"></span>
          <h3>{{ isCitizen ? 'ResQ Citizen Safety Assistant' : 'AI Tactical Emergency Copilot' }}</h3>
        </div>
        <button class="close-btn" @click="isOpen = false">✕</button>
      </div>

      <!-- Quick Operational Prompt Suggestions (Role-Adaptive) -->
      <div class="quick-prompts">
        <template v-if="isCitizen">
          <button class="prompt-chip" @click="sendQuery('What is the status of my emergency?')">
            🚨 My Emergency?
          </button>
          <button class="prompt-chip" @click="sendQuery('What public alerts are currently active?')">
            📢 Public Alerts?
          </button>
          <button class="prompt-chip" @click="sendQuery('What is the AI risk forecast in my area?')">
            🔮 Risk Forecast?
          </button>
        </template>
        <template v-else>
          <button class="prompt-chip" @click="sendQuery('Which critical incidents need immediate attention?')">
            🚨 Critical Incidents?
          </button>
          <button class="prompt-chip" @click="sendQuery('Check ICU and Trauma hospital capacity')">
            🏥 Hospital Beds?
          </button>
          <button class="prompt-chip" @click="sendQuery('Detect ambulance shortages in District A')">
            📦 Resource Shortage?
          </button>
        </template>
      </div>

      <!-- Chat Stream -->
      <div class="chat-stream" ref="chatStreamRef">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['chat-bubble', msg.role]">
          <div class="sender-tag">
            {{ msg.role === 'user' ? (isCitizen ? 'CITIZEN' : 'COMMANDER') : (isCitizen ? 'RESQ ASSISTANT' : 'AI COPILOT') }}
          </div>
          <div class="bubble-content">{{ msg.content }}</div>

          <!-- Suggested Actionable Buttons -->
          <div v-if="msg.actions && msg.actions.length > 0" class="actions-container">
            <div class="actions-title">RECOMMENDED ACTIONS:</div>
            <div v-for="(action, aIdx) in msg.actions" :key="aIdx" class="action-item">
              <span>⚡</span> {{ action }}
            </div>
          </div>
        </div>

        <div v-if="loading" class="chat-bubble assistant loading">
          <div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>

      <!-- Input Bar -->
      <form class="copilot-input-form" @submit.prevent="handleSend">
        <input
          type="text"
          v-model="inputQuery"
          :placeholder="isCitizen ? 'Ask about your emergency status, alerts, risk...' : 'Ask Copilot about incidents, resources, routes...'"
          class="copilot-input"
        />
        <button type="submit" class="btn btn-primary btn-sm" :disabled="!inputQuery.trim() || loading">
          Ask
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const authStore = useAuthStore();
const isOpen = ref(false);
const inputQuery = ref('');
const loading = ref(false);
const chatStreamRef = ref(null);

const isCitizen = computed(() => {
  return !authStore.user?.role || authStore.user?.role === 'CITIZEN';
});

const messages = ref([
  {
    role: 'assistant',
    content: isCitizen.value
      ? 'ResQ Citizen Assistant ready. Ask about your reported emergencies, active public alerts, or crisis safety check-ins.'
      : 'Emergency Command Copilot ready. Real-time access to operational incident telemetry and resource coordination.',
    actions: []
  }
]);

async function sendQuery(queryText) {
  if (!queryText) return;
  messages.value.push({ role: 'user', content: queryText });
  inputQuery.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const res = await api.post('/ai/copilot', {
      query: queryText,
      role: authStore.user?.role || 'CITIZEN'
    });
    messages.value.push({
      role: 'assistant',
      content: res.data.data.answer,
      actions: res.data.data.suggestedActions || []
    });
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: 'Could not connect to AI Copilot engine. Please check backend connection.',
      actions: []
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
}

function handleSend() {
  if (!inputQuery.value.trim()) return;
  sendQuery(inputQuery.value.trim());
}

function scrollToBottom() {
  nextTick(() => {
    if (chatStreamRef.value) {
      chatStreamRef.value.scrollTop = chatStreamRef.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
.copilot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
}

.copilot-fab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid #3b82f6;
  color: #60a5fa;
  padding: 0.65rem 1.1rem;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7), 0 0 15px rgba(59, 130, 246, 0.4);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.copilot-fab:hover {
  transform: translateY(-2px);
  border-color: #60a5fa;
}

.copilot-window {
  width: 380px;
  height: 520px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.copilot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.7);
  background: rgba(15, 23, 42, 0.9);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-area h3 {
  font-size: 0.875rem;
  color: #f8fafc;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
}

.quick-prompts {
  display: flex;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
}

.prompt-chip {
  white-space: nowrap;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  color: #cbd5e1;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.prompt-chip:hover {
  border-color: #3b82f6;
  color: #60a5fa;
}

.chat-stream {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-bubble {
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
}

.chat-bubble.user {
  background: rgba(37, 99, 235, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.4);
  align-self: flex-end;
  color: #e2e8f0;
}

.chat-bubble.assistant {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.8);
  align-self: flex-start;
  color: #cbd5e1;
}

.sender-tag {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #64748b;
  margin-bottom: 0.25rem;
}

.actions-container {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
}

.actions-title {
  font-size: 0.65rem;
  font-weight: 700;
  color: #38bdf8;
  font-family: var(--font-mono);
  margin-bottom: 0.25rem;
}

.action-item {
  font-size: 0.7rem;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.2rem;
}

.copilot-input-form {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(51, 65, 85, 0.7);
  background: rgba(15, 23, 42, 0.9);
}

.copilot-input {
  flex: 1;
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: white;
  padding: 0.4rem 0.65rem;
  font-size: 0.8rem;
  outline: none;
}

.copilot-input:focus {
  border-color: #3b82f6;
}
</style>
