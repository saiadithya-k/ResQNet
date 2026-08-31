<template>
  <div class="landing-container">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="brand-pill">
          <span class="live-dot"></span>
          <span class="pill-text">PUBLIC SAFETY INTELLIGENCE PLATFORM</span>
        </div>

        <h1 class="hero-title">
          One Network.<br />
          <span class="highlight-text">Every Emergency.</span>
        </h1>

        <p class="hero-description">
          ResQNet connects citizens in distress, tactical dispatchers, field responders, and regional trauma hospitals in a synchronized, real-time emergency mesh powered by multimodal AI.
        </p>

        <!-- Main Call-To-Action Gateways -->
        <div class="hero-cta-group">
          <router-link to="/login/citizen" class="cta-btn cta-citizen">
            <div class="cta-text">
              <span class="cta-title">Get Emergency Help</span>
              <span class="cta-sub">Citizen Portal &amp; Voice SOS</span>
            </div>
            <span class="cta-arrow">&#8594;</span>
          </router-link>

          <router-link to="/login/operations" class="cta-btn cta-ops">
            <div class="cta-text">
              <span class="cta-title">Operations &amp; Command</span>
              <span class="cta-sub">Dispatch, EMTs, Hospital Mesh</span>
            </div>
            <span class="cta-arrow">&#8594;</span>
          </router-link>

          <router-link to="/workflow" class="cta-btn cta-workflow">
            <div class="cta-text">
              <span class="cta-title">⚡ Interactive Workflow</span>
              <span class="cta-sub">Public Architecture &amp; System Mesh (No Login)</span>
            </div>
            <span class="cta-arrow">&#8594;</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- LIVE NETWORK STATUS INDICATORS -->
    <section class="status-strip">
      <div class="status-grid">
        <div class="status-item">
          <span class="status-indicator online"></span>
          <div class="status-info">
            <strong>Response Network</strong>
            <span>Operational & Online</span>
          </div>
        </div>
        <div class="status-item">
          <span class="status-indicator online"></span>
          <div class="status-info">
            <strong>Emergency Dispatch</strong>
            <span>Active & Standby</span>
          </div>
        </div>
        <div class="status-item">
          <span class="status-indicator online"></span>
          <div class="status-info">
            <strong>Hospital Mesh</strong>
            <span>Telemetry Connected</span>
          </div>
        </div>
        <div class="status-item">
          <span class="status-indicator online"></span>
          <div class="status-info">
            <strong>AI NLP Triage</strong>
            <span>Multilingual Active</span>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW RESQNET WORKS (4-STEP PIPELINE) -->
    <section class="workflow-section">
      <div class="section-header">
        <span class="section-badge">AUTONOMOUS EMERGENCY PIPELINE</span>
        <h2>How ResQNet Coordinates Crisis Response</h2>
        <p>From initial citizen distress call to specialized surgical intake in seconds.</p>
      </div>

      <div class="pipeline-grid">
        <div class="pipeline-card">
          <div class="card-icon-text">VOICE</div>
          <h3>Report Emergency</h3>
          <p>Citizens trigger SOS via voice, multilingual text, or location check-in. GPS coordinates and media are captured instantly.</p>
        </div>

        <div class="pipeline-arrow">→</div>

        <div class="pipeline-card">
          <div class="card-icon-text">AI</div>
          <h3>AI-Assisted Triage</h3>
          <p>Multilingual NLP extracts casualty counts, trapped victim states, and hazard flags, calculating dynamic priority scores (0–100).</p>
        </div>

        <div class="pipeline-arrow">→</div>

        <div class="pipeline-card">
          <div class="card-icon-text">MATCH</div>
          <h3>Intelligent Matching</h3>
          <p>6-factor algorithmic scoring evaluates responder skills, equipment, distance, ETA, fatigue, and active workload.</p>
        </div>

        <div class="pipeline-arrow">→</div>

        <div class="pipeline-card">
          <div class="card-icon-text">RESCUE</div>
          <h3>Rescue &amp; Hospital Care</h3>
          <p>Live GIS tracking navigates units to the scene while hospital beds, ICU units, and trauma suites are reserved ahead of arrival.</p>
        </div>
      </div>
    </section>

    <!-- PLATFORM CAPABILITIES -->
    <section class="features-section">
      <div class="section-header">
        <span class="section-badge">INTEGRATED ARCHITECTURE</span>
        <h2>End-to-End Tactical Capabilities</h2>
        <p>Built to handle extreme disaster scenarios and daily emergency services alike.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon-text">AI</div>
          <h3>Multilingual AI Copilot</h3>
          <p>Real-time emergency transcription and entity extraction supporting English, Tamil, Hindi, and Telugu with zero latency.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-text">GIS</div>
          <h3>Tactical GIS Command Center</h3>
          <p>Interactive MapLibre & OpenFreeMap Tactical GIS map with simulated GPS interpolation, hazard zone polygons, route vectors, and heatmaps.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-text">EMT</div>
          <h3>Concurrency-Locked Dispatch</h3>
          <p>ACID-compliant PostgreSQL transaction locks protect field units against concurrent double-dispatch races.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-text">ICU</div>
          <h3>Regional Hospital Mesh</h3>
          <p>Live ICU, bed, ventilator, and operating room capacity balancing with automated inter-hospital transfer routing.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-text">CPR</div>
          <h3>Community First Responders</h3>
          <p>500-meter proximity matching for CPR/AED and First-Aid certified citizen volunteers during critical window moments.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon-text">SHA</div>
          <h3>SHA-256 Audit Vault</h3>
          <p>Cryptographically hashed, tamper-evident audit logs and chain-of-custody verification for all incident events.</p>
        </div>
      </div>
    </section>

    <!-- SPLIT CALL-TO-ACTION SECTION -->
    <section class="split-cta-section">
      <!-- Citizen Emergency Box -->
      <div class="cta-box citizen-box">
        <div class="box-badge citizen">CITIZEN PORTAL</div>
        <h3>Facing an Emergency?</h3>
        <p>Report structural collapses, fires, medical crises, or floods. Track rescue units in real time and notify family safety circles.</p>
        <router-link to="/login/citizen" class="action-btn btn-citizen">
          Open Citizen Emergency Portal
          </router-link>
      </div>

      <!-- Operations Box -->
      <div class="cta-box ops-box">
        <div class="box-badge ops">OPERATIONS & COMMAND</div>
        <h3>Emergency Operations Personnel</h3>
        <p>Tactical Command, 911/112 Dispatchers, Paramedics, Fire Chiefs, Community Responders, and Hospital Staff.</p>
        <router-link to="/login/operations" class="action-btn btn-ops">
          Access Command Portal
          </router-link>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="landing-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-logo">
            <span class="logo-emoji"></span>
            <h2>ResQ<span>Net</span></h2>
          </div>
          <p>AI Emergency Intelligence & Public Safety Mesh Platform.</p>
        </div>

        <div class="footer-nav">
          <div class="footer-col">
            <h4>Access Portals</h4>
            <router-link to="/login/citizen">Citizen Portal</router-link>
            <router-link to="/login/operations">Operations & Command</router-link>
            <router-link to="/login">Central Auth Gateway</router-link>
          </div>
          <div class="footer-col">
            <h4>System Standards</h4>
            <span>256-Bit Encryption</span>
            <span>ACID Concurrency</span>
            <span>Multilingual AI NLP</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 ResQNet Emergency Response Network. All rights reserved.</p>
        <span class="security-tag">SYSTEM HEALTHY — VERIFIED PRODUCTION BUILD</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.landing-container {
  min-height: 100%;
  background: radial-gradient(circle at top right, rgba(30, 58, 138, 0.15), transparent 50%),
              radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.9), transparent 50%),
              #030712;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding-bottom: 2rem;
}

/* HERO SECTION */
.hero-section {
  position: relative;
  padding: 4rem 1.5rem 2rem;
  display: flex;
  justify-content: center;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  z-index: 2;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.pill-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #f8fafc;
  margin: 0;
}

.highlight-text {
  background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.15rem;
  color: #94a3b8;
  line-height: 1.6;
  max-width: 680px;
  margin: 0;
}

.hero-cta-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  width: 100%;
  max-width: 960px;
  margin-top: 1rem;
}

.cta-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.cta-citizen {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25));
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.cta-citizen:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.45));
  border-color: #ef4444;
  transform: translateY(-3px);
  box-shadow: 0 12px 30px -5px rgba(239, 68, 68, 0.35);
}

.cta-ops {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(29, 78, 216, 0.25));
  border: 1px solid rgba(59, 130, 246, 0.5);
}

.cta-ops:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(29, 78, 216, 0.45));
  border-color: #3b82f6;
  transform: translateY(-3px);
  box-shadow: 0 12px 30px -5px rgba(59, 130, 246, 0.35);
}

.cta-workflow {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 116, 144, 0.25));
  border: 1px solid rgba(6, 182, 212, 0.5);
}

.cta-workflow:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(14, 116, 144, 0.45));
  border-color: #06b6d4;
  transform: translateY(-3px);
  box-shadow: 0 12px 30px -5px rgba(6, 182, 212, 0.35);
}

.cta-icon {
  font-size: 2rem;
}

.cta-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cta-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f8fafc;
}

.cta-sub {
  font-size: 0.75rem;
  color: #cbd5e1;
}

.cta-arrow {
  color: #94a3b8;
  font-size: 1.25rem;
  transition: transform 0.2s;
}

.cta-btn:hover .cta-arrow {
  color: #f8fafc;
  transform: translateX(4px);
}

.quick-login-link {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  gap: 0.5rem;
}

.text-link {
  color: #38bdf8;
  text-decoration: underline;
  font-weight: 600;
}

/* STATUS STRIP */
.status-strip {
  max-width: 1100px;
  margin: 0 auto;
  width: 90%;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  backdrop-filter: blur(16px);
  padding: 1rem 1.5rem;
  border-radius: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-indicator.online {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-info strong {
  font-size: 0.825rem;
  color: #f8fafc;
}

.status-info span {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

/* WORKFLOW SECTION */
.workflow-section {
  max-width: 1100px;
  margin: 0 auto;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.section-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.section-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.section-header p {
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0;
}

.pipeline-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pipeline-card {
  flex: 1;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  transition: transform 0.2s, border-color 0.2s;
}

.pipeline-card:hover {
  transform: translateY(-4px);
  border-color: #38bdf8;
}

.step-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #64748b;
  font-family: var(--font-mono);
}

.card-icon {
  font-size: 2rem;
}

.pipeline-card h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.pipeline-card p {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.45;
  margin: 0;
}

.pipeline-arrow {
  color: #475569;
  font-size: 1.5rem;
}

/* FEATURES SECTION */
.features-section {
  max-width: 1100px;
  margin: 0 auto;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.feature-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.feature-card:hover {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.feature-icon {
  font-size: 2rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.feature-card p {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

/* SPLIT CTA SECTION */
.split-cta-section {
  max-width: 1100px;
  margin: 0 auto;
  width: 90%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.cta-box {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
}

.citizen-box {
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.ops-box {
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.box-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 800;
  font-family: var(--font-mono);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  width: fit-content;
}

.box-badge.citizen {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.box-badge.ops {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.cta-box h3 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.cta-box p {
  font-size: 0.875rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  margin-top: auto;
  transition: all 0.2s ease;
}

.btn-citizen {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-citizen:hover {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.btn-ops {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
}

.btn-ops:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

/* FOOTER */
.landing-footer {
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  padding: 3rem 1.5rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-brand {
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-logo h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.footer-logo span {
  color: #3b82f6;
}

.footer-brand p {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.footer-nav {
  display: flex;
  gap: 3rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-col h4 {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.25rem 0;
}

.footer-col a {
  font-size: 0.8rem;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-col a:hover {
  color: #38bdf8;
}

.footer-col span {
  font-size: 0.8rem;
  color: #64748b;
  font-family: var(--font-mono);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(51, 65, 85, 0.4);
  padding-top: 1.5rem;
  font-size: 0.75rem;
  color: #64748b;
  flex-wrap: wrap;
  gap: 1rem;
}

.security-tag {
  font-family: var(--font-mono);
  color: #34d399;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.25rem;
  }
  .hero-cta-group {
    grid-template-columns: 1fr;
  }
  .pipeline-grid {
    flex-direction: column;
  }
  .pipeline-arrow {
    transform: rotate(90deg);
  }
  .split-cta-section {
    grid-template-columns: 1fr;
  }
}

/* Icon text replacements for emojis */
.card-icon-text, .feature-icon-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}
</style>
