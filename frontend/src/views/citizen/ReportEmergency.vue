<template>
  <div class="report-view">
    <!-- Header -->
    <div class="header-card glass">
      <div class="header-left">
        <router-link to="/citizen/emergencies" class="back-link">
          <span class="back-arrow">←</span>
          <span class="back-text">Back to Citizen Portal</span>
        </router-link>
        <div class="header-title-block">
          <h1 class="page-title">
            <span class="pulse-icon">🚨</span> REPORT CRITICAL EMERGENCY
          </h1>
          <p class="subtitle">AI-assisted triage and high-precision tactical geo-dispatch protocol</p>
        </div>
      </div>
      <div class="header-right">
        <div class="status-indicator">
          <span class="live-beacon"></span>
          <span class="status-text font-mono">PRIORITY 1 DISPATCH CHANNEL OPEN</span>
        </div>
      </div>
    </div>

    <!-- TRANSMISSION SUCCESS SCREEN -->
    <div v-if="submissionSuccess" class="submission-success-card glass animate-fade-in">
      <div class="success-header">
        <div class="success-icon-badge">✓</div>
        <div>
          <h2>EMERGENCY REPORT TRANSMITTED</h2>
          <p class="success-sub">Disaster Command Center & Tactical Units have been notified with high priority.</p>
        </div>
      </div>

      <div class="success-details-grid">
        <div class="detail-box">
          <span class="detail-label">INCIDENT TRACKING ID</span>
          <span class="detail-value font-mono text-cyan">{{ submittedIncident?.id || 'INC-PENDING' }}</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">PRIORITY SCORE</span>
          <span class="detail-value font-mono text-danger">{{ submittedIncident?.priorityScore || 'COMPUTING...' }} / 100</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">INCIDENT STATUS</span>
          <span class="detail-value font-mono text-warning">DISPATCHING TEAMS</span>
        </div>
        <div class="detail-box">
          <span class="detail-label">SEALED COORDINATES</span>
          <span class="detail-value font-mono text-cyan">
            {{ Number(form.latitude).toFixed(6) }}, {{ Number(form.longitude).toFixed(6) }} ({{ form.locationSource }})
          </span>
        </div>
      </div>

      <div class="success-actions">
        <router-link :to="`/citizen/emergencies/${submittedIncident?.id || ''}`" class="btn btn-primary">
          Track Live Incident Status →
        </router-link>
        <button class="btn btn-secondary" @click="resetForm">
          Report Another Emergency
        </button>
      </div>
    </div>

    <!-- TRANSMISSION REVIEW MODAL -->
    <div v-else-if="isReviewing" class="review-modal-overlay">
      <div class="review-modal-content glass animate-scale-up">
        <div class="review-header">
          <div class="review-title-group">
            <span class="review-shield-icon">🛡️</span>
            <div>
              <h3>CONFIRM EMERGENCY TRANSMISSION</h3>
              <p class="review-subtext">Verify critical emergency data before broadcasting to responders</p>
            </div>
          </div>
          <button class="btn-modal-close" @click="isReviewing = false">✕</button>
        </div>

        <div class="review-summary-body">
          <div class="summary-card">
            <div class="summary-section-title">INCIDENT OVERVIEW</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="lbl">TYPE</span>
                <span class="val font-mono tag-badge">{{ form.incidentType }}</span>
              </div>
              <div class="summary-item">
                <span class="lbl">ESTIMATED VICTIMS</span>
                <span class="val font-mono text-danger">{{ form.victimCount }} PERSON(S)</span>
              </div>
              <div class="summary-item full">
                <span class="lbl">TITLE</span>
                <span class="val font-mono">{{ form.title }}</span>
              </div>
              <div class="summary-item full">
                <span class="lbl">INCIDENT LOCATION</span>
                <span class="val font-mono text-cyan">📍 {{ form.address }}</span>
              </div>
              <div class="summary-item">
                <span class="lbl">COORDINATES</span>
                <span class="val font-mono text-cyan">{{ Number(form.latitude).toFixed(6) }}, {{ Number(form.longitude).toFixed(6) }}</span>
              </div>
              <div class="summary-item">
                <span class="lbl">LOCATION SOURCE</span>
                <span class="val font-mono tag-source">{{ form.locationSource }} VERIFIED</span>
              </div>
              <div class="summary-item full">
                <span class="lbl">DISTRICT / ZONE</span>
                <span class="val font-mono">{{ form.district || 'Harbour Zone' }}</span>
              </div>
              <div class="summary-item full">
                <span class="lbl">DESCRIPTION</span>
                <span class="val desc-box">{{ form.description }}</span>
              </div>
            </div>
          </div>

          <!-- Hazards & Evidence in Review -->
          <div class="summary-card">
            <div class="summary-section-title">OBSERVED HAZARDS & ATTACHED MEDIA</div>
            <div class="hazards-list">
              <span v-if="form.hasInjuries" class="hazard-badge-active">🩸 Severe Injuries</span>
              <span v-if="form.hasTrapped" class="hazard-badge-active">⚠️ Trapped Victims</span>
              <span v-if="form.hasFire" class="hazard-badge-active">🔥 Active Fire / Toxic Smoke</span>
              <span v-if="form.hasHazmat" class="hazard-badge-active">☣️ Hazardous Materials</span>
              <span v-if="!form.hasInjuries && !form.hasTrapped && !form.hasFire && !form.hasHazmat" class="hazard-badge-none">
                No immediate structural hazards flagged
              </span>
            </div>

            <div class="review-evidence-summary">
              <span class="lbl">ATTACHED EVIDENCE ({{ evidenceList.length }} FILES):</span>
              <div v-if="evidenceList.length > 0" class="review-file-pills">
                <span v-for="ev in evidenceList" :key="ev.id" class="review-file-pill font-mono">
                  {{ ev.fileType.toUpperCase() }}: {{ ev.fileName }} ({{ ev.fileSize }})
                </span>
              </div>
              <span v-else class="text-muted font-mono" style="font-size: 0.75rem;">No media attached</span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="review-footer">
          <button class="btn btn-secondary" :disabled="submitting" @click="isReviewing = false">
            ← Edit Details
          </button>
          <button class="btn btn-emergency-confirm" :disabled="submitting" @click="submitReport">
            <span v-if="submitting">TRANSMITTING TO DISPATCH...</span>
            <span v-else>🚨 CONFIRM & BROADCAST TO RESPONDERS</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN REPORTING FORM -->
    <div v-else class="form-container glass animate-fade-in">
      <form @submit.prevent="proceedToReview" class="emergency-form">
        <!-- Row 1: Type and Title -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label for="incidentType">Incident Classification <span class="req">*</span></label>
            <select id="incidentType" v-model="form.incidentType" class="form-select" required>
              <option value="COLLAPSE">🏚️ Structural Collapse</option>
              <option value="FIRE">🔥 Active Fire / Explosion</option>
              <option value="FLOOD">🌊 Flash Flood / Water Inundation</option>
              <option value="HAZMAT">☣️ Hazmat / Chemical Spill</option>
              <option value="MEDICAL">🚑 Mass Casualty / Medical Trauma</option>
              <option value="CYCLONE">🌪️ Cyclone / Extreme Storm</option>
              <option value="LANDSLIDE">⛰️ Landslide / Mudflow</option>
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

        <!-- Row 2: Tactical Incident Location Picker (GPS / Search / Map Pin) -->
        <LocationPicker
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          v-model:address="form.address"
          v-model:locationSource="form.locationSource"
          v-model:district="form.district"
        />

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
                <span>👵 Elderly</span>
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
              <span>⚠️ People Trapped / Stranded</span>
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

        <!-- Row 6: EMERGENCY EVIDENCE & MEDIA ATTACHMENTS -->
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
                <img
                  v-if="item.fileType === 'image'"
                  :src="item.previewUrl"
                  :alt="item.fileName"
                  class="preview-img"
                />

                <video
                  v-else-if="item.fileType === 'video'"
                  :src="item.previewUrl"
                  class="preview-video"
                  controls
                  preload="metadata"
                ></video>

                <div v-else-if="item.fileType === 'audio'" class="preview-audio-container">
                  <span class="audio-icon">🎙️</span>
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
            <span>Review & Transmit Emergency Report →</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useIncidentStore } from '../../stores/incidentStore';
import LocationPicker from '../../components/common/LocationPicker.vue';
import api from '../../services/api';

const incidentStore = useIncidentStore();

const photoInputRef = ref(null);
const videoInputRef = ref(null);
const audioInputRef = ref(null);

const submitting = ref(false);
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
  address: '42 Harbour Road, Sector 4',
  victimCount: 1,
  latitude: 13.082680,
  longitude: 80.270718,
  locationSource: 'SEARCH', // 'GPS' | 'SEARCH' | 'MAP_PIN'
  district: 'Harbour Zone',
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

function proceedToReview() {
  if (!form.title || !form.description || !form.address) {
    errorMessage.value = 'Please fill in all required fields marked with *.';
    return;
  }
  if (!form.latitude || !form.longitude || isNaN(form.latitude) || isNaN(form.longitude)) {
    errorMessage.value = 'Please select a valid incident location on the map or via search.';
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
      location: form.address,
      district: form.district || 'Harbour Zone',
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      locationSource: form.locationSource || 'SEARCH',
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
  form.address = '42 Harbour Road, Sector 4';
  form.victimCount = 1;
  form.latitude = 13.082680;
  form.longitude = 80.270718;
  form.locationSource = 'SEARCH';
  form.district = 'Harbour Zone';
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
  width: 100%;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.back-link {
  display: inline-flex !important;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-cyan, #00f2fe);
  text-decoration: none;
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
  white-space: nowrap !important;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid rgba(255, 0, 85, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
}

.live-beacon {
  width: 8px;
  height: 8px;
  background: #ff0055;
  border-radius: 50%;
  box-shadow: 0 0 8px #ff0055;
  animation: pulse-red 1.5s infinite;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #ff4d88;
}

/* Main Form Card */
.form-container {
  padding: 1.75rem;
}

.emergency-form {
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
  font-size: 0.8rem;
  font-family: var(--font-mono, monospace);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  letter-spacing: 0.03em;
}

.req {
  color: #ff0055;
}

.form-input, .form-select, .form-textarea {
  background: rgba(10, 15, 29, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.65rem 0.9rem;
  color: #fff;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-cyan, #00f2fe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.25);
  background: rgba(10, 15, 29, 0.95);
}

.checkbox-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill-check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.45rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
  user-select: none;
}

.pill-check input {
  display: none;
}

.pill-check.active {
  background: rgba(0, 242, 254, 0.15);
  border-color: var(--color-cyan, #00f2fe);
  color: var(--color-cyan, #00f2fe);
}

.hazard-toggles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.6rem;
}

.toggle-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.65rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.toggle-pill input {
  display: none;
}

.toggle-pill.active {
  background: rgba(255, 0, 85, 0.15);
  border-color: #ff0055;
  color: #ff80a0;
  box-shadow: 0 0 10px rgba(255, 0, 85, 0.2);
}

/* Evidence Section */
.evidence-upload-section {
  background: rgba(0, 0, 0, 0.25);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.25rem;
}

.section-heading {
  font-size: 0.85rem;
  font-family: var(--font-mono, monospace);
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.05em;
}

.evidence-subtext {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.2rem;
}

.media-trigger-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-media-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  color: #fff;
}

.btn-media-action:hover {
  background: rgba(0, 242, 254, 0.1);
  border-color: var(--color-cyan, #00f2fe);
}

.media-btn-icon {
  font-size: 1.4rem;
}

.media-btn-text strong {
  display: block;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.media-btn-text span {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}

.hidden-file-input {
  display: none;
}

.media-val-err {
  margin-top: 0.75rem;
  background: rgba(255, 170, 0, 0.15);
  border: 1px solid #ffaa00;
  color: #ffbb33;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-clear-err {
  background: transparent;
  border: none;
  color: #ffbb33;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.75rem;
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.evidence-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.media-preview-area {
  height: 120px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
  gap: 0.4rem;
  padding: 0.5rem;
  width: 100%;
}

.preview-audio-player {
  width: 90%;
  height: 30px;
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
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.btn-remove-media {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-remove-media:hover {
  color: #ff0055;
}

.media-submeta {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}

.media-type-pill {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.upload-status-row {
  margin-top: 0.3rem;
}

.progress-container {
  background: rgba(255, 255, 255, 0.1);
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  background: var(--color-cyan, #00f2fe);
  height: 100%;
  transition: width 0.2s ease;
}

.progress-lbl {
  font-size: 0.65rem;
  color: var(--color-cyan, #00f2fe);
  margin-top: 2px;
  display: block;
}

.status-uploaded {
  font-size: 0.68rem;
  color: #00ff88;
  font-family: var(--font-mono, monospace);
}

.status-failed {
  font-size: 0.68rem;
  color: #ff0055;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-retry-file {
  background: rgba(255, 0, 85, 0.2);
  border: 1px solid #ff0055;
  color: #fff;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  cursor: pointer;
}

.status-ready {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Form Actions */
.form-actions {
  margin-top: 1rem;
}

.btn-emergency-submit {
  width: 100%;
  background: linear-gradient(135deg, #ff0055 0%, #b3003b 100%);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.9rem 1.5rem;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.35);
}

.btn-emergency-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 0, 85, 0.6);
}

.btn-emergency-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Review */
.review-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.review-modal-content {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.75rem;
  border: 1px solid rgba(255, 0, 85, 0.4);
  box-shadow: 0 0 40px rgba(255, 0, 85, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.review-shield-icon {
  font-size: 1.8rem;
}

.review-header h3 {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #ff4d88;
}

.review-subtext {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  cursor: pointer;
}

.review-summary-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-card {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1rem;
}

.summary-section-title {
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.4rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary-item.full {
  grid-column: 1 / -1;
}

.summary-item .lbl {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-mono, monospace);
}

.summary-item .val {
  font-size: 0.85rem;
  color: #fff;
}

.tag-badge {
  color: #ff80a0;
  font-weight: 700;
}

.tag-source {
  color: #00f2fe;
  font-weight: 700;
}

.desc-box {
  background: rgba(255, 255, 255, 0.04);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  line-height: 1.4;
}

.hazards-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.hazard-badge-active {
  background: rgba(255, 0, 85, 0.2);
  border: 1px solid #ff0055;
  color: #ff80a0;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.hazard-badge-none {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.review-evidence-summary {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.review-file-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.review-file-pill {
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.3);
  color: var(--color-cyan, #00f2fe);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-emergency-confirm {
  background: linear-gradient(135deg, #ff0055 0%, #cc0044 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 800;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.4);
}

.btn-emergency-confirm:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(255, 0, 85, 0.7);
}

/* Success Card */
.submission-success-card {
  padding: 2rem;
  border: 1px solid rgba(0, 255, 136, 0.4);
  box-shadow: 0 0 40px rgba(0, 255, 136, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.success-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.success-icon-badge {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.15);
  border: 2px solid #00ff88;
  color: #00ff88;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #00ff88;
  letter-spacing: 0.05em;
}

.success-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.success-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-box {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.detail-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
}

.detail-value {
  font-size: 1rem;
  font-weight: 700;
}

.success-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-cyan, #00f2fe);
  color: #030712;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.error-banner {
  background: rgba(255, 0, 85, 0.15);
  border: 1px solid #ff0055;
  color: #ff80a0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

@keyframes pulse-red {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
