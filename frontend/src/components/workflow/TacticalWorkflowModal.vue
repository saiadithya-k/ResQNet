<template>
  <Teleport to="body">
    <Transition name="workflow-fade">
      <div v-if="uiStore.workflowOpen" class="workflow-overlay" @keydown.esc="uiStore.closeWorkflow" tabindex="0">
        
        <!-- TOP COMMAND HEADER -->
        <header class="wf-header">
          <div class="wf-header-left">
            <div class="wf-logo-box">
              <span class="wf-logo-pulse"></span>
              <span class="wf-logo-text">⚡</span>
            </div>
            <div class="wf-title-block">
              <div class="wf-main-title">
                RESQNET TACTICAL WORKFLOW
                <span class="wf-live-tag">LIVE LIFECYCLE</span>
              </div>
              <div class="wf-sub-title">AUTONOMOUS EMERGENCY INTELLIGENCE &amp; MULTI-AGENCY COORDINATION MESH</div>
            </div>
          </div>

          <!-- Incident Selector & Real-Time Stats -->
          <div class="wf-header-center">
            <div class="incident-selector-wrapper">
              <label class="sel-label">ACTIVE INCIDENT:</label>
              <select v-model="selectedIncidentId" @change="onIncidentChange" class="incident-select font-mono">
                <option v-for="inc in incidentStore.incidents" :key="inc.id" :value="inc.id">
                  #{{ inc.id }} · {{ inc.title }} ({{ inc.status }})
                </option>
              </select>
            </div>

            <div class="wf-kpi-pill">
              <span class="kpi-dot dot-cyan"></span>
              <span class="kpi-name">STAGE:</span>
              <span class="kpi-val text-cyan font-mono">{{ currentStageName }}</span>
            </div>

            <div class="wf-kpi-pill">
              <span class="kpi-dot dot-amber"></span>
              <span class="kpi-name">PRIORITY:</span>
              <span class="kpi-val text-amber font-mono">{{ activeIncident?.priorityScore || 96 }}/100</span>
            </div>

            <div class="wf-kpi-pill">
              <span class="kpi-dot" :class="activeIncident?.severity === 'CRITICAL' ? 'dot-red' : 'dot-amber'"></span>
              <span class="kpi-name">SEVERITY:</span>
              <span class="kpi-val font-mono" :class="activeIncident?.severity === 'CRITICAL' ? 'text-red' : 'text-amber'">
                {{ activeIncident?.severity || 'CRITICAL' }}
              </span>
            </div>
          </div>

          <!-- Header Actions -->
          <div class="wf-header-right">
            <button class="wf-btn wf-btn-close" @click="uiStore.closeWorkflow" title="Close Tactical Workflow (Esc)">
              <span class="close-icon">✕</span>
              <span>CLOSE WORKFLOW</span>
            </button>
          </div>
        </header>

        <!-- MAIN WORKFLOW WORKSPACE (PAN & ZOOM CANVAS) -->
        <div
          ref="canvasViewport"
          class="wf-viewport"
          @mousedown="startPan"
          @mousemove="doPan"
          @mouseup="endPan"
          @mouseleave="endPan"
          @wheel.passive="handleWheel"
        >
          <!-- Transform container -->
          <div
            class="wf-canvas-content"
            :style="{
              transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
              transformOrigin: '50% 50%'
            }"
          >
            <!-- SVG CONNECTORS LAYER (Dotted & Animated Orthogonal Bezier Curves) -->
            <svg class="wf-connections-svg" :width="canvasWidth" :height="canvasHeight">
              <defs>
                <linearGradient id="flow-gradient-active" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
                  <stop offset="50%" stop-color="#818cf8" stop-opacity="1" />
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9" />
                </linearGradient>
                <linearGradient id="flow-gradient-standard" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#475569" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#334155" stop-opacity="0.3" />
                </linearGradient>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <!-- Connection Paths -->
              <g v-for="(edge, idx) in computedConnections" :key="'edge-' + idx">
                <!-- Background track -->
                <path
                  :d="edge.d"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <!-- Animated dotted connection -->
                <path
                  :d="edge.d"
                  fill="none"
                  :stroke="edge.active ? 'url(#flow-gradient-active)' : 'rgba(148, 163, 184, 0.35)'"
                  :stroke-width="edge.active ? 2.5 : 1.5"
                  stroke-dasharray="6, 6"
                  :class="['conn-path', { 'conn-active': edge.active }]"
                  :filter="edge.active ? 'url(#glow-cyan)' : 'none'"
                />
              </g>
            </svg>

            <!-- NODES LAYER -->
            <div class="wf-nodes-container">

              <!-- ==============================================
                   TIER 1: CITIZEN INTAKE & SENSORY LAYER
              =============================================== -->
              <!-- Node 1: Citizen Intake -->
              <div
                class="wf-card node-pos"
                :style="{ left: '160px', top: '40px' }"
                :class="{ 'wf-card-active': isNodeActive('citizen'), 'wf-card-selected': selectedNodeKey === 'citizen' }"
                @click="selectNode('citizen')"
              >
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-red">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Citizen Intake</div>
                    <div class="wf-node-sub">Voice / Text / Multilingual SOS</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>Active</span>
                  <span class="wf-metric-tag font-mono">GPS Locked (42 Harbour Rd)</span>
                </div>
              </div>

              <!-- Node 2: AI Intelligence -->
              <div
                class="wf-card node-pos"
                :style="{ left: '520px', top: '40px' }"
                :class="{ 'wf-card-active': isNodeActive('ai'), 'wf-card-selected': selectedNodeKey === 'ai' }"
                @click="selectNode('ai')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-cyan">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2v1.09A6 6 0 0 1 18.91 10H20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.09A6 6 0 0 1 14 20.91V22a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.09A6 6 0 0 1 3.09 16H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1.09A6 6 0 0 1 8 5.09V4a2 2 0 0 1 2-2z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">AI Intelligence</div>
                    <div class="wf-node-sub">Multilingual NLP &amp; Emotion Triage</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>Analyzed</span>
                  <span class="wf-metric-tag font-mono">Confidence: 94% · Panicked</span>
                </div>
              </div>

              <!-- Node 3: Disaster Intelligence -->
              <div
                class="wf-card node-pos"
                :style="{ left: '880px', top: '40px' }"
                :class="{ 'wf-card-active': isNodeActive('disaster'), 'wf-card-selected': selectedNodeKey === 'disaster' }"
                @click="selectNode('disaster')"
              >
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-orange">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.8l7.53 13.2H4.47L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Disaster Models</div>
                    <div class="wf-node-sub">Regional Threat &amp; Surge Mesh</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active" :class="disasterStore.isDisasterMode ? 'text-red' : 'text-emerald'">
                    <span class="status-dot-pulse" :class="disasterStore.isDisasterMode ? 'red' : 'green'"></span>
                    {{ disasterStore.isDisasterMode ? 'SURGE ACTIVE' : 'STANDBY' }}
                  </span>
                  <span class="wf-metric-tag font-mono">Sector 04 · High Risk</span>
                </div>
              </div>

              <!-- ==============================================
                   CENTRAL ORCHESTRATION HUB: INCIDENT & PRIORITY ENGINE
              =============================================== -->
              <div
                class="wf-central-hub"
                :style="{ left: '560px', top: '230px' }"
                :class="{ 'hub-active': true, 'wf-card-selected': selectedNodeKey === 'incident_core' }"
                @click="selectNode('incident_core')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-port port-left"></div>
                <div class="wf-port port-right"></div>
                <div class="hub-inner">
                  <div class="hub-logo-glow"></div>
                  <div class="hub-emblem">⚡</div>
                  <div class="hub-title">RESQ CORE ENGINE</div>
                  <div class="hub-sub font-mono">#{{ activeIncident?.id || 'INC-1042' }} · PRIORITY {{ activeIncident?.priorityScore || 96 }}</div>
                  <div class="hub-tag font-mono">ACID TRANSACTION LOCKED</div>
                </div>
              </div>

              <!-- Priority Engine Box (Satellite) -->
              <div
                class="wf-card node-pos"
                :style="{ left: '160px', top: '240px' }"
                :class="{ 'wf-card-active': isNodeActive('priority'), 'wf-card-selected': selectedNodeKey === 'priority' }"
                @click="selectNode('priority')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-right"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-amber">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Dynamic Priority</div>
                    <div class="wf-node-sub">6-Factor Weighted Scoring</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse amber"></span>Calculated</span>
                  <span class="wf-metric-tag font-mono">Score: {{ activeIncident?.priorityScore || 96 }}/100</span>
                </div>
              </div>

              <!-- Dispatch Engine Box (Satellite) -->
              <div
                class="wf-card node-pos"
                :style="{ left: '880px', top: '240px' }"
                :class="{ 'wf-card-active': isNodeActive('dispatch'), 'wf-card-selected': selectedNodeKey === 'dispatch' }"
                @click="selectNode('dispatch')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-left"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-purple">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Dispatch Engine</div>
                    <div class="wf-node-sub">Algorithmic Unit Assignment</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse purple"></span>Optimal Match</span>
                  <span class="wf-metric-tag font-mono">AMB-A12 · 94% Match</span>
                </div>
              </div>

              <!-- ==============================================
                   TIER 2: RESPONDER, ROUTE & COMMAND LAYER
              =============================================== -->
              <!-- Node 6: Responder Network -->
              <div
                class="wf-card node-pos"
                :style="{ left: '160px', top: '440px' }"
                :class="{ 'wf-card-active': isNodeActive('responder'), 'wf-card-selected': selectedNodeKey === 'responder' }"
                @click="selectNode('responder')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-emerald">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Responder Fleet</div>
                    <div class="wf-node-sub">Professional EMTs &amp; Community Mesh</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>En Route</span>
                  <span class="wf-metric-tag font-mono">{{ responderStore.responders.length }} Units Active</span>
                </div>
              </div>

              <!-- Node 7: GIS / Route Intelligence -->
              <div
                class="wf-card node-pos"
                :style="{ left: '520px', top: '440px' }"
                :class="{ 'wf-card-active': isNodeActive('gis'), 'wf-card-selected': selectedNodeKey === 'gis' }"
                @click="selectNode('gis')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-cyan">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">GIS Route Mesh</div>
                    <div class="wf-node-sub">Emergency Corridor Optimization</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>Optimized</span>
                  <span class="wf-metric-tag font-mono">ETA: 8m vs 18m Std</span>
                </div>
              </div>

              <!-- Node 8: Command Center Orchestration -->
              <div
                class="wf-card node-pos"
                :style="{ left: '880px', top: '440px' }"
                :class="{ 'wf-card-active': isNodeActive('command'), 'wf-card-selected': selectedNodeKey === 'command' }"
                @click="selectNode('command')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-blue">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Tactical Command</div>
                    <div class="wf-node-sub">Real-Time Operations Console</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>Operational</span>
                  <span class="wf-metric-tag font-mono">Active: {{ incidentStore.activeIncidentsCount }}</span>
                </div>
              </div>

              <!-- ==============================================
                   TIER 3: HOSPITAL, RESOURCE & SURVIVOR LAYER
              =============================================== -->
              <!-- Node 9: Hospital Intelligence -->
              <div
                class="wf-card node-pos"
                :style="{ left: '160px', top: '640px' }"
                :class="{ 'wf-card-active': isNodeActive('hospital'), 'wf-card-selected': selectedNodeKey === 'hospital' }"
                @click="selectNode('hospital')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-cyan">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Hospital Mesh</div>
                    <div class="wf-node-sub">ICU &amp; Trauma Intake Reservation</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>Reserved</span>
                  <span class="wf-metric-tag font-mono">City General · ICU Ready</span>
                </div>
              </div>

              <!-- Node 10: Resource Coordination -->
              <div
                class="wf-card node-pos"
                :style="{ left: '520px', top: '640px' }"
                :class="{ 'wf-card-active': isNodeActive('resource'), 'wf-card-selected': selectedNodeKey === 'resource' }"
                @click="selectNode('resource')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-amber">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Resources &amp; Supplies</div>
                    <div class="wf-node-sub">Cross-Agency Mutual Aid</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>Synchronized</span>
                  <span class="wf-metric-tag font-mono">Oxygen / Drones Allocated</span>
                </div>
              </div>

              <!-- Node 11: Survivor / Family Safety -->
              <div
                class="wf-card node-pos"
                :style="{ left: '880px', top: '640px' }"
                :class="{ 'wf-card-active': isNodeActive('survivor'), 'wf-card-selected': selectedNodeKey === 'survivor' }"
                @click="selectNode('survivor')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-port port-bottom"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-emerald">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Family Safety Mesh</div>
                    <div class="wf-node-sub">Survivor Check-In &amp; Notification</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>Broadcast Live</span>
                  <span class="wf-metric-tag font-mono">6 Safe · 2 Hospitalized</span>
                </div>
              </div>

              <!-- ==============================================
                   TIER 4: EVIDENCE, RESOLUTION & AUDIT LAYER
              =============================================== -->
              <!-- Node 12: Evidence & Audit Vault -->
              <div
                class="wf-card node-pos"
                :style="{ left: '340px', top: '840px' }"
                :class="{ 'wf-card-active': isNodeActive('audit'), 'wf-card-selected': selectedNodeKey === 'audit' }"
                @click="selectNode('audit')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-blue">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">SHA-256 Audit Vault</div>
                    <div class="wf-node-sub">Tamper-Evident Incident Ledger</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse green"></span>Verified</span>
                  <span class="wf-metric-tag font-mono">Immutable Hash Locked</span>
                </div>
              </div>

              <!-- Node 13: Analytics & Post-Incident Prediction -->
              <div
                class="wf-card node-pos"
                :style="{ left: '700px', top: '840px' }"
                :class="{ 'wf-card-active': isNodeActive('analytics'), 'wf-card-selected': selectedNodeKey === 'analytics' }"
                @click="selectNode('analytics')"
              >
                <div class="wf-port port-top"></div>
                <div class="wf-card-header">
                  <div class="wf-node-icon bg-purple">
                    <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                  </div>
                  <div class="wf-node-meta">
                    <div class="wf-node-title">Analytics &amp; Intelligence</div>
                    <div class="wf-node-sub">Performance, MTTR &amp; Prediction</div>
                  </div>
                  <button class="wf-card-dots">•••</button>
                </div>
                <div class="wf-card-divider"></div>
                <div class="wf-card-footer">
                  <span class="wf-status-active"><span class="status-dot-pulse purple"></span>Reporting</span>
                  <span class="wf-metric-tag font-mono">Avg MTTR: 4.2m</span>
                </div>
              </div>

            </div>
          </div>

          <!-- FLOATING CANVAS CONTROLS (ZOOM / PAN / RESET / FIT) -->
          <div class="wf-hud-toolbar">
            <button class="hud-btn" @click="zoomIn" title="Zoom In (+)">
              <span>+</span>
            </button>
            <div class="hud-zoom-val font-mono">{{ Math.round(zoomLevel * 100) }}%</div>
            <button class="hud-btn" @click="zoomOut" title="Zoom Out (−)">
              <span>−</span>
            </button>
            <button class="hud-btn text-btn" @click="fitToScreen" title="Fit to Screen">
              <span>FIT</span>
            </button>
            <button class="hud-btn text-btn" @click="resetView" title="Reset View">
              <span>RESET</span>
            </button>
          </div>

          <!-- NODE INSPECTOR / DETAIL DRAWER -->
          <Transition name="inspector-slide">
            <div v-if="selectedNodeData" class="wf-inspector-card">
              <div class="inspector-header">
                <div class="ins-title-row">
                  <span class="ins-badge">{{ selectedNodeData.badge }}</span>
                  <h3 class="ins-title">{{ selectedNodeData.title }}</h3>
                </div>
                <button class="ins-close" @click="selectedNodeKey = null">✕</button>
              </div>
              <p class="ins-desc">{{ selectedNodeData.desc }}</p>
              
              <div class="inspector-params-grid">
                <div v-for="(val, key) in selectedNodeData.params" :key="key" class="ins-param-item">
                  <span class="param-name">{{ key }}</span>
                  <span class="param-val font-mono">{{ val }}</span>
                </div>
              </div>

              <div class="inspector-footer">
                <span class="ins-live-time font-mono">TELEMETRY SYNCHRONIZED · {{ liveTimestamp }}</span>
              </div>
            </div>
          </Transition>

        </div>

        <!-- BOTTOM STATUS BAR -->
        <footer class="wf-footer">
          <div class="wf-footer-left">
            <span class="footer-dot"></span>
            <span class="footer-status font-mono">LIVE SOCKET.IO MESH CONNECTED</span>
            <span class="footer-sep">·</span>
            <span class="footer-inc font-mono">ACTIVE FOCUS: #{{ activeIncident?.id || 'INC-1042' }}</span>
          </div>

          <!-- Stage Lifecycle Tracker Pills -->
          <div class="wf-stages-tracker">
            <div
              v-for="(stg, i) in lifecycleStages"
              :key="i"
              :class="['tracker-step', { 'step-done': isStageCompleted(stg.id), 'step-current': isStageCurrent(stg.id) }]"
            >
              <span class="step-num">{{ i + 1 }}</span>
              <span class="step-name">{{ stg.label }}</span>
            </div>
          </div>

          <div class="wf-footer-right">
            <span class="font-mono text-cyan">DRAG TO PAN · SCROLL TO ZOOM</span>
          </div>
        </footer>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';

const uiStore = useUiStore();
const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const canvasViewport = ref(null);
const canvasWidth = 1280;
const canvasHeight = 1000;

// Pan & Zoom state
const panX = ref(40);
const panY = ref(20);
const zoomLevel = ref(0.95);
const isPanning = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);

// Selected incident & Node Inspector state
const selectedIncidentId = ref('INC-1042');
const selectedNodeKey = ref(null);
const liveTimestamp = ref('');

const activeIncident = computed(() => {
  if (!incidentStore.incidents.length) return null;
  return incidentStore.incidents.find(i => i.id === selectedIncidentId.value) || incidentStore.selectedIncident || incidentStore.incidents[0];
});

watch(() => incidentStore.selectedIncident, (newInc) => {
  if (newInc && newInc.id) {
    selectedIncidentId.value = newInc.id;
  }
}, { immediate: true });

function onIncidentChange() {
  const found = incidentStore.incidents.find(i => i.id === selectedIncidentId.value);
  if (found) {
    incidentStore.selectIncident(found);
  }
}

// Lifecycle Stages Definition
const lifecycleStages = [
  { id: 'REPORTED', label: 'Report' },
  { id: 'ANALYZED', label: 'AI Triage' },
  { id: 'VERIFIED', label: 'Verified' },
  { id: 'PRIORITIZED', label: 'Priority' },
  { id: 'DISPATCHING', label: 'Dispatch' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'EN_ROUTE', label: 'En Route' },
  { id: 'ON_SCENE', label: 'On Scene' },
  { id: 'HOSPITAL', label: 'Hospital' },
  { id: 'RESOLVED', label: 'Resolved' }
];

const currentStageName = computed(() => {
  const st = activeIncident.value?.status || 'DISPATCHING';
  return st.replace('_', ' ');
});

function isStageCompleted(stageId) {
  const order = ['REPORTED', 'ANALYZED', 'VERIFIED', 'PRIORITIZED', 'DISPATCHING', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'HOSPITAL', 'RESOLVED'];
  const current = activeIncident.value?.status || 'DISPATCHING';
  return order.indexOf(stageId) <= order.indexOf(current);
}

function isStageCurrent(stageId) {
  const current = activeIncident.value?.status || 'DISPATCHING';
  return current === stageId;
}

function isNodeActive(nodeKey) {
  const current = activeIncident.value?.status || 'DISPATCHING';
  switch (nodeKey) {
    case 'citizen': return true;
    case 'ai': return true;
    case 'disaster': return disasterStore.isDisasterMode;
    case 'incident_core': return true;
    case 'priority': return true;
    case 'dispatch': return ['DISPATCHING', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(current);
    case 'responder': return ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE'].includes(current);
    case 'gis': return ['EN_ROUTE', 'ON_SCENE'].includes(current);
    case 'command': return true;
    case 'hospital': return ['ON_SCENE', 'HOSPITAL'].includes(current);
    case 'resource': return true;
    case 'survivor': return true;
    case 'audit': return true;
    case 'analytics': return current === 'RESOLVED';
    default: return false;
  }
}

// Computed SVG Connections (Orthogonal smooth bezier paths)
const computedConnections = computed(() => {
  return [
    // Citizen (300, 110) -> Core Hub Top (680, 230)
    { d: 'M 300,110 C 300,170 680,170 680,230', active: true },
    // AI (660, 110) -> Core Hub Top (680, 230)
    { d: 'M 660,110 C 660,170 680,170 680,230', active: true },
    // Disaster (1020, 110) -> Core Hub Top (680, 230)
    { d: 'M 1020,110 C 1020,170 680,170 680,230', active: disasterStore.isDisasterMode },
    // Priority (300, 310) -> Core Hub Left (560, 290)
    { d: 'M 440,310 C 500,310 500,290 560,290', active: true },
    // Core Hub Right (800, 290) -> Dispatch (880, 310)
    { d: 'M 800,290 C 840,290 840,310 880,310', active: isNodeActive('dispatch') },
    // Core Hub Bottom (680, 350) -> GIS (660, 440)
    { d: 'M 680,350 C 680,395 660,395 660,440', active: isNodeActive('gis') },
    // Core Hub Bottom (680, 350) -> Responder (300, 440)
    { d: 'M 680,350 C 680,395 300,395 300,440', active: isNodeActive('responder') },
    // Core Hub Bottom (680, 350) -> Command Center (1020, 440)
    { d: 'M 680,350 C 680,395 1020,395 1020,440', active: true },
    // Responder (300, 510) -> Hospital (300, 640)
    { d: 'M 300,510 C 300,575 300,575 300,640', active: isNodeActive('hospital') },
    // GIS (660, 510) -> Resources (660, 640)
    { d: 'M 660,510 C 660,575 660,575 660,640', active: true },
    // Command Center (1020, 510) -> Survivor Safety (1020, 640)
    { d: 'M 1020,510 C 1020,575 1020,575 1020,640', active: true },
    // Hospital (300, 710) -> Audit (480, 840)
    { d: 'M 300,710 C 300,775 480,775 480,840', active: true },
    // Resources (660, 710) -> Analytics (840, 840)
    { d: 'M 660,710 C 660,775 840,775 840,840', active: isNodeActive('analytics') },
    // Survivor Safety (1020, 710) -> Analytics (840, 840)
    { d: 'M 1020,710 C 1020,775 840,775 840,840', active: true }
  ];
});

// Interactive Node Inspector Details
const nodeDetailsMap = computed(() => {
  const inc = activeIncident.value;
  return {
    citizen: {
      badge: 'INTAKE LAYER',
      title: 'Citizen Emergency Intake',
      desc: 'Multimodal distress signal capture supporting voice, multilingual transcription, and instant GPS geolocation.',
      params: {
        'Reporting Channel': 'Multilingual Voice SOS (Tamil/English/Hindi/Telugu)',
        'GPS Location': inc?.location || '42 Harbour Road, Sector 4',
        'Caller Distress': 'High Urgency Acoustic Frequency',
        'Media Attached': 'Structural Defect Photos (SHA-256 Signed)'
      }
    },
    ai: {
      badge: 'NLP & TRIAGE',
      title: 'AI Emergency Intelligence Engine',
      desc: 'Deep learning entity extraction, casualty counting, trapped victim detection, and hazard classification.',
      params: {
        'Extracted Entity': inc?.title || 'Commercial Building Collapse',
        'Casualty Count': `${inc?.victimCount || 8} Victims Trapped`,
        'Emotion Signal': 'Panicked (Urgency 94%)',
        'Hazard Classification': 'Active Structural Failure & Dust Inhalation'
      }
    },
    incident_core: {
      badge: 'CORE ORCHESTRATION',
      title: 'ResQ Core Incident Engine',
      desc: 'Central state machine maintaining ACID concurrency locks against double-dispatch race conditions.',
      params: {
        'Incident ID': `#${inc?.id || 'INC-1042'}`,
        'Status': inc?.status || 'DISPATCHING',
        'Priority Score': `${inc?.priorityScore || 96}/100`,
        'Concurrency State': 'PostgreSQL Row Lock Active'
      }
    },
    priority: {
      badge: 'DYNAMIC ALGORITHM',
      title: '6-Factor Priority Scoring Engine',
      desc: 'Real-time multi-dimensional scoring incorporating casualties, hazards, vulnerability, and response latency.',
      params: {
        'Computed Priority': `${inc?.priorityScore || 96} / 100 (CRITICAL)`,
        'Factor 1: Victims': '+35 pts (Trapped Persons Confirmed)',
        'Factor 2: Hazard': '+25 pts (Structural Collapse)',
        'Factor 3: Surge Delay': '+15 pts (High Sector Density)'
      }
    },
    dispatch: {
      badge: 'INTELLIGENT MATCHING',
      title: 'Dispatch & Unit Assignment Engine',
      desc: 'Algorithmic unit selection optimizing proximity, equipment readiness, responder fatigue, and traffic corridors.',
      params: {
        'Recommended Unit': 'AMB-A12 (Heavy Trauma Ambulance)',
        'Match Compatibility': '94.2% (Equipped with Hydraulic Jaws & AED)',
        'Estimated ETA': '3 Minutes (1.4 km corridor)',
        'Fatigue Rating': '24% (Well Rested)'
      }
    },
    responder: {
      badge: 'FLEET & COMMUNITY',
      title: 'Responder Network Mesh',
      desc: 'Synchronized field communications connecting professional EMTs, Fire units, and 500m hyper-local CPR volunteers.',
      params: {
        'Assigned Unit': 'AMB-A12 (Driver: Capt. R. Sharma)',
        'Community Check-In': '2 Certified First-Aid Responders On Scene',
        'Telemetry Interval': '1000ms WebSocket GPS Vector',
        'Duty Shift Duration': '4.5 Hours'
      }
    },
    gis: {
      badge: 'ROUTE OPTIMIZATION',
      title: 'Tactical GIS Route Mesh',
      desc: 'Dynamic road vector calculation routing around hazard polygons, simulated roadblocks, and congested arteries.',
      params: {
        'Corridor Routing': 'Emergency Green Wave Active',
        'Travel Time Comparison': '8 Minutes (Corridor) vs 18 Minutes (Standard)',
        'Hazard Avoidance': '1 Roadblock bypassed near Sector 4 Bridge',
        'GIS Provider': 'OpenFreeMap & MapLibre GL'
      }
    },
    command: {
      badge: 'OPERATIONS HUB',
      title: 'Tactical Command Center',
      desc: 'Joint operations dashboard providing live surveillance, multi-agency synchronization, and manual override capability.',
      params: {
        'Active Operations': `${incidentStore.activeIncidentsCount} Concurrent Incidents`,
        'Critical Alerts': `${incidentStore.criticalIncidents.length} Red Level`,
        'Total Responders': `${responderStore.responders.length} Units Online`,
        'WebSocket Uplink': 'Active (0.5ms Ping)'
      }
    },
    hospital: {
      badge: 'CAPACITY & INTAKE',
      title: 'Hospital Emergency Network',
      desc: 'Automated pre-arrival ICU bed reservation, trauma bay prep, and regional inter-hospital load balancing.',
      params: {
        'Destination': 'City General Hospital (Trauma Center 1)',
        'Reserved Capacity': '2 ICU Beds, 1 Surgery Suite On Hold',
        'ETA to Hospital': '6 Minutes Post-Extraction',
        'Mesh Occupancy': '72% Total Bed Utilization'
      }
    },
    resource: {
      badge: 'SUPPLY LOGISTICS',
      title: 'Resource Coordination Mesh',
      desc: 'Autonomous cross-agency supply tracking managing oxygen tanks, ventilators, extrication tools, and drones.',
      params: {
        'Medical Drones': '2 Drones En Route with Trauma Plasma',
        'Heavy Equipment': '1 Crane Unit Dispatched',
        'Shelter Readiness': `${disasterStore.shelters.length} Relief Centers Active`,
        'Stock Reserve': 'Optimal across 5 regional depots'
      }
    },
    survivor: {
      badge: 'PUBLIC ASSURANCE',
      title: 'Family & Survivor Safety Circle',
      desc: 'Real-time safety status broadcasts, shelter capacity check-ins, and verified victim reunification network.',
      params: {
        'Verified Status': '6 Safe in Shelter 02, 2 Transporting',
        'Family Broadcasts': '14 Automated SMS Alerts Delivered',
        'Public Alert Mesh': 'Geofenced Warning Broadcast Active'
      }
    },
    disaster: {
      badge: 'EARLY WARNING',
      title: 'Disaster Prediction & Surge Models',
      desc: 'Meteorological and structural risk forecasting with automated metropolitan level-3 disaster mode activation.',
      params: {
        'Disaster Status': disasterStore.isDisasterMode ? 'LEVEL 3 SURGE PROTOCOL' : 'STANDBY MONITORING',
        'Affected Zone': 'Sector 04 Industrial Core',
        'Incident Projection': '147 Projected Incidents over 12h'
      }
    },
    audit: {
      badge: 'INTEGRITY & PROOF',
      title: 'SHA-256 Evidence & Audit Ledger',
      desc: 'Immutable cryptographic chain-of-custody recording dispatch timestamps, audio logs, and sensor telemetry.',
      params: {
        'Genesis Hash': '8f7d3a...e4b2 (SHA-256)',
        'Chain State': 'Synchronized & Cryptographically Sealed',
        'Audit Events': '48 Timestamped Transactions'
      }
    },
    analytics: {
      badge: 'POST-CRISIS AI',
      title: 'Analytics & Continuous Learning',
      desc: 'Machine learning performance analytics measuring Mean Time To Respond (MTTR) and model refinement.',
      params: {
        'Mean Response Time': '4 Minutes 12 Seconds',
        'AI Match Precision': '96.42% Benchmark Rating',
        'Training Database': 'Trained on 48,000 Historical Scenarios'
      }
    }
  };
});

const selectedNodeData = computed(() => {
  if (!selectedNodeKey.value) return null;
  return nodeDetailsMap.value[selectedNodeKey.value] || null;
});

function selectNode(key) {
  selectedNodeKey.value = selectedNodeKey.value === key ? null : key;
}

// Pan & Zoom handlers
function startPan(e) {
  if (e.target.closest('.wf-card') || e.target.closest('.wf-central-hub') || e.target.closest('.wf-hud-toolbar') || e.target.closest('.wf-inspector-card')) return;
  isPanning.value = true;
  startMouseX.value = e.clientX - panX.value;
  startMouseY.value = e.clientY - panY.value;
}

function doPan(e) {
  if (!isPanning.value) return;
  panX.value = e.clientX - startMouseX.value;
  panY.value = e.clientY - startMouseY.value;
}

function endPan() {
  isPanning.value = false;
}

function handleWheel(e) {
  const delta = e.deltaY > 0 ? -0.08 : 0.08;
  zoomLevel.value = Math.min(Math.max(zoomLevel.value + delta, 0.45), 2.2);
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.15, 2.2);
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.15, 0.45);
}

function resetView() {
  panX.value = 40;
  panY.value = 20;
  zoomLevel.value = 0.95;
}

function fitToScreen() {
  if (!canvasViewport.value) return;
  const rect = canvasViewport.value.getBoundingClientRect();
  const scaleX = rect.width / (canvasWidth + 80);
  const scaleY = rect.height / (canvasHeight + 80);
  zoomLevel.value = Math.min(scaleX, scaleY, 1.0);
  panX.value = (rect.width - canvasWidth * zoomLevel.value) / 2;
  panY.value = 20;
}

let timer = null;
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function updateTime() {
  const now = new Date();
  liveTimestamp.value = now.toISOString().slice(11, 19) + ' UTC';
}
</script>

<style scoped>
/* ─── FULLSCREEN OVERLAY ─────────────────────────────── */
.workflow-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #080c14;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: #f8fafc;
  outline: none;
}

/* ─── HEADER ─────────────────────────────────────────── */
.wf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  background: rgba(13, 20, 36, 0.96);
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  gap: 1rem;
  z-index: 20;
}

.wf-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wf-logo-box {
  position: relative;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.wf-logo-text {
  font-size: 1.2rem;
  color: #38bdf8;
}

.wf-logo-pulse {
  position: absolute;
  top: -3px; left: -3px; right: -3px; bottom: -3px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 0.2; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.wf-main-title {
  font-family: var(--font-display, "Space Grotesk", sans-serif);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.wf-live-tag {
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  letter-spacing: 0.08em;
}

.wf-sub-title {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-top: 1px;
}

.wf-header-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: center;
}

.incident-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
}

.sel-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748b;
}

.incident-select {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.72rem;
  font-weight: 700;
  outline: none;
  cursor: pointer;
}

.incident-select option {
  background: #0f172a;
  color: #f8fafc;
}

.wf-kpi-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
}

.kpi-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-cyan   { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
.dot-amber  { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.dot-red    { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
.dot-emerald{ background: #10b981; box-shadow: 0 0 6px #10b981; }

.kpi-name {
  font-family: var(--font-mono, monospace);
  font-size: 0.6rem;
  color: #64748b;
}

.kpi-val {
  font-size: 0.7rem;
  font-weight: 700;
}

.wf-btn-close {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fda4af;
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.4rem 0.85rem;
  border-radius: 7px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wf-btn-close:hover {
  background: rgba(244, 63, 94, 0.3);
  border-color: rgba(244, 63, 94, 0.7);
  color: #ffffff;
}

/* ─── CANVAS VIEWPORT ────────────────────────────────── */
.wf-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
  /* Dot Matrix Tactical Background */
  background-color: #0b0f19;
  background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px);
  background-size: 24px 24px;
  user-select: none;
}

.wf-viewport:active {
  cursor: grabbing;
}

.wf-canvas-content {
  position: absolute;
  width: 1280px;
  height: 1000px;
  left: 0;
  top: 0;
  transition: transform 0.05s ease-out;
}

/* ─── SVG CONNECTORS ─────────────────────────────────── */
.wf-connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.conn-path {
  transition: stroke 0.3s ease;
}

.conn-path.conn-active {
  animation: marching-dashes 1.2s linear infinite;
}

@keyframes marching-dashes {
  from { stroke-dashoffset: 24; }
  to { stroke-dashoffset: 0; }
}

/* ─── NODES LAYER ────────────────────────────────────── */
.wf-nodes-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 5;
}

/* ─── CARD NODE COMPONENT (MATCHING REFERENCE IMAGE) ── */
.wf-card {
  position: absolute;
  width: 280px;
  background: rgba(18, 24, 38, 0.94);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}

.wf-card:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 14px 36px -6px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.2);
}

.wf-card.wf-card-active {
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 14px rgba(56, 189, 248, 0.25);
}

.wf-card.wf-card-selected {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3), 0 14px 40px rgba(0, 0, 0, 0.8);
}

/* Connection Ports (White dots like reference) */
.wf-port {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #ffffff;
  border: 2px solid #0f172a;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.port-top    { top: -5px; left: 50%; transform: translateX(-50%); }
.port-bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
.port-left   { left: -5px; top: 50%; transform: translateY(-50%); }
.port-right  { right: -5px; top: 50%; transform: translateY(-50%); }

.wf-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.wf-node-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-svg {
  width: 20px;
  height: 20px;
}

.bg-red     { background: rgba(244, 63, 94, 0.16); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.3); }
.bg-cyan    { background: rgba(56, 189, 248, 0.16); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); }
.bg-emerald { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
.bg-amber   { background: rgba(245, 158, 11, 0.16); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.3); }
.bg-orange  { background: rgba(251, 146, 60, 0.16); color: #fdba74; border: 1px solid rgba(251, 146, 60, 0.3); }
.bg-purple  { background: rgba(129, 140, 248, 0.16); color: #c7d2fe; border: 1px solid rgba(129, 140, 248, 0.3); }
.bg-blue    { background: rgba(59, 130, 246, 0.16); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }

.wf-node-meta {
  flex: 1;
  min-width: 0;
}

.wf-node-title {
  font-family: var(--font-display, sans-serif);
  font-size: 0.85rem;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-node-sub {
  font-size: 0.65rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.wf-card-dots {
  background: transparent;
  border: none;
  color: #475569;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0 0.2rem;
  transition: color 0.15s;
}

.wf-card:hover .wf-card-dots {
  color: #94a3b8;
}

.wf-card-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0.6rem 0;
}

.wf-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wf-status-active {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: #10b981;
}

.status-dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot-pulse.green  { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot-pulse.cyan   { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
.status-dot-pulse.amber  { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.status-dot-pulse.red    { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
.status-dot-pulse.purple { background: #818cf8; box-shadow: 0 0 6px #818cf8; }

.wf-metric-tag {
  font-size: 0.62rem;
  color: #94a3b8;
}

/* ─── CENTRAL ORCHESTRATOR HUB ───────────────────────── */
.wf-central-hub {
  position: absolute;
  width: 240px;
  height: 120px;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
  border: 1.5px solid rgba(56, 189, 248, 0.4);
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.wf-central-hub:hover, .wf-central-hub.wf-card-selected {
  border-color: #38bdf8;
  box-shadow: 0 0 40px rgba(56, 189, 248, 0.4);
  transform: scale(1.03);
}

.hub-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.15rem;
}

.hub-emblem {
  font-size: 1.5rem;
  color: #38bdf8;
  line-height: 1;
}

.hub-title {
  font-family: var(--font-display, sans-serif);
  font-size: 0.82rem;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.06em;
}

.hub-sub {
  font-size: 0.64rem;
  font-weight: 700;
  color: #38bdf8;
}

.hub-tag {
  font-size: 0.52rem;
  font-weight: 800;
  color: #10b981;
  letter-spacing: 0.05em;
  background: rgba(16, 185, 129, 0.12);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

/* ─── HUD TOOLBAR ────────────────────────────────────── */
.wf-hud-toolbar {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  padding: 0.35rem 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  z-index: 50;
}

.hud-btn {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hud-btn.text-btn {
  width: auto;
  padding: 0 0.5rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
}

.hud-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  color: #38bdf8;
}

.hud-zoom-val {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  padding: 0 0.4rem;
}

/* ─── NODE INSPECTOR CARD ────────────────────────────── */
.wf-inspector-card {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 320px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 14px;
  padding: 1.1rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
  z-index: 50;
}

.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.ins-badge {
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.ins-title {
  font-family: var(--font-display, sans-serif);
  font-size: 0.95rem;
  font-weight: 800;
  color: #f8fafc;
  margin-top: 0.2rem;
}

.ins-close {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.85rem;
}

.ins-close:hover { color: #f8fafc; }

.ins-desc {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.4;
  margin-bottom: 0.85rem;
}

.inspector-params-grid {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: rgba(8, 12, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.65rem;
  margin-bottom: 0.75rem;
}

.ins-param-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.param-name {
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  color: #64748b;
  text-transform: uppercase;
}

.param-val {
  font-size: 0.68rem;
  color: #e2e8f0;
  font-weight: 600;
}

.inspector-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.5rem;
}

.ins-live-time {
  font-size: 0.58rem;
  color: #64748b;
}

/* ─── FOOTER ─────────────────────────────────────────── */
.wf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.25rem;
  background: rgba(13, 20, 36, 0.96);
  border-top: 1px solid rgba(56, 189, 248, 0.2);
  flex-shrink: 0;
  z-index: 20;
}

.wf-footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  color: #94a3b8;
}

.footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.footer-sep { color: #475569; }

.wf-stages-tracker {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.tracker-step {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.45rem;
  border-radius: 5px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  color: #64748b;
}

.tracker-step .step-num {
  font-weight: 700;
}

.tracker-step.step-done {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.tracker-step.step-current {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: #fde68a;
  font-weight: 700;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.wf-footer-right {
  font-size: 0.62rem;
}

/* ─── UTILITIES & TRANSITIONS ────────────────────────── */
.text-cyan    { color: #38bdf8; }
.text-amber   { color: #f59e0b; }
.text-red     { color: #f43f5e; }
.text-emerald { color: #10b981; }

.workflow-fade-enter-active,
.workflow-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.workflow-fade-enter-from,
.workflow-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.inspector-slide-enter-active,
.inspector-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.inspector-slide-enter-from,
.inspector-slide-leave-to {
  opacity: 0;
  transform: translateX(15px);
}
</style>
