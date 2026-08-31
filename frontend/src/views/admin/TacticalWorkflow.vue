<template>
  <div class="tactical-workflow-view">
    <!-- TOP COMMAND HEADER -->
    <header class="wf-header">
      <div class="wf-header-left">
        <!-- Direct Quick Navigation Shortcuts -->
        <div class="nav-shortcuts">
          <router-link to="/" class="nav-shortcut-btn font-mono" title="Go to ResQNet Home">
            🏠 Home
          </router-link>
          <router-link to="/admin/command" class="nav-shortcut-btn font-mono" title="Go to Command Center">
            🎯 Command
          </router-link>
          <router-link to="/citizen" class="nav-shortcut-btn font-mono" title="Go to Citizen Portal">
            📱 Citizen
          </router-link>
        </div>

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

      <!-- Incident Selector & Interactive Stage Simulation Controls -->
      <div class="wf-header-center">
        <div class="incident-selector-wrapper">
          <label class="sel-label">INCIDENT:</label>
          <select v-model="selectedIncidentId" @change="onIncidentChange" class="incident-select font-mono">
            <option v-for="inc in allIncidents" :key="inc.id" :value="inc.id">
              #{{ inc.id }} · {{ inc.title }}
            </option>
          </select>
        </div>

        <!-- Interactive Stage Simulator Toolbar -->
        <div class="stage-sim-toolbar">
          <label class="sel-label">SIMULATE STAGE:</label>
          <select v-model="currentSimulatedStatus" class="stage-select font-mono">
            <option v-for="(stg, idx) in lifecycleStages" :key="stg.id" :value="stg.id">
              Stage {{ idx + 1 }}: {{ stg.label }} ({{ stg.id }})
            </option>
          </select>

          <div class="sim-btn-group">
            <button class="sim-btn" @click="prevStage" :disabled="currentStageIndex === 0" title="Previous Stage (←)">
              ◀ PREV
            </button>
            <button class="sim-btn sim-btn-play" :class="{ 'btn-playing': isSimulating }" @click="toggleSimulation" title="Auto-Play 10-Stage Lifecycle">
              {{ isSimulating ? '⏸ PAUSE' : '▶ AUTO PLAY' }}
            </button>
            <button class="sim-btn" @click="nextStage" :disabled="currentStageIndex === lifecycleStages.length - 1" title="Next Stage (→)">
              NEXT ▶
            </button>
          </div>
        </div>

        <div class="wf-kpi-pill">
          <span class="kpi-dot dot-cyan"></span>
          <span class="kpi-name">STAGE:</span>
          <span class="kpi-val text-cyan font-mono">{{ currentStageIndex + 1 }}/10 ({{ currentStageName }})</span>
        </div>

        <div class="wf-kpi-pill">
          <span class="kpi-dot dot-amber"></span>
          <span class="kpi-name">PRIORITY:</span>
          <span class="kpi-val text-amber font-mono">{{ activeIncident?.priorityScore || 96 }}/100</span>
        </div>
      </div>

      <!-- Header Actions & Directory Switcher -->
      <div class="wf-header-right">
        <div class="directory-dropdown-wrapper">
          <button class="wf-btn wf-btn-dir font-mono" @click="directoryOpen = !directoryOpen" title="Jump directly to any platform page">
            <span>🌐 DIRECTORY {{ directoryOpen ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="directoryOpen" class="dir-menu">
            <div class="dir-header font-mono">⚡ RESQNET DIRECTORY</div>
            <router-link to="/" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🏠</span>
              <div class="dir-text">
                <strong>Landing Page</strong>
                <small>Public Portal Overview</small>
              </div>
            </router-link>
            <router-link to="/admin/command" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🎯</span>
              <div class="dir-text">
                <strong>Command Center</strong>
                <small>Live Map &amp; Tactical Dispatch</small>
              </div>
            </router-link>
            <router-link to="/citizen" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">📱</span>
              <div class="dir-text">
                <strong>Citizen Portal</strong>
                <small>Citizen Safety &amp; Tracking</small>
              </div>
            </router-link>
            <router-link to="/citizen/report" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🚨</span>
              <div class="dir-text">
                <strong>Report Emergency</strong>
                <small>GPS Lock &amp; Map Pinning</small>
              </div>
            </router-link>
            <router-link to="/citizen/voice" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🎙️</span>
              <div class="dir-text">
                <strong>Multilingual Voice SOS</strong>
                <small>Voice Emergency AI</small>
              </div>
            </router-link>
            <router-link to="/admin/disaster" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🌪️</span>
              <div class="dir-text">
                <strong>Disaster Controller</strong>
                <small>Disaster Mode &amp; Surge</small>
              </div>
            </router-link>
            <router-link to="/admin/simulation" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">⚡</span>
              <div class="dir-text">
                <strong>Disaster Simulator</strong>
                <small>Simulation Scenarios</small>
              </div>
            </router-link>
            <router-link to="/responder" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🚑</span>
              <div class="dir-text">
                <strong>Field Responder Mesh</strong>
                <small>EMT &amp; Rescue Response</small>
              </div>
            </router-link>
            <router-link to="/hospital" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🏥</span>
              <div class="dir-text">
                <strong>Hospital Bed Mesh</strong>
                <small>Trauma &amp; ICU Beds</small>
              </div>
            </router-link>
            <router-link to="/login" class="dir-item" @click="directoryOpen = false">
              <span class="dir-icon">🔐</span>
              <div class="dir-text">
                <strong>Login Portal</strong>
                <small>Access Gateways</small>
              </div>
            </router-link>
          </div>
        </div>

        <button class="wf-btn wf-btn-close font-mono" @click="goBack" title="Return to Previous Page or Home">
          <span class="close-icon">✕</span>
          <span>EXIT WORKFLOW</span>
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

          <!-- SVG Flow Connections -->
          <g v-for="(conn, idx) in computedConnections" :key="idx">
            <!-- Background base path -->
            <path
              :d="conn.d"
              class="conn-base-path"
              :class="{ 'conn-active-glow': conn.active }"
            />
            <!-- Animated dashed flow particles -->
            <path
              v-if="conn.active"
              :d="conn.d"
              class="conn-flow-particle"
              filter="url(#glow-cyan)"
            />
          </g>
        </svg>

        <!-- =========================================================================
             TACTICAL WORKFLOW NODES (13 INTERACTIVE SYSTEM COMPONENTS)
             ========================================================================= -->
        <div class="wf-nodes-layer">

          <!-- ==============================================
               TIER 1: INTAKE & THREAT SENSING LAYER
          =============================================== -->
          <!-- Node 1: Citizen Intake -->
          <div
            class="wf-card node-pos"
            :style="{ left: '140px', top: '25px' }"
            :class="{ 'wf-card-active': isNodeActive('citizen'), 'wf-card-selected': selectedNodeKey === 'citizen' }"
            @click="selectNode('citizen')"
          >
            <div class="wf-port port-bottom"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-red">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">1. Citizen Intake</div>
                <div class="wf-node-sub">Voice / Text / Multilingual SOS</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse green"></span>Active</span>
              <span class="wf-metric-tag font-mono">GPS: {{ activeIncident?.location || '42 Harbour Rd' }}</span>
            </div>
          </div>

          <!-- Node 2: AI Intelligence -->
          <div
            class="wf-card node-pos"
            :style="{ left: '500px', top: '25px' }"
            :class="{ 'wf-card-active': isNodeActive('ai'), 'wf-card-selected': selectedNodeKey === 'ai' }"
            @click="selectNode('ai')"
          >
            <div class="wf-port port-bottom"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-cyan">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2v1.09A6 6 0 0 1 18.91 10H20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.09A6 6 0 0 1 14 20.91V22a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1.09A6 6 0 0 1 3.09 16H2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1.09A6 6 0 0 1 8 5.09V4a2 2 0 0 1 2-2z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">2. AI Intelligence</div>
                <div class="wf-node-sub">Multilingual NLP &amp; Emotion Triage</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>{{ currentStageIndex >= 1 ? 'Analyzed' : 'Awaiting Signal' }}</span>
              <span class="wf-metric-tag font-mono">Casualties: {{ activeIncident?.victimCount || 8 }} · Urgency 94%</span>
            </div>
          </div>

          <!-- Node 3: Disaster Intelligence -->
          <div
            class="wf-card node-pos"
            :style="{ left: '860px', top: '25px' }"
            :class="{ 'wf-card-active': isNodeActive('disaster'), 'wf-card-selected': selectedNodeKey === 'disaster' }"
            @click="selectNode('disaster')"
          >
            <div class="wf-port port-bottom"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-orange">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2L1 21h22L12 2zm0 3.8l7.53 13.2H4.47L12 5.8zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">3. Disaster Models</div>
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
               TIER 2: CENTRAL CORE & SCORING LAYER
          =============================================== -->
          <!-- Node 4: Priority Engine Box -->
          <div
            class="wf-card node-pos"
            :style="{ left: '140px', top: '190px' }"
            :class="{ 'wf-card-active': isNodeActive('priority'), 'wf-card-selected': selectedNodeKey === 'priority' }"
            @click="selectNode('priority')"
          >
            <div class="wf-port port-right"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-amber">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">4. Dynamic Priority</div>
                <div class="wf-node-sub">6-Factor Weighted Scoring</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse amber"></span>{{ currentStageIndex >= 3 ? 'Calculated' : 'Evaluating' }}</span>
              <span class="wf-metric-tag font-mono">Score: {{ activeIncident?.priorityScore || 96 }}/100</span>
            </div>
          </div>

          <!-- Central Orchestration Hub (RESQ CORE) -->
          <div
            class="wf-central-hub"
            :style="{ left: '480px', top: '170px' }"
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
              <div class="hub-tag font-mono">ACID STATE: {{ currentSimulatedStatus }}</div>
            </div>
          </div>

          <!-- Node 5: Dispatch Engine Box -->
          <div
            class="wf-card node-pos"
            :style="{ left: '860px', top: '190px' }"
            :class="{ 'wf-card-active': isNodeActive('dispatch'), 'wf-card-selected': selectedNodeKey === 'dispatch' }"
            @click="selectNode('dispatch')"
          >
            <div class="wf-port port-left"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-purple">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">5. Dispatch Engine</div>
                <div class="wf-node-sub">Algorithmic Unit Assignment</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse purple"></span>{{ currentStageIndex >= 4 ? 'Optimal Match' : 'Queued' }}</span>
              <span class="wf-metric-tag font-mono">AMB-A12 · 94% Proximity Match</span>
            </div>
          </div>

          <!-- ==============================================
               TIER 3: RESPONDER, ROUTE & COMMAND LAYER
          =============================================== -->
          <!-- Node 6: Responder Network -->
          <div
            class="wf-card node-pos"
            :style="{ left: '140px', top: '355px' }"
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
                <div class="wf-node-title">6. Responder Fleet</div>
                <div class="wf-node-sub">Professional EMTs &amp; Community Mesh</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active">
                <span class="status-dot-pulse green"></span>
                {{ currentStageIndex >= 7 ? 'On Scene' : (currentStageIndex >= 6 ? 'En Route (ETA 8m)' : (currentStageIndex >= 5 ? 'Assigned' : 'Standby')) }}
              </span>
              <span class="wf-metric-tag font-mono">AMB-A12 + Fire Rescue 3</span>
            </div>
          </div>

          <!-- Node 7: GIS / Route Intelligence -->
          <div
            class="wf-card node-pos"
            :style="{ left: '500px', top: '355px' }"
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
                <div class="wf-node-title">7. GIS Route Mesh</div>
                <div class="wf-node-sub">Emergency Corridor Optimization</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>{{ currentStageIndex >= 6 ? 'Dynamic Corridor Active' : 'Standby' }}</span>
              <span class="wf-metric-tag font-mono">ETA: 8m vs 18m Std</span>
            </div>
          </div>

          <!-- Node 8: Command Center Orchestration -->
          <div
            class="wf-card node-pos"
            :style="{ left: '860px', top: '355px' }"
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
                <div class="wf-node-title">8. Tactical Command</div>
                <div class="wf-node-sub">Real-Time Operations Console</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse green"></span>Operational</span>
              <span class="wf-metric-tag font-mono">Telemetry Synchronized</span>
            </div>
          </div>

          <!-- ==============================================
               TIER 4: HOSPITAL, RESOURCE & SURVIVOR LAYER
          =============================================== -->
          <!-- Node 9: Hospital Intelligence -->
          <div
            class="wf-card node-pos"
            :style="{ left: '140px', top: '515px' }"
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
                <div class="wf-node-title">9. Hospital Mesh</div>
                <div class="wf-node-sub">ICU &amp; Trauma Intake Reservation</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse cyan"></span>{{ currentStageIndex >= 8 ? 'ICU Bed Confirmed' : (currentStageIndex >= 7 ? 'Notified' : 'Standby') }}</span>
              <span class="wf-metric-tag font-mono">City General · 4 Trauma Beds</span>
            </div>
          </div>

          <!-- Node 10: Resource Coordination -->
          <div
            class="wf-card node-pos"
            :style="{ left: '500px', top: '515px' }"
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
                <div class="wf-node-title">10. Resources &amp; Supplies</div>
                <div class="wf-node-sub">Cross-Agency Mutual Aid</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse green"></span>{{ currentStageIndex >= 7 ? 'Deployed' : 'Synchronized' }}</span>
              <span class="wf-metric-tag font-mono">Oxygen / Drones Allocated</span>
            </div>
          </div>

          <!-- Node 11: Survivor / Family Safety -->
          <div
            class="wf-card node-pos"
            :style="{ left: '860px', top: '515px' }"
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
                <div class="wf-node-title">11. Family Safety Mesh</div>
                <div class="wf-node-sub">Survivor Check-In &amp; Notification</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse green"></span>{{ currentStageIndex >= 7 ? 'Broadcast Live' : 'Active' }}</span>
              <span class="wf-metric-tag font-mono">6 Safe · 2 Hospitalized</span>
            </div>
          </div>

          <!-- ==============================================
               TIER 5: EVIDENCE, RESOLUTION & AUDIT LAYER
          =============================================== -->
          <!-- Node 12: Evidence & Audit Vault -->
          <div
            class="wf-card node-pos"
            :style="{ left: '320px', top: '675px' }"
            :class="{ 'wf-card-active': isNodeActive('audit'), 'wf-card-selected': selectedNodeKey === 'audit' }"
            @click="selectNode('audit')"
          >
            <div class="wf-port port-top"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-blue">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">12. SHA-256 Audit Vault</div>
                <div class="wf-node-sub">Tamper-Evident Incident Ledger</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse green"></span>{{ currentStageIndex >= 9 ? 'Immutable Block Locked' : 'Ledger Active' }}</span>
              <span class="wf-metric-tag font-mono">SHA-256 Verified</span>
            </div>
          </div>

          <!-- Node 13: Analytics & Post-Incident Prediction -->
          <div
            class="wf-card node-pos"
            :style="{ left: '680px', top: '675px' }"
            :class="{ 'wf-card-active': isNodeActive('analytics'), 'wf-card-selected': selectedNodeKey === 'analytics' }"
            @click="selectNode('analytics')"
          >
            <div class="wf-port port-top"></div>
            <div class="wf-card-header">
              <div class="wf-node-icon bg-purple">
                <svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
              </div>
              <div class="wf-node-meta">
                <div class="wf-node-title">13. Analytics &amp; Intelligence</div>
                <div class="wf-node-sub">Performance, MTTR &amp; Prediction</div>
              </div>
              <button class="wf-card-dots">•••</button>
            </div>
            <div class="wf-card-divider"></div>
            <div class="wf-card-footer">
              <span class="wf-status-active"><span class="status-dot-pulse purple"></span>{{ currentStageIndex >= 9 ? 'Report Finalized' : 'Telemetry Recording' }}</span>
              <span class="wf-metric-tag font-mono">Avg MTTR: 4.2m · 99.4% Accuracy</span>
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
            <span class="ins-live-time font-mono">STAGE: {{ currentStageName }} · TELEMETRY SYNCHRONIZED · {{ liveTimestamp }}</span>
          </div>
        </div>
      </Transition>

    </div>

    <!-- BOTTOM STATUS BAR & CLICKABLE INTERACTIVE 10-STAGE TRACKER -->
    <footer class="wf-footer">
      <div class="wf-footer-left">
        <span class="footer-dot"></span>
        <span class="footer-status font-mono">LIVE SOCKET.IO MESH CONNECTED</span>
        <span class="footer-sep">·</span>
        <span class="footer-inc font-mono">ACTIVE FOCUS: #{{ activeIncident?.id || 'INC-1042' }}</span>
      </div>

      <!-- Interactive 10-Stage Lifecycle Tracker (Fully Clickable Stages 1 to 10) -->
      <div class="wf-stages-tracker" title="Click any stage (1 to 10) to test &amp; simulate the emergency lifecycle">
        <button
          v-for="(stg, i) in lifecycleStages"
          :key="i"
          type="button"
          :class="['tracker-step', { 'step-done': isStageCompleted(stg.id), 'step-current': isStageCurrent(stg.id) }]"
          @click="setSimulatedStage(stg.id)"
          :title="`Click to simulate stage ${i + 1}: ${stg.label}`"
        >
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-name">{{ stg.label }}</span>
        </button>
      </div>

      <div class="wf-footer-right">
        <span class="font-mono text-cyan">CLICK STAGES 1-10 TO SIMULATE · DRAG TO PAN</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useResponderStore } from '../../stores/responderStore';
import { useHospitalStore } from '../../stores/hospitalStore';
import { useDisasterStore } from '../../stores/disasterStore';

const router = useRouter();
const authStore = useAuthStore();
const incidentStore = useIncidentStore();
const responderStore = useResponderStore();
const hospitalStore = useHospitalStore();
const disasterStore = useDisasterStore();

const canvasViewport = ref(null);
const canvasWidth = 1200;
const canvasHeight = 820;

// Pan & Zoom state
const panX = ref(0);
const panY = ref(0);
const zoomLevel = ref(0.92);
const isPanning = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);

// Default mock incidents for public visitors / faculty demonstration
const sampleFallbackIncidents = [
  { id: 'INC-1042', title: 'Commercial Structure Collapse', status: 'DISPATCHING', severity: 'CRITICAL', priorityScore: 96, location: '42 Harbour Road, Sector 4', victimCount: 8, incidentType: 'COLLAPSE' },
  { id: 'INC-1043', title: 'North Canal Flash Flood Overflow', status: 'ON_SCENE', severity: 'HIGH', priorityScore: 84, location: 'Canal Crossing 9', victimCount: 4, incidentType: 'FLOOD' },
  { id: 'INC-1044', title: 'Industrial Chemical Gas Leak', status: 'REPORTED', severity: 'CRITICAL', priorityScore: 98, location: 'PetroChem Zone B', victimCount: 12, incidentType: 'HAZMAT' }
];

// Selected incident & Node Inspector state
const selectedIncidentId = ref('INC-1042');
const selectedNodeKey = ref(null);
const liveTimestamp = ref('');
const directoryOpen = ref(false);

// Simulated Stage State (Stages 1 through 10)
const currentSimulatedStatus = ref('DISPATCHING');
const isSimulating = ref(false);
let simulationInterval = null;

// Lifecycle Stages Definition (1 to 10)
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

const allIncidents = computed(() => {
  if (incidentStore.incidents && incidentStore.incidents.length > 0) {
    return incidentStore.incidents;
  }
  return sampleFallbackIncidents;
});

const activeIncident = computed(() => {
  return allIncidents.value.find(i => i.id === selectedIncidentId.value) || allIncidents.value[0] || sampleFallbackIncidents[0];
});

watch(() => incidentStore.selectedIncident, (newInc) => {
  if (newInc && newInc.id) {
    selectedIncidentId.value = newInc.id;
    if (newInc.status) {
      currentSimulatedStatus.value = newInc.status;
    }
  }
}, { immediate: true });

function onIncidentChange() {
  const found = allIncidents.value.find(i => i.id === selectedIncidentId.value);
  if (found) {
    if (incidentStore.incidents.length) {
      incidentStore.selectIncident(found);
    }
    currentSimulatedStatus.value = found.status || 'DISPATCHING';
  }
}

// Stage Index & Navigation Methods
const currentStageIndex = computed(() => {
  const idx = lifecycleStages.findIndex(s => s.id === currentSimulatedStatus.value);
  return idx >= 0 ? idx : 4;
});

const currentStageName = computed(() => {
  const st = currentSimulatedStatus.value || 'DISPATCHING';
  return st.replace('_', ' ');
});

function isStageCompleted(stageId) {
  const idx = lifecycleStages.findIndex(s => s.id === stageId);
  return idx <= currentStageIndex.value;
}

function isStageCurrent(stageId) {
  return currentSimulatedStatus.value === stageId;
}

function setSimulatedStage(stageId) {
  currentSimulatedStatus.value = stageId;
}

function nextStage() {
  if (currentStageIndex.value < lifecycleStages.length - 1) {
    currentSimulatedStatus.value = lifecycleStages[currentStageIndex.value + 1].id;
  }
}

function prevStage() {
  if (currentStageIndex.value > 0) {
    currentSimulatedStatus.value = lifecycleStages[currentStageIndex.value - 1].id;
  }
}

function toggleSimulation() {
  if (isSimulating.value) {
    clearInterval(simulationInterval);
    isSimulating.value = false;
  } else {
    isSimulating.value = true;
    if (currentStageIndex.value >= lifecycleStages.length - 1) {
      currentSimulatedStatus.value = lifecycleStages[0].id;
    }
    simulationInterval = setInterval(() => {
      if (currentStageIndex.value < lifecycleStages.length - 1) {
        currentSimulatedStatus.value = lifecycleStages[currentStageIndex.value + 1].id;
      } else {
        clearInterval(simulationInterval);
        isSimulating.value = false;
      }
    }, 1600);
  }
}

function goBack() {
  if (authStore.isAuthenticated) {
    if (authStore.user?.role === 'CITIZEN') {
      router.push('/citizen');
    } else {
      router.push('/admin/command');
    }
  } else {
    router.push('/');
  }
}

// Dynamic Node Active State based on current stage (1 to 10)
function isNodeActive(nodeKey) {
  const idx = currentStageIndex.value;
  switch (nodeKey) {
    case 'citizen': return true;
    case 'ai': return idx >= 1;
    case 'disaster': return disasterStore.isDisasterMode || idx >= 2;
    case 'priority': return idx >= 3;
    case 'incident_core': return true;
    case 'dispatch': return idx >= 4;
    case 'responder': return idx >= 5;
    case 'gis': return idx >= 6;
    case 'command': return idx >= 5;
    case 'hospital': return idx >= 8;
    case 'resource': return idx >= 7;
    case 'survivor': return idx >= 7;
    case 'audit': return idx >= 9;
    case 'analytics': return idx >= 9;
    default: return false;
  }
}

// Computed SVG Connections based on updated coordinates
const computedConnections = computed(() => {
  const idx = currentStageIndex.value;
  return [
    // 1. Citizen (280, 95) -> Central Hub Top (600, 175)
    { d: 'M 280,95 C 280,140 600,140 600,175', active: true },
    // 2. AI (640, 95) -> Central Hub Top (600, 175)
    { d: 'M 640,95 C 640,140 600,140 600,175', active: idx >= 1 },
    // 3. Disaster (1000, 95) -> Central Hub Top (600, 175)
    { d: 'M 1000,95 C 1000,140 600,140 600,175', active: disasterStore.isDisasterMode || idx >= 2 },
    // 4. Priority (420, 230) -> Central Hub Left (480, 230)
    { d: 'M 420,230 L 480,230', active: idx >= 3 },
    // 5. Central Hub Right (720, 230) -> Dispatch (860, 230)
    { d: 'M 720,230 L 860,230', active: idx >= 4 },
    // 6. Central Hub Bottom (600, 285) -> Responder Fleet (280, 355)
    { d: 'M 600,285 C 600,325 280,325 280,355', active: idx >= 5 },
    // 7. Central Hub Bottom (600, 285) -> GIS Route (640, 355)
    { d: 'M 600,285 C 600,325 640,325 640,355', active: idx >= 6 },
    // 8. Central Hub Bottom (600, 285) -> Command Center (1000, 355)
    { d: 'M 600,285 C 600,325 1000,325 1000,355', active: idx >= 5 },
    // 9. Responder (280, 425) -> Hospital Mesh (280, 515)
    { d: 'M 280,425 L 280,515', active: idx >= 8 },
    // 10. GIS Route (640, 425) -> Resources (640, 515)
    { d: 'M 640,425 L 640,515', active: idx >= 7 },
    // 11. Command Center (1000, 425) -> Survivor Safety (1000, 515)
    { d: 'M 1000,425 L 1000,515', active: idx >= 7 },
    // 12. Hospital (280, 585) -> Audit Vault (460, 675)
    { d: 'M 280,585 C 280,635 460,635 460,675', active: idx >= 9 },
    // 13. Resources (640, 585) -> Analytics (820, 675)
    { d: 'M 640,585 C 640,635 820,635 820,675', active: idx >= 9 },
    // 14. Survivor Safety (1000, 585) -> Analytics (820, 675)
    { d: 'M 1000,585 C 1000,635 820,635 820,675', active: idx >= 9 }
  ];
});

// Interactive Node Inspector Details
const nodeDetailsMap = computed(() => {
  const inc = activeIncident.value;
  return {
    citizen: {
      badge: 'INTAKE LAYER',
      title: '1. Citizen Emergency Intake',
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
      title: '2. AI Emergency Intelligence Engine',
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
        'Active Lifecycle Stage': currentSimulatedStatus.value,
        'Priority Score': `${inc?.priorityScore || 96}/100`,
        'Concurrency State': 'PostgreSQL Row Lock Active'
      }
    },
    priority: {
      badge: 'DYNAMIC SCORING',
      title: '4. Dynamic Priority Engine',
      desc: '6-factor real-time weighted formula calculating triage scores across casualty, trapped status, hazardous materials, and infrastructure impact.',
      params: {
        'Weighted Priority': `${inc?.priorityScore || 96} / 100`,
        'Casualty Weight': '0.35 (8 Victims detected)',
        'Vulnerability Factor': '0.25 (Trapped Seniors reported)',
        'Hazard Escalation': '0.20 (Gas Mains Proximity)'
      }
    },
    dispatch: {
      badge: 'ALGORITHMIC ALLOCATION',
      title: '5. Dispatch Optimization Engine',
      desc: 'Solves the emergency unit matching problem by factoring proximity, ETA, capability match, and hospital bed availability.',
      params: {
        'Matched Unit': 'AMB-A12 (Advanced Life Support)',
        'Proximity Score': '94% Match (1.8 km distance)',
        'Secondary Units': 'Fire Engine FE-04 + Rescue Squad 2',
        'Dispatch Lock': 'ACID Transaction Committed'
      }
    },
    responder: {
      badge: 'FIELD RESPONSE MESH',
      title: '6. Field Responder Mesh',
      desc: 'Mobile tactical PWA for EMTs and community responders with offline-first synchronization and live location telemetry.',
      params: {
        'Primary Unit': 'AMB-A12 (2 Paramedics)',
        'Telemetry Status': currentStageIndex.value >= 7 ? 'On Scene' : (currentStageIndex.value >= 6 ? 'En Route (45 km/h)' : 'Assigned'),
        'Vital Transmission': 'Live Cardiac Telemetry Enabled',
        'Field Comms': 'WebRTC Mesh Audio Link Active'
      }
    },
    gis: {
      badge: 'SPATIAL INTELLIGENCE',
      title: '7. GIS Emergency Corridor Mesh',
      desc: 'OpenFreeMap spatial routing engine providing green-light emergency corridors and flood hazard bypasses.',
      params: {
        'Primary Corridor': 'Highway 4 Express Bypass',
        'Dynamic ETA': '8 Minutes (Saved 10 min vs Traffic)',
        'Hazard Obstacles': 'Avoided North Bridge Inundation Zone',
        'Turn-by-Turn': 'Synchronized with In-Vehicle HUD'
      }
    },
    command: {
      badge: 'TACTICAL COMMAND',
      title: '8. Command Center Orchestration',
      desc: 'Multi-agency unified command console for tactical supervisors, district commanders, and regional coordinators.',
      params: {
        'Active Incidents': `${allIncidents.value.length} Tracked in Mesh`,
        'Critical Focus': `#${inc?.id || 'INC-1042'}`,
        'Disaster Status': disasterStore.isDisasterMode ? 'LEVEL 3 DISASTER ACTIVE' : 'STANDARD TACTICAL MONITORING',
        'Audio Beacon': 'Frequency 142.8 MHz Alert Active'
      }
    },
    hospital: {
      badge: 'REGIONAL HEALTHCARE MESH',
      title: '9. Hospital Intake & Bed Reservation',
      desc: 'Live telemetry integration with regional trauma centers to eliminate emergency room diversions and queue delays.',
      params: {
        'Target Facility': 'City General Trauma Center',
        'Reservation': '2 ICU Trauma Beds + 1 Surgical Suite',
        'ETA to Intake': '8 Minutes',
        'Blood Unit Prep': 'O-Negative 4 Units Pre-Allocated'
      }
    },
    resource: {
      badge: 'MUTUAL AID INVENTORY',
      title: '10. Resource & Logistics Mesh',
      desc: 'Automated logistics sharing allocating portable oxygen, SAR drones, heavy machinery, and hazmat gear across agencies.',
      params: {
        'Allocated Gear': '4 Thermal SAR Drones + 10 Oxygen Cylinders',
        'Origin Depot': 'Regional Supply Depot Bravo',
        'Delivery Vector': 'Rapid Logistics Van L-02',
        'Asset Integrity': 'NFC Tag Checked & Dispatched'
      }
    },
    survivor: {
      badge: 'COMMUNITY SAFETY',
      title: '11. Family Safety & Survivor Mesh',
      desc: 'Secure citizen check-in and family reunification portal broadcasting safe status and shelter locations.',
      params: {
        'Checked In': '6 Survivors Marked Safe',
        'Trauma Patients': '2 Transferred to City General',
        'Family Broadcasts': '14 SMS & Push Notifications Delivered',
        'Shelter Reroute': 'Sector 4 Community Gymnasium Open'
      }
    },
    audit: {
      badge: 'IMMUTABLE COMPLIANCE',
      title: '12. SHA-256 Audit Vault',
      desc: 'Cryptographic ledger recording all timestamps, dispatcher choices, responder locations, and evidence hashes.',
      params: {
        'Ledger Entry': `#TX-${inc?.id || 'INC-1042'}-SEALED`,
        'SHA-256 Hash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'Evidence Signed': 'Audio Call + 3 Drone Photos Locked',
        'Audit Status': currentStageIndex.value >= 9 ? 'Immutable Block Finalized' : 'Transactions Logging'
      }
    },
    analytics: {
      badge: 'PREDICTIVE INTELLIGENCE',
      title: '13. Analytics & After-Action Review',
      desc: 'Machine learning post-incident analysis measuring Mean Time to Resolution (MTTR) and resource efficiency.',
      params: {
        'Response Time': '4.2 Minutes (38% Faster than Target)',
        'Survival Index': '99.4% Critical Care Success',
        'AI Accuracy': '96.8% Initial Triage Precision',
        'Post-Incident Report': currentStageIndex.value >= 9 ? 'Generated & Archived' : 'Aggregating Telemetry'
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

// Canvas Interaction (Pan & Zoom)
function startPan(e) {
  if (e.target.closest('.wf-card') || e.target.closest('.wf-central-hub') || e.target.closest('.wf-hud-toolbar') || e.target.closest('.wf-inspector-card')) {
    return;
  }
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
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
  zoomLevel.value = Math.min(Math.max(zoomLevel.value * zoomFactor, 0.4), 1.8);
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 1.8);
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.4);
}

function resetView() {
  panX.value = 0;
  panY.value = 0;
  zoomLevel.value = 0.92;
}

function fitToScreen() {
  if (!canvasViewport.value) return;
  const rect = canvasViewport.value.getBoundingClientRect();
  const scaleX = (rect.width - 40) / canvasWidth;
  const scaleY = (rect.height - 40) / canvasHeight;
  zoomLevel.value = Math.min(scaleX, scaleY, 1.05);
  panX.value = (rect.width - canvasWidth * zoomLevel.value) / 2;
  panY.value = (rect.height - canvasHeight * zoomLevel.value) / 2;
}

let timer = null;
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  if (!incidentStore.incidents.length) {
    incidentStore.fetchIncidents().catch(() => {});
  }
  if (disasterStore.fetchDisasterStatus) {
    disasterStore.fetchDisasterStatus().catch(() => {});
  }
  nextTick(() => {
    fitToScreen();
  });
  window.addEventListener('resize', fitToScreen);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (simulationInterval) clearInterval(simulationInterval);
  window.removeEventListener('resize', fitToScreen);
});

function updateTime() {
  const now = new Date();
  liveTimestamp.value = now.toISOString().slice(11, 19) + ' UTC';
}
</script>

<style scoped>
.btn-back-clean {
  background: transparent;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-cyan, #00f2fe);
}

.btn-back-clean:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: var(--color-cyan, #00f2fe);
}

.tactical-workflow-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  width: 100%;
  background: #080c14;
  overflow: hidden;
  position: relative;
}

/* ─── HEADER ─────────────────────────────────────────── */
.wf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 1.25rem;
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
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
}

.wf-logo-text {
  font-size: 1.1rem;
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
  font-size: 0.92rem;
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
  font-size: 0.60rem;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-top: 1px;
}

.wf-header-center {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.incident-selector-wrapper, .stage-sim-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.sel-label {
  font-size: 0.62rem;
  color: #94a3b8;
  font-family: var(--font-mono, monospace);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.incident-select, .stage-select {
  background: #0f172a;
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  max-width: 200px;
}

.sim-btn-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sim-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #e2e8f0;
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.sim-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}

.sim-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.sim-btn-play {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 116, 144, 0.35));
  border-color: #06b6d4;
  color: #22d3ee;
}

.btn-playing {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.35));
  border-color: #ef4444;
  color: #f87171;
}

.wf-kpi-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.8);
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-size: 0.68rem;
}

.kpi-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.dot-cyan { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
.dot-amber { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.dot-red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

.kpi-name {
  color: #94a3b8;
  font-size: 0.60rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.nav-shortcuts {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-shortcut-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #e2e8f0;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.3rem 0.55rem;
  border-radius: 5px;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-shortcut-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}

.wf-header-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  position: relative;
}

.directory-dropdown-wrapper {
  position: relative;
}

.wf-btn-dir {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.25));
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.wf-btn-dir:hover {
  background: rgba(56, 189, 248, 0.3);
  border-color: #38bdf8;
  color: #fff;
}

.dir-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 100;
  backdrop-filter: blur(12px);
  max-height: 420px;
  overflow-y: auto;
}

.dir-header {
  font-size: 0.60rem;
  color: #64748b;
  padding: 0.4rem 0.5rem 0.2rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  margin-bottom: 0.2rem;
  letter-spacing: 0.06em;
}

.dir-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  text-decoration: none;
  color: #e2e8f0;
  transition: all 0.15s;
}

.dir-item:hover {
  background: rgba(56, 189, 248, 0.15);
  transform: translateX(3px);
}

.dir-icon {
  font-size: 1.1rem;
}

.dir-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dir-text strong {
  font-size: 0.72rem;
  color: #f1f5f9;
}

.dir-text small {
  font-size: 0.58rem;
  color: #94a3b8;
}

.wf-btn-close {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.wf-btn-close:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #fff;
}

/* ─── WORKFLOW VIEWPORT & CANVAS ─────────────────────── */
.wf-viewport {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  background-image: 
    radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.5) 0%, rgba(8, 12, 20, 0.95) 100%),
    radial-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px);
  background-size: 100% 100%, 28px 28px;
}

.wf-viewport:active {
  cursor: grabbing;
}

.wf-canvas-content {
  position: absolute;
  width: 1200px;
  height: 820px;
  top: 0;
  left: 0;
}

/* ─── SVG CONNECTORS LAYER ───────────────────────────── */
.wf-connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.conn-base-path {
  fill: none;
  stroke: #1e293b;
  stroke-width: 2.5;
  stroke-linecap: round;
  transition: stroke 0.3s;
}

.conn-active-glow {
  stroke: #0284c7;
  stroke-width: 2.5;
  stroke-opacity: 0.7;
}

.conn-flow-particle {
  fill: none;
  stroke: #38bdf8;
  stroke-width: 2.5;
  stroke-dasharray: 6 12;
  stroke-linecap: round;
  animation: flow-dash 1.4s linear infinite;
}

@keyframes flow-dash {
  to {
    stroke-dashoffset: -36;
  }
}

/* ─── NODES LAYER ────────────────────────────────────── */
.wf-nodes-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.wf-card {
  position: absolute;
  width: 260px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.wf-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 8px 25px rgba(56, 189, 248, 0.15);
}

.wf-card-active {
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
}

.wf-card-selected {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.4) !important;
  background: rgba(15, 23, 42, 0.98) !important;
}

.wf-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.wf-node-icon {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-svg {
  width: 18px;
  height: 18px;
}

.bg-red { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
.bg-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.4); }
.bg-orange { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }
.bg-amber { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.bg-purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
.bg-emerald { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
.bg-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }

.wf-node-meta {
  flex: 1;
  min-width: 0;
}

.wf-node-title {
  font-family: var(--font-display, "Space Grotesk", sans-serif);
  font-size: 0.78rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-node-sub {
  font-size: 0.60rem;
  color: #94a3b8;
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
}

.wf-card-divider {
  height: 1px;
  background: rgba(51, 65, 85, 0.5);
  margin: 0.45rem 0;
}

.wf-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.62rem;
}

.wf-status-active {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #cbd5e1;
  font-family: var(--font-mono, monospace);
  font-weight: 600;
}

.status-dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot-pulse.green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.status-dot-pulse.cyan { background: #06b6d4; box-shadow: 0 0 6px #06b6d4; }
.status-dot-pulse.amber { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.status-dot-pulse.purple { background: #a855f7; box-shadow: 0 0 6px #a855f7; }
.status-dot-pulse.red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }

.wf-metric-tag {
  color: #94a3b8;
  font-size: 0.58rem;
  background: rgba(15, 23, 42, 0.8);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  border: 1px solid rgba(51, 65, 85, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

/* ─── CENTRAL ORCHESTRATION HUB ──────────────────────── */
.wf-central-hub {
  position: absolute;
  width: 240px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
  border: 2px solid rgba(56, 189, 248, 0.6);
  border-radius: 14px;
  padding: 0.85rem;
  box-shadow: 0 0 35px rgba(56, 189, 248, 0.25);
  cursor: pointer;
  transition: all 0.25s;
  text-align: center;
}

.wf-central-hub:hover {
  transform: translateY(-2px);
  border-color: #38bdf8;
  box-shadow: 0 0 45px rgba(56, 189, 248, 0.4);
}

.hub-emblem {
  font-size: 1.4rem;
  color: #38bdf8;
  margin-bottom: 0.2rem;
}

.hub-title {
  font-family: var(--font-display, "Space Grotesk", sans-serif);
  font-size: 0.88rem;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.05em;
}

.hub-sub {
  font-size: 0.62rem;
  color: #38bdf8;
  margin-top: 0.2rem;
}

.hub-tag {
  font-size: 0.56rem;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  margin-top: 0.4rem;
  letter-spacing: 0.05em;
}

/* ─── HUD CONTROLS ───────────────────────────────────── */
.wf-hud-toolbar {
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(51, 65, 85, 0.8);
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.hud-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 700;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.hud-btn.text-btn {
  width: auto;
  padding: 0 0.45rem;
  font-size: 0.62rem;
  font-family: var(--font-mono, monospace);
}

.hud-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}

.hud-zoom-val {
  font-size: 0.65rem;
  color: #94a3b8;
  padding: 0 0.3rem;
}

/* ─── NODE INSPECTOR CARD ────────────────────────────── */
.wf-inspector-card {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 320px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  z-index: 15;
}

.inspector-slide-enter-active, .inspector-slide-leave-active {
  transition: all 0.25s ease-out;
}
.inspector-slide-enter-from, .inspector-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.ins-badge {
  font-family: var(--font-mono, monospace);
  font-size: 0.58rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.ins-title {
  font-family: var(--font-display, "Space Grotesk", sans-serif);
  font-size: 0.88rem;
  font-weight: 800;
  color: #f8fafc;
  margin-top: 0.25rem;
}

.ins-close {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.85rem;
  cursor: pointer;
}
.ins-close:hover { color: #f87171; }

.ins-desc {
  font-size: 0.68rem;
  color: #94a3b8;
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

.inspector-params-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.6rem;
}

.ins-param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.64rem;
  background: rgba(8, 12, 20, 0.6);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(51, 65, 85, 0.4);
}

.param-name { color: #64748b; font-weight: 600; }
.param-val { color: #38bdf8; }

.inspector-footer {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  font-size: 0.56rem;
  color: #64748b;
  text-align: right;
}

/* ─── FOOTER & INTERACTIVE 10-STAGE TRACKER ──────────── */
.wf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 1.25rem;
  background: rgba(13, 20, 36, 0.96);
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  font-size: 0.65rem;
  flex-shrink: 0;
  gap: 1rem;
  z-index: 20;
}

.wf-footer-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.footer-status { color: #94a3b8; }
.footer-sep { color: #475569; }
.footer-inc { color: #38bdf8; font-weight: 700; }

.wf-stages-tracker {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.15rem 0;
}

.tracker-step {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.7);
  color: #64748b;
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.tracker-step:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  transform: translateY(-1px);
}

.tracker-step.step-done {
  background: rgba(6, 182, 212, 0.12);
  border-color: rgba(6, 182, 212, 0.45);
  color: #22d3ee;
}

.tracker-step.step-current {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35));
  border-color: #f59e0b;
  color: #fbbf24;
  font-weight: 800;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
  animation: pulse-border 1.8s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 6px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 16px rgba(245, 158, 11, 0.6); }
  100% { box-shadow: 0 0 6px rgba(245, 158, 11, 0.3); }
}

.step-num {
  font-weight: 800;
  font-size: 0.60rem;
}

.wf-footer-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 1024px) {
  .wf-header-center { display: none; }
  .wf-footer-right { display: none; }
}
</style>
