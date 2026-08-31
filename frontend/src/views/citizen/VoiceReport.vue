<template>
  <div class="voice-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2>🎙️ MULTILINGUAL AI VOICE EMERGENCY INTAKE</h2>
        <p>Speak in Tamil, English, Hindi, or Telugu. AI extracts your emergency parameters for review and instant first responder dispatch.</p>
      </div>
      <div class="voice-status">
        <span :class="['dot', isRecording ? 'dot-red-pulse' : 'dot-blue']"></span>
        <span class="status-lbl">{{ isRecording ? 'RECORDING & LISTENING...' : 'MIC READY' }}</span>
      </div>
    </div>

    <!-- Error / Alert Banner -->
    <div v-if="voiceError" class="tactical-card error-banner">
      <div class="err-content">
        <span class="err-icon">⚠️</span>
        <span>{{ voiceError }}</span>
      </div>
      <button class="btn btn-xs btn-ghost" @click="voiceError = ''">Dismiss</button>
    </div>

    <div class="voice-grid">
      <!-- Left Column: Voice / Text Input Section -->
      <div class="tactical-card input-card">
        <!-- Language Selector -->
        <div class="lang-selector">
          <label for="voiceLang">Select Language:</label>
          <select id="voiceLang" v-model="selectedLang" class="lang-select" :disabled="isRecording">
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="en">English (India / US)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
          </select>
        </div>

        <!-- Mode Toggle: Voice Mic vs Type Instead -->
        <div class="mode-tabs">
          <button
            type="button"
            :class="['mode-tab', { active: inputMode === 'voice' }]"
            @click="inputMode = 'voice'"
          >
            🎙️ Speak Emergency
          </button>
          <button
            type="button"
            :class="['mode-tab', { active: inputMode === 'text' }]"
            @click="inputMode = 'text'"
          >
            ⌨️ Type Emergency
          </button>
        </div>

        <!-- Voice Mode -->
        <div v-if="inputMode === 'voice'" class="mic-container">
          <button
            :class="['mic-btn', { recording: isRecording }]"
            @click="toggleRecord"
            :disabled="analyzing"
            id="btn-mic-record"
          >
            <span class="mic-icon">{{ isRecording ? '⏹️' : '🎙️' }}</span>
            <span class="mic-label">
              {{ isRecording ? 'LISTENING... TAP TO FINISH' : analyzing ? 'ANALYZING SPEECH...' : 'TAP TO SPEAK EMERGENCY' }}
            </span>
          </button>
          <span class="mic-hint">Speak clearly: what happened, how many people need help, and your location.</span>
        </div>

        <!-- Text Mode -->
        <div v-else class="text-input-container">
          <label class="field-label">Type your emergency details:</label>
          <textarea
            v-model="transcription"
            class="form-input text-box"
            rows="4"
            placeholder="e.g. Commercial building collapsed near Harbour Road, 4 people trapped under rubble, severe injuries, need ambulance immediately."
          ></textarea>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-2"
            @click="processEmergencyText"
            :disabled="!transcription.trim() || analyzing"
          >
            <span v-if="analyzing" class="spinner-sm"></span>
            <span>{{ analyzing ? 'Extracting Parameters...' : '⚡ Extract Emergency Parameters' }}</span>
          </button>
        </div>

        <!-- Sample Emergency Voice Phrases for Instant Testing -->
        <div class="demo-phrases">
          <span class="demo-title">Or test with a sample voice emergency:</span>
          <div class="phrase-list">
            <button class="phrase-chip" @click="runSampleSpeech('ta')">
              <span class="lang-tag">TA</span> "கட்டடம் இடிந்து 5 பேர் சிக்கியுள்ளனர், துறைமுக சாலையில், அவசரமாக உதவி தேவை!"
            </button>
            <button class="phrase-chip" @click="runSampleSpeech('hi')">
              <span class="lang-tag">HI</span> "यहाँ भीषण आग लगी है और 3 लोग अंदर फंसे हुए हैं, तुरंत एम्बुलेंस भेजिए!"
            </button>
            <button class="phrase-chip" @click="runSampleSpeech('te')">
              <span class="lang-tag">TE</span> "భవనం కూలిపోయింది, 4 వ్యక్తులు శిథిలాల కింద చిక్కుకున్నారు, సహాయం కావాలి!"
            </button>
            <button class="phrase-chip" @click="runSampleSpeech('en')">
              <span class="lang-tag">EN</span> "Chemical factory toxic gas leak near Industrial Gate with severe breathing difficulties!"
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Extraction, Review, Correction & Confirmation -->
      <div class="tactical-card review-card">
        <div class="section-title">
          <span>AI EMERGENCY EXTRACTION & VERIFICATION</span>
          <span v-if="analyzing" class="pulse-tag font-mono">Processing Extraction...</span>
        </div>

        <!-- 1. Processing Loading State -->
        <div v-if="analyzing" class="transcribing-box">
          <div class="spinner-sm"></div>
          <span>Extracting structured emergency parameters, location & triage score...</span>
        </div>

        <!-- 2. Structured Review & Correction Panel -->
        <div v-else-if="transcription || extractionResult" class="structured-review-flow">
          <!-- Step A: We Heard / Transcription Box -->
          <div class="we-heard-card">
            <div class="card-top-line">
              <span class="box-lbl">WE HEARD:</span>
              <button class="btn-toggle-edit" @click="isEditingTranscript = !isEditingTranscript">
                {{ isEditingTranscript ? '✓ Done Editing' : '✏️ Edit Text' }}
              </button>
            </div>

            <textarea
              v-if="isEditingTranscript"
              v-model="transcription"
              class="form-input edit-textarea"
              rows="3"
              @input="debouncedReanalyze"
            ></textarea>
            <p v-else class="heard-text">"{{ transcription }}"</p>
          </div>

          <!-- Step B: Structured Extraction & Correction Form -->
          <div v-if="extractionResult" class="structured-params-card">
            <div class="card-top-line">
              <span class="box-lbl">WE UNDERSTOOD (PLEASE VERIFY):</span>
              <span class="priority-score-badge font-mono">
                Priority: {{ extractionResult.priorityScore || 85 }}/100
              </span>
            </div>

            <!-- AI Extraction Breakdown -->
            <div class="params-grid">
              <!-- Category -->
              <div class="param-box">
                <label class="param-lbl">INCIDENT CATEGORY</label>
                <select v-model="extractionResult.incidentType" class="form-input form-input-sm">
                  <option value="COLLAPSE">🏚️ Structural Collapse</option>
                  <option value="FIRE">🔥 Fire / Explosion</option>
                  <option value="HAZMAT">☣️ Hazmat / Chemical Leak</option>
                  <option value="FLOOD">🌊 Flood / Water Rescue</option>
                  <option value="MEDICAL">🚑 Medical Emergency</option>
                </select>
              </div>

              <!-- Severity -->
              <div class="param-box">
                <label class="param-lbl">OPERATIONAL SEVERITY</label>
                <select v-model="extractionResult.severity" class="form-input form-input-sm">
                  <option value="CRITICAL">🔴 CRITICAL</option>
                  <option value="HIGH">🟡 HIGH</option>
                  <option value="MEDIUM">🔵 MEDIUM</option>
                  <option value="LOW">🟢 LOW</option>
                </select>
              </div>

              <!-- Victim Count -->
              <div class="param-box">
                <label class="param-lbl">PEOPLE AFFECTED</label>
                <input
                  type="number"
                  v-model.number="extractionResult.victimCount"
                  min="1"
                  max="100"
                  class="form-input form-input-sm"
                />
              </div>

              <!-- Voice Emotional Signal -->
              <div class="param-box">
                <label class="param-lbl">VOICE SIGNAL</label>
                <span class="val-distress font-mono text-amber">
                  {{ extractionResult.emotion?.urgency === 'HIGH' ? '⚡ High Distress Detected' : 'Normal Urgency Signal' }}
                </span>
              </div>

              <!-- Location Details -->
              <div class="param-box full">
                <div class="loc-lbl-row">
                  <label class="param-lbl">VERIFY INCIDENT LOCATION</label>
                  <button type="button" class="btn-gps-auto" @click="detectGPS">
                    📍 {{ gpsLocked ? '✓ GPS Locked' : 'Auto-Detect GPS' }}
                  </button>
                </div>
                <input
                  type="text"
                  v-model="incidentLocation"
                  class="form-input form-input-sm"
                  placeholder="e.g. 42 Harbour Road, Sector 4 or Central Market"
                />
              </div>
            </div>

            <!-- Hazard Flags Checkboxes -->
            <div class="hazard-toggles-row">
              <span class="param-lbl">CONFIRM ACTIVE HAZARDS:</span>
              <div class="hazard-checkboxes">
                <label class="hazard-chk">
                  <input type="checkbox" v-model="extractionResult.hasTrapped" />
                  <span>⛓️ People Trapped</span>
                </label>
                <label class="hazard-chk">
                  <input type="checkbox" v-model="extractionResult.hasInjuries" />
                  <span>🩸 Severe Injuries</span>
                </label>
                <label class="hazard-chk">
                  <input type="checkbox" v-model="extractionResult.hasFire" />
                  <span>🔥 Fire / Smoke</span>
                </label>
                <label class="hazard-chk">
                  <input type="checkbox" v-model="extractionResult.hasHazmat" />
                  <span>☣️ Hazmat / Toxic</span>
                </label>
              </div>
            </div>

            <!-- Why Box (AI Explanation) -->
            <div v-if="extractionResult.priorityFactors?.length" class="ai-why-box">
              <span class="why-title font-mono">PRIORITY ASSESSMENT FACTORS:</span>
              <ul class="why-list">
                <li v-for="(factor, idx) in extractionResult.priorityFactors" :key="idx">
                  ✓ {{ factor }}
                </li>
              </ul>
            </div>

            <!-- Step C: Explicit Confirmation & Transmission -->
            <div class="confirm-actions">
              <button
                type="button"
                class="btn btn-emergency-confirm"
                @click="transmitEmergency"
                :disabled="transmitting"
              >
                <span v-if="transmitting" class="spinner-sm"></span>
                <span>{{ transmitting ? 'Transmitting to Dispatch...' : '🚨 CONFIRM & TRANSMIT EMERGENCY' }}</span>
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="resetFlow"
                :disabled="transmitting"
              >
                Cancel / Start Over
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Empty State Awaiting Voice Input -->
        <div v-else class="empty-ai">
          <div class="empty-icon">🎧</div>
          <strong class="empty-title">AWAITING VOICE OR TEXT TRANSMISSION</strong>
          <p class="empty-subtitle">
            Tap the microphone button or type your emergency in your preferred language to generate structured triage.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useIncidentStore } from '../../stores/incidentStore';
import api from '../../services/api';

const router = useRouter();
const incidentStore = useIncidentStore();

const selectedLang = ref('ta');
const inputMode = ref('voice');
const isRecording = ref(false);
const analyzing = ref(false);
const transmitting = ref(false);
const isEditingTranscript = ref(false);
const transcription = ref('');
const extractionResult = ref(null);
const voiceError = ref('');

const incidentLocation = ref('Harbour Road Sector 4');
const gpsCoordinates = ref({ lat: 13.0827, lng: 80.2707 });
const gpsLocked = ref(false);

let recognition = null;
let reanalyzeTimeout = null;

onMounted(() => {
  initSpeechRecognition();
});

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isRecording.value = true;
      voiceError.value = '';
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      transcription.value = text;
      isRecording.value = false;
      analyzeText(text, selectedLang.value);
    };

    recognition.onerror = (event) => {
      isRecording.value = false;
      analyzing.value = false;
      voiceError.value = `Voice recognition error (${event.error}). You can type your emergency using the keyboard tab.`;
    };

    recognition.onend = () => {
      isRecording.value = false;
    };
  }
}

function toggleRecord() {
  if (isRecording.value) {
    if (recognition) recognition.stop();
    isRecording.value = false;
  } else {
    voiceError.value = '';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceError.value = 'Voice speech recognition not natively supported by this browser. You can type your emergency or use sample phrases.';
      return;
    }

    try {
      const langMap = {
        ta: 'ta-IN',
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN'
      };
      recognition.lang = langMap[selectedLang.value] || 'en-IN';
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      voiceError.value = 'Microphone access interrupted. Please check permissions or type below.';
    }
  }
}

function runSampleSpeech(lang) {
  selectedLang.value = lang;
  const samples = {
    ta: 'கட்டடம் இடிந்து 5 பேர் சிக்கியுள்ளனர், துறைமுக சாலையில், அவசரமாக உதவி தேவை!',
    hi: 'यहाँ भीषण आग लगी है और 3 लोग अंदर फंसे हुए हैं, तुरंत एम्बुलेंस भेजिए!',
    te: 'భవనం కూలిపోయింది, 4 వ్యక్తులు శిథిలాల కింద చిక్కుకున్నారు, సహాయం కావాలి!',
    en: 'Chemical factory toxic gas leak near Industrial Gate with severe breathing difficulties!'
  };

  const sampleText = samples[lang] || samples.en;
  transcription.value = sampleText;
  analyzeText(sampleText, lang);
}

function processEmergencyText() {
  if (transcription.value.trim()) {
    analyzeText(transcription.value, selectedLang.value);
  }
}

async function analyzeText(text, lang) {
  analyzing.value = true;
  voiceError.value = '';

  try {
    const res = await api.post('/ai/extract', {
      text: text,
      language: lang
    });

    if (res.data?.data) {
      extractionResult.value = res.data.data;
      if (res.data.data.extractedLocation) {
        incidentLocation.value = res.data.data.extractedLocation;
      }
    }
  } catch (err) {
    console.error('AI Extraction failed', err);
    voiceError.value = 'Automatic AI analysis unavailable. Manual review form loaded so you can continue reporting.';
    // Fallback basic extraction so citizen is NEVER blocked
    extractionResult.value = {
      incidentType: 'COLLAPSE',
      severity: 'CRITICAL',
      victimCount: 1,
      hasTrapped: true,
      hasInjuries: true,
      hasFire: false,
      hasHazmat: false,
      priorityScore: 90,
      priorityFactors: ['Manual emergency dispatch requested']
    };
  } finally {
    analyzing.value = false;
  }
}

function debouncedReanalyze() {
  clearTimeout(reanalyzeTimeout);
  reanalyzeTimeout = setTimeout(() => {
    if (transcription.value.trim().length > 5) {
      analyzeText(transcription.value, selectedLang.value);
    }
  }, 600);
}

function detectGPS() {
  if (!navigator.geolocation) {
    gpsLocked.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsCoordinates.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      gpsLocked.value = true;
      incidentLocation.value = `GPS Locked Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
    },
    (err) => {
      gpsLocked.value = false;
    },
    { timeout: 5000 }
  );
}

async function transmitEmergency() {
  if (!extractionResult.value) return;
  transmitting.value = true;

  try {
    const payload = {
      title: `${extractionResult.value.incidentType} Voice SOS Report`,
      description: transcription.value || 'Multilingual Voice Emergency Report',
      incidentType: extractionResult.value.incidentType,
      victimCount: extractionResult.value.victimCount || 1,
      hasInjuries: !!extractionResult.value.hasInjuries,
      hasTrapped: !!extractionResult.value.hasTrapped,
      hasFire: !!extractionResult.value.hasFire,
      hasHazmat: !!extractionResult.value.hasHazmat,
      address: incidentLocation.value || 'GPS Locked Coordinates',
      latitude: gpsCoordinates.value.lat,
      longitude: gpsCoordinates.value.lng,
      language: selectedLang.value,
      priorityScore: extractionResult.value.priorityScore || 88,
      severity: extractionResult.value.severity || 'HIGH'
    };

    const res = await api.post('/incidents', payload);
    const created = res.data?.data;
    if (created) {
      incidentStore.addOrUpdateIncident(created);
      router.push(`/citizen/emergencies/${created.id}`);
    } else {
      router.push('/citizen/emergencies');
    }
  } catch (err) {
    console.error('Failed to transmit voice incident', err);
    voiceError.value = 'Failed to transmit emergency report. Your inputs have been preserved. Please retry.';
  } finally {
    transmitting.value = false;
  }
}

function resetFlow() {
  transcription.value = '';
  extractionResult.value = null;
  voiceError.value = '';
  isEditingTranscript.value = false;
}
</script>

<style scoped>
.voice-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1040px;
  margin: 0 auto;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.back-link {
  font-size: 0.75rem;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 0.25rem;
}

.back-link:hover {
  text-decoration: underline;
}

.header-card h2 {
  font-size: 1.25rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.voice-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-blue { background: #38bdf8; }
.dot-red-pulse {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
  animation: pulse-dot 1s infinite;
}

.status-lbl {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #cbd5e1;
}

.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 0.65rem 1rem;
  color: #fca5a5;
  font-size: 0.775rem;
}

.err-content { display: flex; align-items: center; gap: 0.4rem; }

.voice-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 1.25rem;
}

.input-card, .review-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.lang-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.lang-selector label {
  color: #cbd5e1;
  font-weight: 600;
}

.lang-select {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  flex-grow: 1;
}

.mode-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.mode-tab {
  padding: 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-tab.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.mic-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
}

.mic-btn {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 3px solid #3b82f6;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.25);
  transition: all 0.2s;
}

.mic-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  transform: scale(1.03);
}

.mic-btn.recording {
  border-color: #ef4444;
  background: linear-gradient(135deg, #7f1d1d, #450a0a);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
  animation: pulse-border 1.2s infinite;
}

.mic-icon { font-size: 2.5rem; }
.mic-label {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #e2e8f0;
  text-align: center;
  padding: 0 0.5rem;
  line-height: 1.2;
}

.mic-hint {
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: center;
  max-width: 320px;
}

.text-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.75rem;
  color: #cbd5e1;
  font-weight: 600;
}

.text-box {
  resize: vertical;
}

/* Demo Phrases */
.demo-phrases {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.75rem;
}

.demo-title {
  font-size: 0.675rem;
  color: #94a3b8;
  font-weight: 600;
}

.phrase-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.phrase-chip {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  text-align: left;
  line-height: 1.3;
  transition: all 0.15s;
}

.phrase-chip:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
}

.lang-tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  background: #0f172a;
  color: #38bdf8;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

/* Review Column */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
}

.pulse-tag { color: #f59e0b; font-size: 0.675rem; }

.transcribing-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.structured-review-flow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.we-heard-card {
  background: #090e1a;
  border: 1px solid #334155;
  padding: 0.85rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card-top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-lbl {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  color: #94a3b8;
  font-weight: 700;
}

.btn-toggle-edit {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.7rem;
  cursor: pointer;
}

.heard-text {
  font-size: 0.85rem;
  color: #f8fafc;
  font-weight: 600;
  line-height: 1.4;
}

.edit-textarea {
  width: 100%;
}

.structured-params-card {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 8px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.priority-score-badge {
  font-size: 0.75rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 800;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.param-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.param-box.full {
  grid-column: span 2;
}

.param-lbl {
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.form-input {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.form-input-sm {
  padding: 0.35rem 0.55rem;
  font-size: 0.775rem;
}

.loc-lbl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-gps-auto {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
}

.val-distress {
  font-size: 0.75rem;
  font-weight: 700;
  padding-top: 0.25rem;
}

.hazard-toggles-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: rgba(9, 14, 26, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
}

.hazard-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.hazard-chk {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  cursor: pointer;
}

.ai-why-box {
  background: rgba(9, 14, 26, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.why-title {
  font-size: 0.65rem;
  color: #38bdf8;
  font-weight: 700;
}

.why-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.7rem;
  color: #94a3b8;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.btn-emergency-confirm {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 2px solid #ef4444;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 800;
  font-family: var(--font-display);
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
  transition: all 0.2s;
}

.btn-emergency-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  transform: translateY(-1px);
}

.empty-ai {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
  gap: 0.5rem;
}

.empty-icon { font-size: 2.5rem; }
.empty-title { font-size: 0.85rem; color: #f1f5f9; font-weight: 700; font-family: var(--font-mono); }
.empty-subtitle { font-size: 0.75rem; color: #94a3b8; max-width: 300px; }

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.font-mono { font-family: var(--font-mono); }
.text-amber { color: #fbbf24; }
.mt-2 { margin-top: 0.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.4); } }
@keyframes pulse-border { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }

@media (max-width: 860px) {
  .voice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
