<template>
  <div class="report-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2>📝 FILE EMERGENCY REPORT</h2>
        <p>Your transmission is analyzed in real-time by the AI Emergency Intelligence Pipeline for priority dispatch.</p>
      </div>
      <div class="status-indicator">
        <span class="live-dot"></span>
        <span class="status-text">DISPATCH CHANNELS ACTIVE</span>
      </div>
    </div>

    <!-- Success Confirmation View -->
    <div v-if="submissionSuccess" class="tactical-card success-panel">
      <div class="success-icon">✅</div>
      <h3>EMERGENCY TRANSMITTED & PRIORITIZED</h3>
      <p class="success-desc">
        Your emergency report has been logged and broadcasted to the Command Center and nearest first responders.
      </p>

      <div class="incident-summary-card">
        <div class="summary-row">
          <span class="lbl">INCIDENT ID:</span>
          <span class="val font-mono">{{ submittedIncident?.id || 'INC-CONFIRMED' }}</span>
        </div>
        <div class="summary-row">
          <span class="lbl">EMERGENCY TYPE:</span>
          <span class="val">{{ submittedIncident?.incidentType }}</span>
        </div>
        <div class="summary-row">
          <span class="lbl">INITIAL SEVERITY:</span>
          <span class="val text-red font-bold">{{ submittedIncident?.severity || 'HIGH' }}</span>
        </div>
        <div class="summary-row">
          <span class="lbl">AI PRIORITY SCORE:</span>
          <span class="val text-amber font-mono font-bold">{{ submittedIncident?.priorityScore || '88' }}/100</span>
        </div>
        <div class="summary-row">
          <span class="lbl">LOCATION:</span>
          <span class="val">{{ submittedIncident?.address }}</span>
        </div>
        <div v-if="submittedIncident?.evidenceFiles?.length" class="summary-row">
          <span class="lbl">SEALED EVIDENCE:</span>
          <span class="val text-emerald font-bold">
            ✓ {{ submittedIncident.evidenceFiles.length }} File(s) (SHA-256 Chain of Custody)
          </span>
        </div>
      </div>

      <div class="success-actions">
        <router-link to="/citizen" class="btn btn-primary">
          View in My Emergencies
        </router-link>
        <button class="btn btn-ghost" @click="resetForm">
          Report Another Incident
        </button>
      </div>
    </div>

    <!-- Review & Confirmation Step (Step 2) -->
    <div v-else-if="isReviewing" class="tactical-card form-panel">
      <div class="panel-header-review">
        <div class="panel-title">
          <span class="dot-amber"></span>
          <h3>CONFIRM & REVIEW EMERGENCY REPORT</h3>
        </div>
        <span class="step-badge">STEP 2 OF 2: VERIFICATION</span>
      </div>

      <p class="review-intro">
        Please review your emergency details and attached evidence before final transmission to the Command Center.
      </p>

      <!-- Review Summary Grid -->
      <div class="review-summary-grid">
        <div class="review-item">
          <span class="rev-lbl">CATEGORY & TITLE</span>
          <strong class="rev-val">{{ form.incidentType }} — {{ form.title }}</strong>
        </div>
        <div class="review-item">
          <span class="rev-lbl">LOCATION</span>
          <span class="rev-val">📍 {{ form.address }} ({{ form.latitude.toFixed(4) }}, {{ form.longitude.toFixed(4) }})</span>
        </div>
        <div class="review-item full-width">
          <span class="rev-lbl">SCENE DESCRIPTION</span>
          <p class="rev-desc">"{{ form.description }}"</p>
        </div>
        <div class="review-item">
          <span class="rev-lbl">VICTIMS & VULNERABILITIES</span>
          <span class="rev-val">
            👥 {{ form.victimCount }} Victim(s)
            <span v-if="form.vulnerableGroups.length"> · ({{ form.vulnerableGroups.join(', ') }})</span>
          </span>
        </div>
        <div class="review-item">
          <span class="rev-lbl">HAZARD CONDITIONS</span>
          <div class="hazard-summary-tags">
            <span v-if="form.hasInjuries" class="badge-tag red">🩸 Injuries</span>
            <span v-if="form.hasTrapped" class="badge-tag red">⛓️ Trapped</span>
            <span v-if="form.hasFire" class="badge-tag amber">🔥 Fire/Smoke</span>
            <span v-if="form.hasHazmat" class="badge-tag amber">☣️ Hazmat</span>
            <span v-if="!form.hasInjuries && !form.hasTrapped && !form.hasFire && !form.hasHazmat" class="text-muted text-xs">None flagged</span>
          </div>
        </div>
      </div>

      <!-- Attached Evidence Review -->
      <div class="review-evidence-section">
        <div class="rev-lbl mb-2">ATTACHED EMERGENCY EVIDENCE ({{ evidenceList.length }})</div>
        <div v-if="evidenceList.length === 0" class="no-evidence-note">
          No media files attached. Emergency will be dispatched based on text/GPS data.
        </div>
        <div v-else class="evidence-review-list">
          <div v-for="item in evidenceList" :key="item.id" class="evidence-review-item">
            <div class="ev-rev-left">
              <span class="ev-rev-icon">{{ getMediaIcon(item.fileType) }}</span>
              <div class="ev-rev-info">
                <strong>{{ item.fileName }}</strong>
                <span>{{ item.fileSize }} · {{ item.fileType.toUpperCase() }}</span>
              </div>
            </div>
            <div class="ev-rev-right">
              <span v-if="item.uploadStatus === 'UPLOADED'" class="seal-badge">
                ✓ SHA-256 SEALED
              </span>
              <span v-else-if="item.uploadStatus === 'UPLOADING'" class="uploading-badge">
                UPLOADING...
              </span>
              <span v-else class="pending-badge">
                READY
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message during submission -->
      <div v-if="errorMessage" class="error-banner mt-3">
        <div class="err-content">
          <span class="err-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
        <button class="btn btn-xs btn-ghost" @click="errorMessage = ''">Dismiss</button>
      </div>

      <!-- Review Action Buttons -->
      <div class="review-actions">
        <button
          type="button"
          class="btn btn-emergency-submit"
          @click="submitReport"
          :disabled="submitting || isAnyFileUploading"
        >
          <span v-if="submitting" class="spinner-sm"></span>
          <span>{{ submitting ? 'Transmitting to Command Center...' : '🚨 TRANSMIT EMERGENCY REPORT' }}</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost"
          @click="isReviewing = false"
          :disabled="submitting"
        >
          ✏️ Edit Report Details
        </button>
      </div>
    </div>

    <!-- Main Reporting Form (Step 1) -->
    <div v-else class="tactical-card form-panel">
      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner">
        <div class="err-content">
          <span class="err-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>
        <button class="btn btn-xs btn-ghost" @click="errorMessage = ''">Dismiss</button>
      </div>

      <form @submit.prevent="proceedToReview" class="report-form">
        <!-- Row 1: Emergency Type & Title -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label for="incidentType">Emergency Category <span class="req">*</span></label>
            <select id="incidentType" v-model="form.incidentType" class="form-input" required>
              <option value="COLLAPSE">🏚️ Structural Collapse / Trapped</option>
              <option value="FIRE">🔥 Fire & Active Smoke</option>
              <option value="HAZMAT">☣️ Toxic Chemical / Gas Leak</option>
              <option value="FLOOD">🌊 Flash Flood / Inundation</option>
              <option value="MEDICAL">🚑 Critical Medical / Trauma</option>
              <option value="EXPLOSION">💥 Explosion / Blast</option>
              <option value="ELECTRICAL">⚡ Electrical Hazard / Power Surge</option>
            </select>
          </div>

          <div class="form-group flex-2">
            <label for="title">Emergency Title / Brief Summary <span class="req">*</span></label>
            <input
              id="title"
              type="text"
              v-model="form.title"
              class="form-input"
              placeholder="e.g. 2nd floor balcony collapse with trapped workers"
              required
            />
          </div>
        </div>

        <!-- Row 2: Location & GPS Auto-detection -->
        <div class="form-group">
          <div class="label-with-action">
            <label for="address">Incident Location / Landmark <span class="req">*</span></label>
            <button
              type="button"
              class="btn-detect-gps"
              @click="detectGPSLocation"
              :disabled="detectingLocation"
            >
              <span>📍</span>
              <span>{{ detectingLocation ? 'Detecting GPS...' : locationLocked ? '✓ GPS Locked' : 'Auto-Detect GPS Location' }}</span>
            </button>
          </div>
          <input
            id="address"
            type="text"
            v-model="form.address"
            class="form-input"
            placeholder="e.g. Near Harbour Gate 4, Sector 12"
            required
          />
          <div class="location-meta" v-if="form.latitude && form.longitude">
            <span class="coord-tag">GPS: {{ form.latitude.toFixed(4) }}, {{ form.longitude.toFixed(4) }}</span>
            <span v-if="locationError" class="coord-warn">{{ locationError }}</span>
          </div>
        </div>

        <!-- Row 3: Scene Description -->
        <div class="form-group">
          <label for="description">Emergency Description & Scene Details <span class="req">*</span></label>
          <textarea
            id="description"
            v-model="form.description"
            class="form-textarea"
            rows="4"
            placeholder="Describe what is happening: fire intensity, injured individuals, smoke colour, obstacles, structural damage..."
            required
          ></textarea>
        </div>

        <!-- Row 4: Victim Count & Vulnerable Groups -->
        <div class="form-row">
          <div class="form-group">
            <label for="victimCount">Estimated Victims / People in Danger <span class="req">*</span></label>
            <input
              id="victimCount"
              type="number"
              v-model.number="form.victimCount"
              min="1"
              max="999"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label>Vulnerable Populations Present</label>
            <div class="checkbox-pills">
              <label :class="['pill-check', { active: form.vulnerableGroups.includes('Children') }]">
                <input type="checkbox" value="Children" v-model="form.vulnerableGroups" />
                <span>👶 Children</span>
              </label>
              <label :class="['pill-check', { active: form.vulnerableGroups.includes('Elderly') }]">
                <input type="checkbox" value="Elderly" v-model="form.vulnerableGroups" />
                <span>👴 Elderly</span>
              </label>
              <label :class="['pill-check', { active: form.vulnerableGroups.includes('Pregnant') }]">
                <input type="checkbox" value="Pregnant" v-model="form.vulnerableGroups" />
                <span>🤰 Pregnant</span>
              </label>
              <label :class="['pill-check', { active: form.vulnerableGroups.includes('Disabled') }]">
                <input type="checkbox" value="Disabled" v-model="form.vulnerableGroups" />
                <span>♿ Disabled</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Row 5: Immediate Hazard Flags -->
        <div class="form-group">
          <label>Immediate Hazard Observations</label>
          <div class="hazard-toggles">
            <label :class="['toggle-pill', { active: form.hasInjuries }]">
              <input type="checkbox" v-model="form.hasInjuries" />
              <span>🩸 Severe Injuries / Bleeding</span>
            </label>
            <label :class="['toggle-pill', { active: form.hasTrapped }]">
              <input type="checkbox" v-model="form.hasTrapped" />
              <span>⛓️ People Trapped / Stranded</span>
            </label>
            <label :class="['toggle-pill', { active: form.hasFire }]">
              <input type="checkbox" v-model="form.hasFire" />
              <span>🔥 Active Fire / Toxic Smoke</span>
            </label>
            <label :class="['toggle-pill', { active: form.hasHazmat }]">
              <input type="checkbox" v-model="form.hasHazmat" />
              <span>☣️ Chemical / Gas Smell</span>
            </label>
          </div>
        </div>

        <!-- Row 6: EMERGENCY EVIDENCE & MEDIA ATTACHMENTS (Phase 2) -->
        <div class="evidence-upload-section">
          <div class="evidence-header">
            <div>
              <label class="section-heading">EMERGENCY EVIDENCE (OPTIONAL)</label>
              <p class="evidence-subtext">Attach photos, videos, or audio from the scene to assist responders. Files are SHA-256 sealed.</p>
            </div>
          </div>

          <!-- Upload Trigger Buttons -->
          <div class="media-trigger-buttons">
            <button
              type="button"
              class="btn-media-action"
              @click="triggerFileInput('photo')"
            >
              <span class="media-btn-icon">📷</span>
              <div class="media-btn-text">
                <strong>ATTACH PHOTO</strong>
                <span>JPG, PNG, WEBP (Max 15MB)</span>
              </div>
            </button>

            <button
              type="button"
              class="btn-media-action"
              @click="triggerFileInput('video')"
            >
              <span class="media-btn-icon">🎥</span>
              <div class="media-btn-text">
                <strong>ATTACH VIDEO</strong>
                <span>MP4, WEBM, MOV (Max 50MB)</span>
              </div>
            </button>

            <button
              type="button"
              class="btn-media-action"
              @click="triggerFileInput('audio')"
            >
              <span class="media-btn-icon">🎙️</span>
              <div class="media-btn-text">
                <strong>ATTACH AUDIO</strong>
                <span>MP3, WAV, M4A (Max 20MB)</span>
              </div>
            </button>
          </div>

          <!-- Hidden Native File Inputs -->
          <input
            ref="photoInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            class="hidden-file-input"
            @change="handleFileSelected($event, 'image')"
          />
          <input
            ref="videoInputRef"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            class="hidden-file-input"
            @change="handleFileSelected($event, 'video')"
          />
          <input
            ref="audioInputRef"
            type="file"
            accept="audio/mpeg,audio/wav,audio/m4a,audio/ogg,audio/mp3,audio/webm"
            class="hidden-file-input"
            @change="handleFileSelected($event, 'audio')"
          />

          <!-- Media Validation Warning -->
          <div v-if="mediaValidationError" class="media-val-err">
            <span>⚠️ {{ mediaValidationError }}</span>
            <button type="button" class="btn-clear-err" @click="mediaValidationError = ''">Dismiss</button>
          </div>

          <!-- Attached Evidence Previews Grid -->
          <div v-if="evidenceList.length > 0" class="evidence-grid">
            <div
              v-for="(item, index) in evidenceList"
              :key="item.id"
              class="evidence-card"
            >
              <!-- Media Thumbnail/Preview Area -->
              <div class="media-preview-area">
                <!-- Image Preview -->
                <img
                  v-if="item.fileType === 'image'"
                  :src="item.previewUrl"
                  :alt="item.fileName"
                  class="preview-img"
                />

                <!-- Video Preview -->
                <video
                  v-else-if="item.fileType === 'video'"
                  :src="item.previewUrl"
                  class="preview-video"
                  controls
                  preload="metadata"
                ></video>

                <!-- Audio Preview -->
                <div v-else-if="item.fileType === 'audio'" class="preview-audio-container">
                  <span class="audio-icon">🎧</span>
                  <audio :src="item.previewUrl" controls class="preview-audio-player"></audio>
                </div>
              </div>

              <!-- Media Info & Status -->
              <div class="media-meta-card">
                <div class="media-title-row">
                  <span class="media-name" :title="item.fileName">{{ item.fileName }}</span>
                  <button
                    type="button"
                    class="btn-remove-media"
                    @click="removeEvidence(index)"
                    title="Remove File"
                  >
                    ✕
                  </button>
                </div>

                <div class="media-submeta">
                  <span>{{ item.fileSize }}</span>
                  <span class="media-type-pill">{{ item.fileType.toUpperCase() }}</span>
                </div>

                <!-- Upload Progress / Status -->
                <div class="upload-status-row">
                  <div v-if="item.uploadStatus === 'UPLOADING'" class="progress-container">
                    <div class="progress-bar" :style="{ width: item.uploadProgress + '%' }"></div>
                    <span class="progress-lbl">Uploading {{ item.uploadProgress }}%</span>
                  </div>

                  <span v-else-if="item.uploadStatus === 'UPLOADED'" class="status-uploaded">
                    ✓ Sealed (SHA-256)
                  </span>

                  <div v-else-if="item.uploadStatus === 'FAILED'" class="status-failed">
                    <span>Upload Failed</span>
                    <button type="button" class="btn-retry-file" @click="retryUpload(item)">Retry</button>
                  </div>

                  <span v-else class="status-ready">
                    Ready to attach
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-emergency-submit"
            :disabled="isAnyFileUploading"
          >
            <span>🚨 Review & Transmit Emergency Report →</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useIncidentStore } from '../../stores/incidentStore';
import api from '../../services/api';

const incidentStore = useIncidentStore();

const photoInputRef = ref(null);
const videoInputRef = ref(null);
const audioInputRef = ref(null);

const submitting = ref(false);
const detectingLocation = ref(false);
const locationLocked = ref(false);
const locationError = ref('');
const errorMessage = ref('');
const mediaValidationError = ref('');
const isReviewing = ref(false);
const submissionSuccess = ref(false);
const submittedIncident = ref(null);

// Evidence list state
const evidenceList = ref([]);

const form = reactive({
  title: '',
  incidentType: 'COLLAPSE',
  description: '',
  address: '',
  victimCount: 1,
  latitude: 13.0827,
  longitude: 80.2707,
  hasInjuries: true,
  hasTrapped: false,
  hasFire: false,
  hasHazmat: false,
  vulnerableGroups: []
});

const isAnyFileUploading = computed(() => {
  return evidenceList.value.some(e => e.uploadStatus === 'UPLOADING');
});

function triggerFileInput(type) {
  mediaValidationError.value = '';
  if (type === 'photo' && photoInputRef.value) photoInputRef.value.click();
  if (type === 'video' && videoInputRef.value) videoInputRef.value.click();
  if (type === 'audio' && audioInputRef.value) audioInputRef.value.click();
}

function handleFileSelected(event, fileCategory) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

  for (const file of files) {
    let maxSize = MAX_PHOTO_SIZE;
    if (fileCategory === 'video') maxSize = MAX_VIDEO_SIZE;
    if (fileCategory === 'audio') maxSize = MAX_AUDIO_SIZE;

    // Validation: File Size
    if (file.size > maxSize) {
      mediaValidationError.value = `File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is ${maxSize / (1024 * 1024)} MB.`;
      continue;
    }

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const evidenceItem = reactive({
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      file,
      fileName: file.name,
      fileSize: formattedSize,
      fileType: fileCategory,
      previewUrl: URL.createObjectURL(file),
      uploadProgress: 0,
      uploadStatus: 'SELECTED',
      sha256Hash: '',
      serverUrl: '',
      error: ''
    });

    evidenceList.value.push(evidenceItem);
    uploadEvidenceFile(evidenceItem);
  }

  // Reset file input value so same file can be selected if needed
  event.target.value = '';
}

async function uploadEvidenceFile(item) {
  item.uploadStatus = 'UPLOADING';
  item.uploadProgress = 0;
  item.error = '';

  const formData = new FormData();
  formData.append('file', item.file);
  formData.append('fileType', item.fileType);

  try {
    const res = await api.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          item.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      }
    });

    if (res.data?.data) {
      item.uploadStatus = 'UPLOADED';
      item.uploadProgress = 100;
      item.sha256Hash = res.data.data.sha256Hash;
      item.serverUrl = res.data.data.url;
      item.id = res.data.data.id || item.id;
    } else {
      item.uploadStatus = 'UPLOADED';
    }
  } catch (err) {
    console.error('Evidence upload failed', err);
    item.uploadStatus = 'FAILED';
    item.error = 'Network or server error during upload';
  }
}

function retryUpload(item) {
  uploadEvidenceFile(item);
}

function removeEvidence(index) {
  const item = evidenceList.value[index];
  if (item?.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  evidenceList.value.splice(index, 1);
}

function getMediaIcon(type) {
  if (type === 'image') return '📷';
  if (type === 'video') return '🎥';
  if (type === 'audio') return '🎙️';
  return '📁';
}

function detectGPSLocation() {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation is not supported by your browser. Please enter location manually.';
    return;
  }

  detectingLocation.value = true;
  locationError.value = '';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitude = pos.coords.latitude;
      form.longitude = pos.coords.longitude;
      locationLocked.value = true;
      detectingLocation.value = false;
      if (!form.address) {
        form.address = `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
      }
    },
    (err) => {
      detectingLocation.value = false;
      locationLocked.value = false;
      locationError.value = 'Unable to detect GPS position. You can manually enter the address above.';
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function proceedToReview() {
  if (!form.title || !form.description || !form.address) {
    errorMessage.value = 'Please fill in all required fields marked with *.';
    return;
  }
  errorMessage.value = '';
  isReviewing.value = true;
}

async function submitReport() {
  submitting.value = true;
  errorMessage.value = '';

  try {
    const payload = {
      title: form.title,
      description: form.description,
      incidentType: form.incidentType,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      victimCount: form.victimCount,
      hasInjuries: form.hasInjuries,
      hasTrapped: form.hasTrapped,
      hasFire: form.hasFire,
      hasHazmat: form.hasHazmat,
      vulnerableGroups: form.vulnerableGroups,
      evidenceFiles: evidenceList.value.map(e => ({
        id: e.id,
        fileName: e.fileName,
        fileSize: e.fileSize,
        fileType: e.fileType,
        url: e.serverUrl || e.previewUrl,
        sha256Hash: e.sha256Hash || 'sealed-client-hash',
        status: e.uploadStatus === 'UPLOADED' ? 'VERIFIED' : 'PENDING'
      }))
    };

    const res = await api.post('/incidents', payload);
    const incidentData = res.data.data;
    
    // Add to incident store
    if (incidentData) {
      incidentStore.addOrUpdateIncident(incidentData);
      submittedIncident.value = incidentData;
    }

    isReviewing.value = false;
    submissionSuccess.value = true;
  } catch (err) {
    console.error('Failed to submit incident', err);
    errorMessage.value = 'Emergency transmission failed. Your report is preserved on this screen. Click retry.';
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  form.title = '';
  form.incidentType = 'COLLAPSE';
  form.description = '';
  form.address = '';
  form.victimCount = 1;
  form.hasInjuries = false;
  form.hasTrapped = false;
  form.hasFire = false;
  form.hasHazmat = false;
  form.vulnerableGroups = [];
  evidenceList.value = [];
  isReviewing.value = false;
  submissionSuccess.value = false;
  submittedIncident.value = null;
  errorMessage.value = '';
  mediaValidationError.value = '';
}
</script>

<style scoped>
.report-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 880px;
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

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.status-text {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #34d399;
}

.form-panel {
  padding: 1.75rem;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.775rem;
  color: #cbd5e1;
  font-weight: 600;
}

.req {
  color: #ef4444;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-detect-gps {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-size: 0.725rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.15s;
}

.btn-detect-gps:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

.form-input, .form-textarea {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.65rem 0.85rem;
  border-radius: 6px;
  font-size: 0.825rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.location-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.7rem;
}

.coord-tag {
  color: #38bdf8;
  font-family: var(--font-mono);
}

.coord-warn {
  color: #f59e0b;
}

/* Checkbox & Toggle Pills */
.checkbox-pills, .hazard-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill-check, .toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid #334155;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

.pill-check input, .toggle-pill input {
  display: none;
}

.pill-check.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #93c5fd;
}

.toggle-pill.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
}

/* ===================================================================
   PHASE 2: EMERGENCY EVIDENCE SECTION STYLING
   =================================================================== */
.evidence-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 1.25rem;
}

.section-heading {
  font-size: 0.8rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
}

.evidence-subtext {
  font-size: 0.725rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

.media-trigger-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.btn-media-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.btn-media-action:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #f1f5f9;
}

.media-btn-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.media-btn-text {
  display: flex;
  flex-direction: column;
}

.media-btn-text strong {
  font-size: 0.8rem;
  color: #f8fafc;
}

.media-btn-text span {
  font-size: 0.65rem;
  color: #94a3b8;
}

.hidden-file-input {
  display: none;
}

.media-val-err {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #fcd34d;
  font-size: 0.75rem;
}

.btn-clear-err {
  background: transparent;
  border: none;
  color: #fbbf24;
  font-size: 0.7rem;
  cursor: pointer;
  text-decoration: underline;
}

/* Evidence Cards Grid */
.evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.evidence-card {
  background: rgba(9, 14, 26, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.media-preview-area {
  height: 120px;
  background: #040711;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-audio-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.5rem;
}

.audio-icon {
  font-size: 1.75rem;
}

.preview-audio-player {
  width: 90%;
  height: 32px;
}

.media-meta-card {
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.media-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-name {
  font-size: 0.75rem;
  color: #f1f5f9;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.btn-remove-media {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.65rem;
  line-height: 1;
}

.btn-remove-media:hover {
  background: #ef4444;
  color: white;
}

.media-submeta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.675rem;
  color: #94a3b8;
}

.media-type-pill {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.upload-status-row {
  margin-top: 0.25rem;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.progress-bar {
  height: 4px;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.2s;
}

.progress-lbl {
  font-size: 0.65rem;
  color: #93c5fd;
  font-family: var(--font-mono);
}

.status-uploaded {
  font-size: 0.675rem;
  color: #34d399;
  font-weight: 700;
  font-family: var(--font-mono);
}

.status-failed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.675rem;
  color: #f87171;
}

.btn-retry-file {
  background: transparent;
  border: none;
  color: #fca5a5;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.65rem;
}

.status-ready {
  font-size: 0.675rem;
  color: #94a3b8;
}

/* ===================================================================
   REVIEW PANEL STYLES
   =================================================================== */
.panel-header-review {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.6rem;
  margin-bottom: 1rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot-amber {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.step-badge {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}

.review-intro {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 1.25rem;
}

.review-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  background: rgba(9, 14, 26, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.7);
  border-radius: 8px;
  padding: 1.25rem;
}

.review-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.review-item.full-width {
  grid-column: span 2;
}

.rev-lbl {
  font-size: 0.675rem;
  font-family: var(--font-mono);
  color: #94a3b8;
  text-transform: uppercase;
}

.rev-val {
  font-size: 0.825rem;
  color: #f1f5f9;
}

.rev-desc {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-style: italic;
}

.hazard-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.badge-tag {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
}
.badge-tag.red { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.badge-tag.amber { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }

.review-evidence-section {
  margin-top: 1.25rem;
}

.evidence-review-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.evidence-review-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
}

.ev-rev-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.ev-rev-icon {
  font-size: 1.25rem;
}

.ev-rev-info {
  display: flex;
  flex-direction: column;
}

.ev-rev-info strong {
  font-size: 0.775rem;
  color: #f8fafc;
}

.ev-rev-info span {
  font-size: 0.675rem;
  color: #94a3b8;
}

.seal-badge {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.uploading-badge {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #60a5fa;
}

.pending-badge {
  font-size: 0.65rem;
  color: #94a3b8;
}

.no-evidence-note {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.5rem 0;
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Error Banner */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.err-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Submit Action */
.form-actions {
  margin-top: 0.5rem;
}

.btn-emergency-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 2px solid #ef4444;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 800;
  font-family: var(--font-display);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
  transition: all 0.2s;
}

.btn-emergency-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.6);
}

.btn-emergency-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success Panel */
.success-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  gap: 1rem;
}

.success-icon {
  font-size: 3rem;
}

.success-panel h3 {
  font-size: 1.25rem;
  color: #f8fafc;
}

.success-desc {
  font-size: 0.825rem;
  color: #94a3b8;
  max-width: 500px;
}

.incident-summary-card {
  width: 100%;
  max-width: 500px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.775rem;
}

.summary-row .lbl {
  color: #94a3b8;
  font-weight: 600;
}

.summary-row .val {
  color: #f1f5f9;
}

.font-mono { font-family: var(--font-mono); }
.font-bold { font-weight: 700; }
.text-red { color: #f87171; }
.text-amber { color: #fbbf24; }
.text-emerald { color: #34d399; }
.text-muted { color: #64748b; }
.text-xs { font-size: 0.7rem; }
.mt-3 { margin-top: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }

.success-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .media-trigger-buttons {
    grid-template-columns: 1fr;
  }
  .review-summary-grid {
    grid-template-columns: 1fr;
  }
  .review-item.full-width {
    grid-column: span 1;
  }
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
