<template>
  <div class="voice-view">
    <div class="header-card tactical-card">
      <h2>🎙️ MULTILINGUAL VOICE EMERGENCY (SOS)</h2>
      <p>Report emergencies hands-free in Tamil, Hindi, Telugu, or English. AI automatically extracts location, victims, and emotional urgency.</p>
    </div>

    <div class="voice-grid">
      <!-- Voice Audio Trigger Section -->
      <div class="tactical-card trigger-card">
        <div class="lang-selector">
          <label>Language:</label>
          <select v-model="selectedLang" class="lang-select">
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
        </div>

        <div class="mic-container">
          <button :class="['mic-btn', { recording: isRecording }]" @click="toggleRecord">
            <span class="mic-icon">🎙️</span>
            <span class="mic-label">{{ isRecording ? 'LISTENING & STREAMING...' : 'TAP TO SPEAK EMERGENCY' }}</span>
          </button>
        </div>

        <div class="demo-phrases">
          <span class="demo-title">Or click sample speech in Tamil:</span>
          <button class="phrase-chip" @click="loadSampleTamil">
            "கட்டடம் இடிந்து ஐந்து பேர் சிக்கியுள்ளனர்" (Building collapsed, 5 trapped)
          </button>
        </div>
      </div>

      <!-- Real-Time AI Extraction Stream -->
      <div class="tactical-card stream-card">
        <div class="stream-title">AI EMERGENCY PARSING PIPELINE</div>

        <div v-if="transcription" class="transcription-box">
          <label>Recognized Speech Transcript:</label>
          <p class="transcript-text">"{{ transcription }}"</p>
        </div>

        <div v-if="extractionResult" class="extraction-card">
          <div class="ext-header">
            <span class="badge badge-critical">{{ extractionResult.incidentType }}</span>
            <span class="ext-priority">Priority: {{ extractionResult.priorityScore }}/100</span>
          </div>

          <div class="ext-grid">
            <div><strong>Severity:</strong> {{ extractionResult.severity }}</div>
            <div><strong>Victims:</strong> {{ extractionResult.victimCount }}</div>
            <div><strong>Trapped:</strong> {{ extractionResult.hasTrapped ? 'YES' : 'NO' }}</div>
            <div><strong>Emotional Urgency:</strong> {{ extractionResult.emotion.urgency }} ({{ extractionResult.emotion.state }})</div>
          </div>

          <button class="btn btn-danger btn-block" @click="transmitFromVoice">
            🚨 Transmit Enriched Emergency to Command Center
          </button>
        </div>

        <div v-else class="empty-ai">
          Awaiting voice stream input...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api';

const router = useRouter();
const selectedLang = ref('ta');
const isRecording = ref(false);
const transcription = ref('');
const extractionResult = ref(null);

function toggleRecord() {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    setTimeout(() => {
      loadSampleTamil();
      isRecording.value = false;
    }, 2000);
  }
}

async function loadSampleTamil() {
  transcription.value = 'கட்டடம் இடிந்து ஐந்து பேர் சிக்கியுள்ளனர், அவசரமாக உதவி தேவை!';
  try {
    const res = await api.post('/ai/extract', {
      text: 'Building collapsed, five people are trapped, urgent help needed!',
      language: 'ta'
    });
    extractionResult.value = res.data.data;
  } catch (err) {
    console.error('Extraction failed', err);
  }
}

async function transmitFromVoice() {
  if (!extractionResult.value) return;
  await api.post('/incidents', {
    title: 'Harbour Structural Collapse (Voice Report)',
    description: transcription.value,
    incidentType: extractionResult.value.incidentType,
    victimCount: extractionResult.value.victimCount,
    address: 'Near Harbour Sector 4',
    language: selectedLang.value
  });
  alert('✅ Voice Emergency Transmitted & Priority AI Score Dispatched!');
  router.push('/admin/command');
}
</script>

<style scoped>
.voice-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header-card {
  padding: 1.25rem;
}

.header-card h2 {
  font-size: 1.2rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.voice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.trigger-card, .stream-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.lang-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.lang-select {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
}

.mic-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.mic-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 3px solid #ef4444;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
  transition: all 0.2s;
}

.mic-btn.recording {
  border-color: #f59e0b;
  animation: pulse-border 1s infinite;
}

.mic-icon {
  font-size: 3rem;
}

.mic-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #fca5a5;
  text-align: center;
  padding: 0 0.5rem;
}

.demo-phrases {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.demo-title {
  font-size: 0.7rem;
  color: #94a3b8;
}

.phrase-chip {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
}

.phrase-chip:hover {
  border-color: #3b82f6;
}

.stream-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.transcription-box {
  background: #090e1a;
  border: 1px solid #334155;
  padding: 0.75rem;
  border-radius: 8px;
}

.transcription-box label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.transcript-text {
  font-size: 0.85rem;
  color: #f8fafc;
  font-weight: 600;
  margin-top: 0.25rem;
}

.extraction-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.ext-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ext-priority {
  font-family: var(--font-mono);
  color: #f87171;
  font-weight: 700;
}

.ext-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #cbd5e1;
}

.btn-block {
  width: 100%;
}
</style>
