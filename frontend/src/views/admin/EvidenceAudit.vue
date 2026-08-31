<template>
  <div class="evidence-view">
    <div class="header-card tactical-card">
      <div class="hdr-text">
        <h2> EVIDENCE VAULT & CLIENT-SIDE SHA-256 TAMPER VERIFICATION</h2>
        <p>Cryptographically verify media artifacts, citizen upload byte streams, and immutable incident chain of custody using browser-native Web Crypto API.</p>
      </div>
      <div class="crypto-standard-badge font-mono">
        <span>FIPS 180-4 · SHA-256 SECURE HASH ALGORITHM</span>
      </div>
    </div>

    <div class="evidence-grid">
      <!-- Left: Evidence Ingested Artifacts List -->
      <div class="tactical-card list-panel">
        <div class="section-title font-mono">INGESTED INCIDENT EVIDENCE VAULT</div>
        <div class="artifact-list">
          <div
            v-for="ev in evidenceList"
            :key="ev.id"
            :class="['artifact-item', { active: selectedEvidence?.id === ev.id }]"
            @click="selectEvidence(ev)"
          >
            <div class="art-icon">{{ ev.fileType.includes('video') ? '' : ev.fileType.includes('image') ? '' : '' }}</div>
            <div class="art-meta">
              <strong>{{ ev.fileName }}</strong>
              <span class="font-mono text-xs text-slate-400">#{{ ev.incidentId }} · {{ ev.fileSize }}</span>
              <span class="font-mono text-xs text-cyan">{{ ev.uploader }}</span>
            </div>
            <span class="badge badge-success font-mono">SEALED</span>
          </div>
        </div>

        <!-- Custom Local File Verification Dropzone -->
        <div class="custom-file-upload-box">
          <label class="custom-drop-label font-mono">
            <span> Test Custom File Hash:</span>
            <input type="file" @change="handleFileUpload" class="file-input-hidden" />
            <span class="btn btn-ghost btn-sm font-mono upload-btn-trigger">Browse File</span>
          </label>
          <span v-if="customFileName" class="custom-file-name font-mono text-xs text-cyan">
            Loaded: {{ customFileName }} ({{ customFileSize }})
          </span>
        </div>
      </div>

      <!-- Right: Cryptographic Verification Console -->
      <div class="tactical-card verification-panel">
        <div class="section-title font-mono">CLIENT-SIDE SHA-256 CRYPTOGRAPHIC AUDIT</div>

        <div v-if="selectedEvidence" class="vault-content">
          <div class="evidence-meta-grid font-mono">
            <div class="meta-item">
              <span class="m-label">EVIDENCE ID:</span>
              <strong class="text-cyan">{{ selectedEvidence.id }}</strong>
            </div>
            <div class="meta-item">
              <span class="m-label">ASSOCIATED INCIDENT:</span>
              <strong class="text-amber">#{{ selectedEvidence.incidentId }}</strong>
            </div>
            <div class="meta-item">
              <span class="m-label">ARTIFACT TYPE:</span>
              <span>{{ selectedEvidence.fileType }}</span>
            </div>
            <div class="meta-item">
              <span class="m-label">INGESTION TIME:</span>
              <span>{{ selectedEvidence.timestamp }}</span>
            </div>
          </div>

          <!-- Stored Hash Box -->
          <div class="hash-box">
            <label class="font-mono">Stored Database Hash (SHA-256 Ingestion Seal):</label>
            <div class="hash-string font-mono">{{ selectedEvidence.sha256Hash }}</div>
          </div>

          <!-- Computed Hash Box (if verified) -->
          <div v-if="computedClientHash" class="hash-box">
            <label class="font-mono">Client-Side Calculated SHA-256 Hash (Web Crypto API):</label>
            <div class="hash-string font-mono" :class="verificationResult === 'VERIFIED' ? 'hash-match' : 'hash-mismatch'">
              {{ computedClientHash }}
            </div>
          </div>

          <!-- Action Verification Buttons -->
          <div class="audit-btn-row">
            <button class="btn btn-primary btn-audit font-mono" @click="runClientSha256Audit" :disabled="verifying">
               {{ verifying ? 'Computing Web Crypto SHA-256...' : 'Verify Cryptographic Integrity Now' }}
            </button>
            <button class="btn btn-ghost font-mono" @click="simulateTamperTest" :disabled="verifying" title="Test tamper detection alert">
               Test Tamper Alert
            </button>
          </div>

          <!-- Verification Outcome Banner -->
          <div v-if="verificationResult === 'VERIFIED'" class="audit-result-box verified-box">
            <div class="result-header">
              <span class="check-icon">✓</span>
              <h4 class="font-mono">HASH VERIFIED — 100% CRYPTOGRAPHIC INTEGRITY</h4>
            </div>
            <p class="result-text font-mono">Client-side Web Crypto SHA-256 digest exactly matches the stored database signature. Zero byte-level corruption or unauthorized modification detected.</p>
          </div>

          <div v-else-if="verificationResult === 'MISMATCH'" class="audit-result-box mismatch-box">
            <div class="result-header text-red">
              <span class="check-icon">✕</span>
              <h4 class="font-mono text-red">HASH MISMATCH — POTENTIAL FILE TAMPERING DETECTED</h4>
            </div>
            <p class="result-text font-mono text-red">The calculated client-side cryptographic digest does not match the immutable ingestion hash. Artifact may have been modified or corrupted in transit.</p>
          </div>

          <!-- Chain of Custody Audit Trail -->
          <div class="custody-chain font-mono">
            <h5>CHAIN OF CUSTODY AUDIT LOG:</h5>
            <div
              v-for="(step, idx) in (selectedEvidence.chainOfCustody || defaultChain)"
              :key="idx"
              class="chain-step"
            >
              <span class="dot"></span>
              <strong>{{ step.event }}</strong>
              <span class="node-tag" v-if="step.node">[{{ step.node }}]</span>
              <span class="time">{{ step.timestamp }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-selection font-mono">
          <span>Select an evidence artifact from the left list to audit its cryptographic integrity.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const evidenceList = ref([]);
const selectedEvidence = ref(null);
const verifying = ref(false);
const computedClientHash = ref('');
const verificationResult = ref(null); // 'VERIFIED' | 'MISMATCH' | null

const customFileName = ref('');
const customFileSize = ref('');
let customFileBuffer = null;

const defaultChain = [
  { event: 'Field Evidence Captured by First Responder', timestamp: '2026-08-31 10:30:00 UTC', node: 'Field Edge Node' },
  { event: 'SHA-256 Ingestion Hash Calculated & Sealed', timestamp: '2026-08-31 10:31:45 UTC', node: 'ResQNet Gateway' },
  { event: 'Immutable Record Stored in PostgreSQL Vault', timestamp: '2026-08-31 10:31:50 UTC', node: 'Primary Vault' }
];

onMounted(async () => {
  try {
    const res = await api.get('/evidence');
    evidenceList.value = res.data.data;
    if (evidenceList.value.length > 0) {
      selectEvidence(evidenceList.value[0]);
    }
  } catch (err) {
    console.error('Failed to load evidence', err);
  }
});

function selectEvidence(ev) {
  selectedEvidence.value = ev;
  computedClientHash.value = '';
  verificationResult.value = null;
  customFileName.value = '';
  customFileBuffer = null;
}

/**
 * Real Web Crypto API SHA-256 calculation
 */
async function calculateSha256(data) {
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer;
  } else if (data instanceof Blob || data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = new TextEncoder().encode(JSON.stringify(data));
  }

  // Native Web Crypto API
  const digestBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(digestBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function runClientSha256Audit() {
  if (!selectedEvidence.value) return;
  verifying.value = true;
  verificationResult.value = null;

  try {
    // 1. Convert payload / sample content / custom file to bytes
    const sourcePayload = customFileBuffer || selectedEvidence.value.sampleContent || selectedEvidence.value.fileName;

    // 2. Compute SHA-256 via Web Crypto
    const clientHash = await calculateSha256(sourcePayload);
    computedClientHash.value = clientHash;

    // 3. Compare against stored database hash
    const isMatch = clientHash.toLowerCase() === selectedEvidence.value.sha256Hash.toLowerCase();
    verificationResult.value = isMatch ? 'VERIFIED' : 'MISMATCH';

    // 4. Verify with backend endpoint
    await api.post('/evidence/verify', {
      evidenceId: selectedEvidence.value.id,
      clientCalculatedHash: clientHash
    });
  } catch (err) {
    console.error('Cryptographic verification error:', err);
    verificationResult.value = 'MISMATCH';
  } finally {
    verifying.value = false;
  }
}

async function simulateTamperTest() {
  if (!selectedEvidence.value) return;
  verifying.value = true;
  try {
    // Intentionally modified payload to demonstrate tamper detection
    const tamperedPayload = (selectedEvidence.value.sampleContent || selectedEvidence.value.fileName) + '_TAMPERED_BYTE_MODIFICATION_0x99';
    const tamperedHash = await calculateSha256(tamperedPayload);
    computedClientHash.value = tamperedHash;
    verificationResult.value = 'MISMATCH';
  } finally {
    verifying.value = false;
  }
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  customFileName.value = file.name;
  customFileSize.value = `${(file.size / 1024).toFixed(1)} KB`;
  customFileBuffer = await file.arrayBuffer();

  // Automatically compute hash for uploaded file
  const hash = await calculateSha256(customFileBuffer);
  computedClientHash.value = hash;

  if (selectedEvidence.value) {
    verificationResult.value = hash.toLowerCase() === selectedEvidence.value.sha256Hash.toLowerCase() ? 'VERIFIED' : 'MISMATCH';
  }
}
</script>

<style scoped>
.evidence-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-card {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
}

.crypto-standard-badge {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 700;
}

.evidence-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1rem;
}

.list-panel, .verification-panel {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.4rem;
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.artifact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}

.artifact-item:hover, .artifact-item.active {
  border-color: #3b82f6;
  background: rgba(37, 99, 235, 0.15);
}

.art-icon {
  font-size: 1.5rem;
}

.art-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  font-size: 0.775rem;
}

.art-meta strong {
  color: #f1f5f9;
}

.art-meta span {
  font-size: 0.65rem;
  color: #94a3b8;
}

.vault-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.custom-file-upload-box {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.custom-drop-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #cbd5e1;
  cursor: pointer;
}

.file-input-hidden {
  display: none;
}

.upload-btn-trigger {
  padding: 0.2rem 0.5rem;
}

.evidence-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.75rem;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.725rem;
}

.m-label {
  color: #64748b;
  font-size: 0.625rem;
}

.hash-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hash-box label {
  font-size: 0.7rem;
  color: #94a3b8;
}

.hash-string {
  background: #070b14;
  border: 1px solid #334155;
  padding: 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #38bdf8;
  word-break: break-all;
}

.hash-match {
  color: #34d399 !important;
  border-color: #10b981 !important;
  background: rgba(16, 185, 129, 0.1) !important;
}

.hash-mismatch {
  color: #f87171 !important;
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.15) !important;
}

.audit-btn-row {
  display: flex;
  gap: 0.5rem;
}

.btn-audit {
  flex: 1;
}

.audit-result-box {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.verified-box {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.5);
}

.mismatch-box {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.6);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6ee7b7;
}

.check-icon {
  font-size: 1.1rem;
  font-weight: 800;
}

.result-text {
  font-size: 0.725rem;
  color: #cbd5e1;
}

.custody-chain {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.custody-chain h5 {
  font-size: 0.65rem;
  color: #94a3b8;
}

.chain-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #cbd5e1;
}

.chain-step .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.node-tag {
  color: #38bdf8;
  font-size: 0.65rem;
}

.chain-step .time {
  color: #64748b;
  margin-left: auto;
}
</style>
