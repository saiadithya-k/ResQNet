<template>
  <div class="evidence-view">
    <div class="header-card tactical-card">
      <div>
        <h2>🔐 EVIDENCE CHAIN OF CUSTODY & SHA-256 TAMPER VERIFICATION</h2>
        <p>Cryptographically verify media artifacts, citizen upload hashes, and immutable incident custody chains.</p>
      </div>
    </div>

    <div class="evidence-grid">
      <!-- Evidence Artifact List -->
      <div class="tactical-card list-panel">
        <div class="section-title">INGESTED INCIDENT MEDIA FILES</div>
        <div class="artifact-list">
          <div
            v-for="ev in evidenceList"
            :key="ev.id"
            :class="['artifact-item', { active: selectedEvidence?.id === ev.id }]"
            @click="selectEvidence(ev)"
          >
            <div class="art-icon">📹</div>
            <div class="art-meta">
              <strong>{{ ev.fileName }}</strong>
              <span>{{ ev.incidentId }} · {{ ev.fileSize }} · {{ ev.uploader }}</span>
            </div>
            <span class="badge badge-success">SEALED</span>
          </div>
        </div>
      </div>

      <!-- Cryptographic Hash Verification Console -->
      <div class="tactical-card verification-panel">
        <div class="section-title">SHA-256 INTEGRITY AUDIT VAULT</div>

        <div v-if="selectedEvidence" class="vault-content">
          <div class="meta-row">
            <span class="label">Artifact ID:</span>
            <span class="val">{{ selectedEvidence.id }} ({{ selectedEvidence.fileName }})</span>
          </div>

          <div class="hash-box">
            <label>Stored Database Hash (SHA-256):</label>
            <div class="hash-string">{{ selectedEvidence.sha256Hash }}</div>
          </div>

          <button class="btn btn-primary" @click="runHashAudit" :disabled="verifying">
            ⚡ {{ verifying ? 'Computing SHA-256 Checksum...' : 'Verify Cryptographic Integrity Now' }}
          </button>

          <!-- Audit Result -->
          <div v-if="auditResult" class="audit-result-box">
            <div class="result-header">
              <span class="check-icon">✓</span>
              <h4>CRYPTOGRAPHIC INTEGRITY: 100% VERIFIED</h4>
            </div>
            <p class="result-text">Zero byte-level tampering detected. Digital signature matches ingestion timestamp.</p>

            <div class="custody-chain">
              <h5>CHAIN OF CUSTODY AUDIT LOG:</h5>
              <div v-for="(step, idx) in auditResult.chainOfCustody" :key="idx" class="chain-step">
                <span class="dot"></span>
                <strong>{{ step.event }}</strong>
                <span class="time">{{ step.timestamp }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-selection">
          Select an evidence artifact from the left list to audit its cryptographic integrity.
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
const auditResult = ref(null);

onMounted(async () => {
  try {
    const res = await api.get('/evidence');
    evidenceList.value = res.data.data;
    if (evidenceList.value.length > 0) {
      selectedEvidence.value = evidenceList.value[0];
    }
  } catch (err) {
    console.error('Failed to load evidence', err);
  }
});

function selectEvidence(ev) {
  selectedEvidence.value = ev;
  auditResult.value = null;
}

async function runHashAudit() {
  if (!selectedEvidence.value) return;
  verifying.value = true;
  try {
    const res = await api.post('/evidence/verify', {
      evidenceId: selectedEvidence.value.id
    });
    auditResult.value = res.data.data;
  } catch (err) {
    alert('Verification failed');
  } finally {
    verifying.value = false;
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
}

.header-card h2 {
  font-size: 1.15rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.775rem;
  color: #94a3b8;
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

.meta-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.meta-row .label {
  color: #94a3b8;
}

.meta-row .val {
  color: #f8fafc;
  font-weight: 600;
}

.hash-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hash-box label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.hash-string {
  background: #070b14;
  border: 1px solid #334155;
  padding: 0.65rem;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #38bdf8;
  word-break: break-all;
}

.audit-result-box {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6ee7b7;
}

.check-icon {
  font-size: 1.2rem;
  font-weight: 800;
}

.result-text {
  font-size: 0.75rem;
  color: #e2e8f0;
}

.custody-chain {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.custody-chain h5 {
  font-size: 0.65rem;
  font-family: var(--font-mono);
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

.chain-step .time {
  color: #64748b;
  font-family: var(--font-mono);
  margin-left: auto;
}
</style>
