<div align="center">

# 🚨 ResQNet
### Autonomous AI Emergency Intelligence & Tactical Response Mesh

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-Vector_GIS-3969EC?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>Transforming citizen distress signals into prioritized, intelligently dispatched, life-saving responses in sub-second time.</strong>
</p>

[⚡ Explore Interactive Workflow (Public)](http://localhost:5173/workflow) • [🚀 Quick Start](#-quick-start) • [🔑 Demo Accounts](#-demo-accounts) • [🌐 Portals](#-platform-portals)

</div>

---

## ⚡ 10-Stage Autonomous Emergency Lifecycle

```
[ 01 REPORT ] ──► [ 02 AI TRIAGE ] ──► [ 03 VERIFIED ] ──► [ 04 PRIORITY ] ──► [ 05 DISPATCH ]
  Voice SOS/GPS     NLP & Casualties     Deduplication       Score (0-100)      6-Factor Match
       │                                                                               │
       ▼                                                                               ▼
[ 10 RESOLVED ] ◄── [ 09 HOSPITAL ] ◄── [ 08 ON SCENE ] ◄── [ 07 EN ROUTE ] ◄── [ 06 ASSIGNED ]
  SHA-256 Audit       Trauma & ICU Beds   Mutual Aid Drones    GIS Corridor       ACID Lock (AMB)
```

---

## 🌟 Core System Pillars

| Feature | Description | Key Tech |
|---|---|---|
| **🎙️ Multilingual AI SOS** | Real-time speech transcription & NLP entity extraction across English, Tamil, Hindi & Telugu. | Custom NLP Engine |
| **📍 High-Precision GIS** | Dual GPS lock & interactive vector map pinning with sub-meter reverse geocoding. | MapLibre GL, OpenFreeMap |
| **⚡ 6-Factor Dispatch** | Matches units by skill (25%), gear (20%), distance (15%), ETA (10%), fatigue (15%) & load (15%). | Serializable ACID Locks |
| **🏥 Regional Trauma Mesh** | Live bed telemetry pre-reserves ICU & surgical suites before ambulance arrives. | Socket.IO WebSockets |
| **🤝 500m Community Ring** | Mobilizes CPR/First-Aid certified citizen volunteers within 500m during critical golden minutes. | Geospatial Indexing |
| **🔒 SHA-256 Audit Vault** | Cryptographic tamper-proof ledger recording immutable chain of custody for every action. | SHA-256 Cryptography |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/saiadithya-k/ResQNet.git
cd ResQNet
npm run install:all
```

### 2. Configure Environment
```bash
# Backend (.env)
cp backend/.env.example backend/.env

# Frontend (.env)
cp frontend/.env.example frontend/.env
```

### 3. Database Setup (PostgreSQL + Prisma)
```bash
# Start PostgreSQL container
docker compose up -d postgres

# Push schema & seed demo data
npm run prisma:push
npm run prisma:seed
```

### 4. Launch Application
```bash
# Runs backend (:5000) and frontend (:5173) concurrently
npm run dev
```

> [!TIP]
> Visit **`http://localhost:5173/workflow`** to test the **Interactive 10-Stage Workflow Canvas** without needing to log in.

---

## 🔑 Demo Accounts

> **Universal Password:** `password123`

| Role | Mobile / Call Sign | User Name | Dashboard Route |
|---|---|---|---|
| **🚨 Citizen** | `+91 9876543210` | Vignesh Kumar | `/citizen` |
| **🛡️ Admin / Commander** | `+91 9876543211` | Chief Miller | `/admin/command` |
| **📡 Tactical Dispatcher** | `+91 9876543212` | John Davis | `/admin/command` |
| **🚑 Field Paramedic** | `+91 9876543213` | Sarah Connor | `/responder` |
| **🧑‍🚒 Community Volunteer** | `+91 9876543214` | Alex Rivera | `/community` |
| **🏥 Hospital Trauma Lead** | `+91 9876543215` | Dr. Robert Chen | `/hospital` |

---

## 🌐 Platform Portals

| Portal | URL | Focus Area |
|---|---|---|
| **Public Landing Page** | [`/`](http://localhost:5173/) | Citizen & Operations Gateway Entry |
| **Tactical Workflow Canvas** | [`/workflow`](http://localhost:5173/workflow) | Public 10-Stage Interactive Mesh Simulation |
| **Citizen Emergency Hub** | [`/login/citizen`](http://localhost:5173/login/citizen) | GPS Distress, Voice SOS, Family Safety & Survivor Check-in |
| **Operations Command Center** | [`/login/operations`](http://localhost:5173/login/operations) | Live Tactical Map, Disaster Controller & Unit Dispatch |

---

## 📁 Project Architecture

```text
ResQNet/
├── backend/                  # Node.js + Express REST & Socket.IO Real-Time Engine
│   ├── src/
│   │   ├── controllers/     # Incident, Dispatcher, Hospital, AI & GIS controllers
│   │   ├── services/        # 6-Factor Matcher, Multilingual NLP, Routing & Audit Vault
│   │   └── middleware/      # JWT Authentication & RBAC role guards
├── frontend/                 # Vue 3 + Vite Single Page Application
│   ├── src/
│   │   ├── views/           # Command Center, Tactical Workflow, Citizen & Hospital Dashboards
│   │   ├── components/      # MapLibre Vector Map, Copilot Chat, Location Picker
│   │   └── stores/          # Pinia reactive stores (Incidents, Disasters, Responders, UI)
└── prisma/                   # PostgreSQL schema models & demo seeds
```

---

<div align="center">
  <sub>Built for Crisis Resilience • MIT Licensed • ResQNet 2026</sub>
</div>
