<div align="center">

# 🚨 ResQNet
### Autonomous AI Emergency Intelligence & Tactical Coordination Mesh

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-res--q--net--flame.vercel.app-00F2FE?style=for-the-badge&logo=vercel&logoColor=black)](https://res-q-net-flame.vercel.app/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-Vector_GIS-3969EC?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <strong>An AI-powered emergency coordination platform that transforms citizen distress signals into prioritized, intelligently dispatched, and cryptographically verified emergency responses in real-time.</strong>
</p>

<p align="center">
  <a href="https://res-q-net-flame.vercel.app/"><strong>🌐 Live Production App</strong></a> •
  <a href="https://res-q-net-flame.vercel.app/workflow"><strong>⚡ Interactive Workflow Canvas (No Login)</strong></a> •
  <a href="#-quick-start"><strong>🚀 Quick Start</strong></a> •
  <a href="#-demo-accounts"><strong>🔑 Demo Credentials</strong></a>
</p>

</div>

---

## 📌 Executive Summary

During catastrophic disasters and urban emergencies, traditional 911/112 dispatch systems experience severe bottlenecks due to fragmented voice queues, unverified reports, dispatcher race conditions, and emergency room bed diversions. 

**ResQNet** solves this by establishing a **unified, sub-second coordination mesh** connecting:
1. **Citizens in Crisis** (Multilingual Voice SOS, GPS pinpointing, Family Safety).
2. **Tactical Commanders & Dispatchers** (Real-time GIS map, dynamic priority matrix, AI triage).
3. **Emergency Responders & EMTs** (Concurrency-locked unit dispatch, live telemetry corridors).
4. **Community First Responders** (500m hyper-local CPR/AED volunteer mobilization).
5. **Regional Trauma Hospitals** (Real-time ICU bed reservations, eliminating diversion queues).

---

## ⚡ 10-Stage Autonomous Emergency Lifecycle

Every distress call in ResQNet traverses a synchronized 10-stage state machine designed to minimize Mean Time to Response (MTTR):

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  01 REPORT   │ ──► │ 02 AI TRIAGE │ ──► │ 03 VERIFIED  │ ──► │ 04 PRIORITY  │ ──► │ 05 DISPATCH  │
│ Voice SOS/GPS│     │ NLP Analysis │     │ Deduplication│     │ Dynamic 0-100│     │ 6-Factor Alg │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                                            │
                                                                                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 10 RESOLVED  │ ◄── │ 09 HOSPITAL  │ ◄── │ 08 ON SCENE  │ ◄── │ 07 EN ROUTE  │ ◄── │ 06 ASSIGNED  │
│SHA-256 Ledger│     │ ICU Intake   │     │ Mutual Aid   │     │ GIS Corridor │     │ ACID Concurr │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

> [!TIP]
> You can step through and simulate all 10 stages live on the **[Public Tactical Workflow Canvas](https://res-q-net-flame.vercel.app/workflow)** without logging in.

---

## 🌟 Core System Pillars

### 1. 🎙️ Multilingual Voice SOS & AI Triage Engine
- **Cross-Lingual Entity Extraction**: Ingests voice distress signals in **English, Tamil, Hindi, and Telugu**.
- **Automated Parameter Extraction**: Extracts casualty counts, entrapped victims, hazardous materials (Hazmat), and emotional distress levels in real-time.
- **Dynamic Priority Scoring (0–100)**: Multi-factor weighted score prioritizing life-threatening incidents ahead of lower-severity calls.

### 2. 📍 High-Precision Vector GIS & Dual Location Lock
- **Sub-Meter Geolocation**: Offers both one-click browser GPS acquisition and instant place search via OpenFreeMap Nominatim reverse geocoding.
- **Interactive Map Pinning**: Allows citizens to drag map markers to exact building entrances with automatic coordinate resolution.
- **Tactical MapLibre Layering**: Live responder vectors, hazard inundation zones, emergency traffic corridors, and hospital catchment areas.

### 3. ⚡ Concurrency-Locked 6-Factor Dispatch Engine
- **Race-Condition Prevention**: Employs **Serializable ACID PostgreSQL transactions** to guarantee that simultaneous dispatchers cannot assign the same ambulance twice.
- **Multi-Factor Unit Matching**:
  $$\text{Match Score} = 0.25(\text{Skill}) + 0.20(\text{Gear}) + 0.15(\text{Distance}) + 0.10(\text{ETA}) + 0.15(\text{Fatigue}) + 0.15(\text{Workload})$$

### 4. 🏥 Regional Hospital Bed & Trauma Mesh
- **Zero Diversion Time**: Live WebSocket telemetry synchronizes ICU beds, trauma suites, burn units, and blood supplies across regional medical hubs.
- **Pre-Arrival Intake Reservation**: Trauma centers receive patient vitals and reserve operating rooms while the ambulance is still en route.

### 5. 🤝 500m Hyper-Local Community Responder Circle
- **Golden Minutes Mobilization**: Automatically notifies nearby CPR/First-Aid certified citizen volunteers within a 500-meter perimeter during the critical minutes before EMT arrival.

### 6. 🔒 Cryptographic SHA-256 Audit Vault
- **Immutable Chain of Custody**: Every distress call, dispatcher order, GPS coordinate packet, and hospital handoff is hashed into a SHA-256 tamper-proof ledger for post-incident compliance.

---

## 🌐 Live Platform Gateways

| Portal | Live Production Link | Description & Target Role |
|---|---|---|
| **⚡ Interactive Tactical Workflow** | [res-q-net-flame.vercel.app/workflow](https://res-q-net-flame.vercel.app/workflow) | **Public Architectural Simulation** (Zero login needed) |
| **🚨 Public Landing Page** | [res-q-net-flame.vercel.app/](https://res-q-net-flame.vercel.app/) | Platform overview & quick gateway cards |
| **📱 Citizen Safety Hub** | [res-q-net-flame.vercel.app/login/citizen](https://res-q-net-flame.vercel.app/login/citizen) | Emergency reporting, Multilingual Voice SOS, Family Safety |
| **🛡️ Operations & Command** | [res-q-net-flame.vercel.app/login/operations](https://res-q-net-flame.vercel.app/login/operations) | Tactical Command Center, Dispatcher Console, Hospital Mesh |
| **🔐 Central Auth Gateway** | [res-q-net-flame.vercel.app/login](https://res-q-net-flame.vercel.app/login) | Universal role-based sign in gateway |

---

## 🔑 Demo Access Credentials

> **Universal Password for all accounts:** `password123`

| Role | Username / Mobile | Persona | Direct Dashboard Link |
|---|---|---|---|
| **🚨 Citizen** | `+91 9876543210` | Vignesh Kumar | [/citizen](https://res-q-net-flame.vercel.app/citizen) |
| **🛡️ Tactical Commander** | `+91 9876543211` | Chief Miller | [/admin/command](https://res-q-net-flame.vercel.app/admin/command) |
| **📡 Emergency Dispatcher** | `+91 9876543212` | John Davis | [/admin/command](https://res-q-net-flame.vercel.app/admin/command) |
| **🚑 Field Paramedic (EMT)** | `+91 9876543213` | Sarah Connor | [/responder](https://res-q-net-flame.vercel.app/responder) |
| **🧑‍🚒 Community Volunteer** | `+91 9876543214` | Alex Rivera | [/community](https://res-q-net-flame.vercel.app/community) |
| **🏥 Trauma Lead (Apollo)** | `+91 9876543215` | Dr. Robert Chen | [/hospital](https://res-q-net-flame.vercel.app/hospital) |

---

## 🚀 Local Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **PostgreSQL**: Local instance or Docker Compose

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/saiadithya-k/ResQNet.git
cd ResQNet

# Install all monorepo dependencies (root, backend, frontend)
npm run install:all
```

### 3. Environment & Database Setup
```bash
# Start PostgreSQL via Docker
docker compose up -d postgres

# Push Prisma schema & seed demo personas
npm run prisma:push
npm run prisma:seed
```

### 4. Run Development Servers
```bash
# Concurrently runs Backend API (:5000) and Frontend SPA (:5173)
npm run dev
```

---

## 📁 Repository Directory Structure

```text
ResQNet/
├── backend/                  # Express REST API & Socket.IO Real-Time Engine
│   ├── src/
│   │   ├── config/          # Database connection & environment keys
│   │   ├── controllers/     # Incident, Dispatcher, Hospital, AI & GIS controllers
│   │   ├── services/        # 6-Factor Matcher, Multilingual NLP, Routing & Audit Vault
│   │   └── middleware/      # JWT Authentication & RBAC role guards
├── frontend/                 # Vue 3 + Vite Single Page Application
│   ├── src/
│   │   ├── views/           # Command Center, Tactical Workflow, Citizen & Hospital Dashboards
│   │   ├── components/      # MapLibre Vector Map, Copilot Chat, Location Picker
│   │   ├── router/          # Vue Router navigation guards & public access rules
│   │   └── stores/          # Pinia reactive state stores (Incidents, Responders, Disasters)
└── prisma/                   # PostgreSQL schema models & demo seeds
```

---

<div align="center">
  <sub>ResQNet — Engineered for Crisis Resilience • MIT Licensed</sub>
</div>
