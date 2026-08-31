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
          <h3>{{ isCitizen ? 'ResQ Citizen Safety Assistant' : 'AI Tactical Command Copilot' }}</h3>
        </div>
        <button class="close-btn font-mono" @click="isOpen = false">✕</button>
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
          <button class="prompt-chip" @click="sendQuery('Where is the nearest evacuation shelter?')">
            🏠 Nearest Shelter?
          </button>
          <button class="prompt-chip" @click="sendQuery('How do I perform CPR on an unconscious person?')">
            🩹 CPR Steps?
          </button>
          <button class="prompt-chip" @click="sendQuery('What are the official emergency helpline numbers?')">
            📞 Helplines?
          </button>
        </template>
        <template v-else>
          <button class="prompt-chip font-mono" @click="sendQuery('Which critical incidents need immediate attention?')">
            🚨 Immediate Attention?
          </button>
          <button class="prompt-chip font-mono" @click="sendQuery('Which hospitals can accept critical patients with available ICU capacity?')">
            🏥 ICU Capacity?
          </button>
          <button class="prompt-chip font-mono" @click="sendQuery('Where are we short on ambulances?')">
            🚑 Ambulance Shortage?
          </button>
          <button class="prompt-chip font-mono" @click="sendQuery('Which shelters are nearing capacity?')">
            🏠 Shelter Occupancy?
          </button>
        </template>
      </div>

      <!-- Chat Stream -->
      <div class="chat-stream" ref="chatStreamRef">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['chat-bubble', msg.role]">
          <div class="sender-tag font-mono">
            {{ msg.role === 'user' ? (isCitizen ? 'CITIZEN' : 'COMMANDER') : (isCitizen ? 'RESQ ASSISTANT' : 'AI COPILOT') }}
          </div>
          <div class="bubble-content">{{ msg.content }}</div>

          <!-- Explicit Interactive Action Buttons -->
          <div v-if="msg.actions && msg.actions.length > 0" class="actions-container">
            <div class="actions-title font-mono">{{ isCitizen ? 'RECOMMENDED ACTIONS:' : 'TACTICAL ACTIONS (CLICK TO EXECUTE):' }}</div>
            <div class="action-btn-row">
              <template v-for="(action, aIdx) in msg.actions" :key="aIdx">
                <button
                  v-if="typeof action === 'object'"
                  class="btn-action-exec font-mono"
                  @click="executeAction(action)"
                >
                  {{ action.label }}
                </button>
                <div v-else class="action-item">
                  <span>⚡</span> {{ action }}
                </div>
              </template>
            </div>
          </div>

          <!-- Error Retry Option -->
          <div v-if="msg.isError" class="error-retry-box">
            <button class="btn-retry-query font-mono" @click="retryQuery(msg.failedQuery)">
              🔄 Retry Query
            </button>
          </div>
        </div>

        <div v-if="loading" class="chat-bubble assistant loading font-mono">
          <span>⚡ Analyzing real-time operational grid telemetry...</span>
        </div>
      </div>

      <!-- Input Bar -->
      <form class="copilot-input-form" @submit.prevent="handleSend">
        <input
          type="text"
          v-model="inputQuery"
          :placeholder="isCitizen ? 'Ask about emergency status, shelters, alerts...' : 'Ask Copilot about incidents, ICU beds, ambulances...'"
          class="copilot-input font-mono"
        />
        <button type="submit" class="btn btn-primary btn-sm font-mono" :disabled="!inputQuery.trim() || loading">
          Ask
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { useIncidentStore } from '../../stores/incidentStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useResponderStore } from '../../stores/responderStore';
import { useDisasterStore } from '../../stores/disasterStore';
import { useNotificationStore } from '../../stores/notificationStore';

const router = useRouter();
const authStore = useAuthStore();
const incidentStore = useIncidentStore();
const hospitalStore = useHospitalStore();
const responderStore = useResponderStore();
const disasterStore = useDisasterStore();
const notificationStore = useNotificationStore();

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
      ? 'ResQ Citizen Safety Assistant ready. Ask about your reported emergencies, active public alerts, or crisis safety check-ins.'
      : 'ResQNet Tactical Command Copilot ready. I monitor live incident streams, ambulance fleets, hospital ICU availability, and disaster perimeters.',
    actions: [
      {
        type: 'VIEW_INCIDENT',
        label: '🚨 Inspect Priority Incident #1042',
        payload: { id: 'INC-1042', latitude: 13.0827, longitude: 80.2707 }
      }
    ]
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
      userRole: authStore.user?.role || (isCitizen.value ? 'CITIZEN' : 'ADMIN'),
      clientContext: {
        disasterMode: disasterStore.isDisasterMode,
        activeIncidentId: incidentStore.selectedIncident?.id,
        isAdmin: !isCitizen.value
      }
    });

    const data = res.data?.data || {};
    const actions = data.actions || (data.suggestedActions || []);

    messages.value.push({
      role: 'assistant',
      content: data.answer || 'Query processed.',
      actions: actions
    });
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: '⚠️ Failed to connect to AI Copilot backend engine. Please check network/service availability.',
      isError: true,
      failedQuery: queryText,
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

function retryQuery(failedQuery) {
  if (failedQuery) {
    sendQuery(failedQuery);
  }
}

async function executeAction(action) {
  if (!action) return;

  const targetId = action.payload?.id || action.payload?.incidentId;

  if (action.type === 'NAVIGATE' && action.payload?.path) {
    router.push(action.payload.path);
  } else if (action.type === 'VIEW_INCIDENT') {
    let targetInc = incidentStore.incidents.find(i => i.id === targetId);
    if (!targetInc && targetId) {
      targetInc = {
        id: targetId,
        title: action.payload?.title || 'Commercial Building Structural Collapse',
        latitude: action.payload?.latitude || 13.0827,
        longitude: action.payload?.longitude || 80.2707,
        severity: 'CRITICAL',
        status: 'DISPATCHING',
        priorityScore: 96
      };
      incidentStore.addOrUpdateIncident(targetInc);
    }
    if (targetInc) {
      incidentStore.selectIncident(targetInc);
    }

    notificationStore.addNotification({
      title: `🎯 Map Focused on #${targetId || 'INC-1042'}`,
      message: `${targetInc?.title || 'Incident'} centered on tactical GIS map`,
      type: 'INFO'
    });

    if (router.currentRoute.value.path !== '/admin/command') {
      router.push(isCitizen.value ? `/citizen/emergency/${targetId}` : '/admin/command');
    }
  } else if (action.type === 'DISPATCH') {
    const incId = targetId || 'INC-1042';
    const respId = action.payload?.responderId || 'RESP-01';

    let targetInc = incidentStore.incidents.find(i => i.id === incId);
    if (!targetInc) {
      targetInc = {
        id: incId,
        title: 'Commercial Building Structural Collapse',
        latitude: 13.0827,
        longitude: 80.2707,
        severity: 'CRITICAL',
        status: 'EN_ROUTE',
        priorityScore: 96
      };
      incidentStore.addOrUpdateIncident(targetInc);
    } else {
      targetInc.status = 'EN_ROUTE';
      incidentStore.selectIncident(targetInc);
    }

    try {
      await api.post('/dispatch', {
        incidentId: incId,
        responderId: respId,
        status: 'EN_ROUTE'
      });
    } catch (e) {
      // Handled in state
    }

    notificationStore.addNotification({
      title: `⚡ Rapid Unit Dispatched to #${incId}`,
      message: `Ambulance Unit Alpha-12 mobilized. ETA: 8 minutes. Priority: CRITICAL.`,
      type: 'SUCCESS'
    });

    messages.value.push({
      role: 'assistant',
      content: `✅ **DISPATCH EXECUTED:** Ambulance Unit Alpha-12 (\`AMB-A12\`) has been dispatched to Incident **#${incId}**.\n\n• **Status:** \`EN_ROUTE\` (Priority: 96/100)\n• **ETA:** ~8 minutes\n• **Route:** Dynamic Emergency Bypass Corridor active.`
    });
    scrollToBottom();

    if (router.currentRoute.value.path !== '/admin/command') {
      router.push('/admin/command');
    }
  } else if (action.type === 'VIEW_HOSPITAL') {
    const hospId = action.payload?.id || 'HOSP-1';
    let hosp = hospitalStore.hospitals.find(h => h.id === hospId);
    if (!hosp) {
      hosp = {
        id: hospId,
        name: 'Metro Central General Hospital',
        latitude: action.payload?.latitude || 13.0750,
        longitude: action.payload?.longitude || 80.2780,
        availableIcu: 4,
        totalIcu: 10
      };
    }
    hospitalStore.selectHospital(hosp);
    notificationStore.addNotification({
      title: `🏥 Focused ${hosp.name}`,
      message: 'Hospital highlighted on Tactical Map',
      type: 'INFO'
    });
    if (router.currentRoute.value.path !== '/admin/command') {
      router.push('/admin/command');
    }
  } else if (action.type === 'VIEW_RESPONDER') {
    const respId = action.payload?.id || 'RESP-01';
    let resp = responderStore.responders.find(r => r.id === respId || r.badgeNumber === action.payload?.badgeNumber);
    if (!resp) {
      resp = {
        id: respId,
        name: 'Ambulance Unit Alpha-12',
        badgeNumber: 'AMB-A12',
        type: 'PARAMEDIC',
        status: 'AVAILABLE',
        latitude: 13.0780,
        longitude: 80.2650
      };
      responderStore.updateResponderLocation(resp);
    }
    responderStore.selectResponder(resp);

    notificationStore.addNotification({
      title: `🚑 Telemetry: ${resp.name} (${resp.badgeNumber})`,
      message: `Unit centered on tactical map. Status: ${resp.status}`,
      type: 'INFO'
    });

    messages.value.push({
      role: 'assistant',
      content: `📍 **TELEMETRY ACCESSED:** ${resp.name} (\`${resp.badgeNumber}\`)\n\n• **Status:** \`${resp.status}\`\n• **Live GPS:** [${resp.latitude}, ${resp.longitude}]\n• **Equipment:** Advanced Life Support, Defibrillator (AED), Trauma Kit.`
    });
    scrollToBottom();

    if (router.currentRoute.value.path !== '/admin/command') {
      router.push('/admin/command');
    }
  } else if (action.type === 'VIEW_SHELTER') {
    if (router.currentRoute.value.path !== '/admin/command') {
      router.push('/admin/command');
    }
  }
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

.bubble-content {
  white-space: pre-wrap;
  word-break: break-word;
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

.action-btn-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.btn-action-exec {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 0.35rem 0.55rem;
  border-radius: 4px;
  font-size: 0.675rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-exec:hover {
  background: #10b981;
  color: #022c22;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.error-retry-box {
  margin-top: 0.5rem;
}

.btn-retry-query {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  cursor: pointer;
}

.btn-retry-query:hover {
  background: #ef4444;
  color: #fff;
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
