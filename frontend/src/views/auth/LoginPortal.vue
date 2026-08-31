<template>
  <div class="portal-container">
    <div class="portal-card">
      <div class="portal-header">
        <div class="radar-badge">
          <span class="pulse-ring"></span>
          🚨
        </div>
        <h1 class="portal-title">ResQ<span>Net</span></h1>
        <p class="portal-tagline">AI-Powered Disaster Response & Emergency Mesh</p>
      </div>

      <div class="portal-intro">
        <p>Select your access gateway to enter the network</p>
      </div>

      <div class="gateway-options">
        <!-- Citizen Gateway -->
        <router-link to="/login/citizen" class="gateway-card citizen-gateway">
          <div class="gateway-icon">📱</div>
          <div class="gateway-info">
            <h3>Citizen Portal</h3>
            <p>Report emergencies, SOS voice broadcast, family check-in & shelter locator</p>
          </div>
          <div class="gateway-arrow">→</div>
        </router-link>

        <!-- Operations Gateway -->
        <router-link to="/login/operations" class="gateway-card operations-gateway">
          <div class="gateway-icon">🛡️</div>
          <div class="gateway-info">
            <h3>Operations & Command</h3>
            <p>Tactical Command, Dispatchers, EMTs, Fire & Hospital Mesh</p>
          </div>
          <div class="gateway-arrow">→</div>
        </router-link>

        <!-- Public Tactical Architecture Workflow (Zero login required) -->
        <router-link to="/workflow" class="gateway-card workflow-gateway">
          <div class="gateway-icon">⚡</div>
          <div class="gateway-info">
            <h3>System Workflow Architecture</h3>
            <p>Interactive End-to-End Emergency Intelligence Mesh (No Login Required)</p>
          </div>
          <div class="gateway-arrow">→</div>
        </router-link>
      </div>

      <div class="portal-footer">
        <span class="secure-badge">🛡️ 256-Bit Encrypted Public Safety Network</span>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.portal-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 1.5rem;
}

.portal-card {
  width: 100%;
  max-width: 520px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(51, 65, 85, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.1);
}

.portal-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-badge {
  position: relative;
  width: 64px;
  height: 64px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  border: 2px solid #ef4444;
  animation: radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes radar-pulse {
  0% { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.portal-title {
  font-size: 2rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  letter-spacing: -0.025em;
}

.portal-title span {
  color: #3b82f6;
}

.portal-tagline {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 0.35rem;
}

.portal-intro {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  font-family: var(--font-mono);
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  padding-bottom: 1rem;
}

.gateway-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gateway-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(51, 65, 85, 0.6);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.citizen-gateway:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.2);
}

.operations-gateway:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2);
}

.workflow-gateway:hover {
  background: rgba(0, 242, 254, 0.1);
  border-color: rgba(0, 242, 254, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 242, 254, 0.25);
}

.gateway-icon {
  font-size: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gateway-info {
  flex: 1;
}

.gateway-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.25rem 0;
}

.gateway-info p {
  font-size: 0.775rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.35;
}

.gateway-arrow {
  color: #64748b;
  font-size: 1.25rem;
  transition: transform 0.2s ease, color 0.2s ease;
}

.gateway-card:hover .gateway-arrow {
  color: #38bdf8;
  transform: translateX(4px);
}

.portal-footer {
  text-align: center;
  margin-top: 0.5rem;
}

.secure-badge {
  font-size: 0.725rem;
  color: #64748b;
  font-family: var(--font-mono);
}
</style>
