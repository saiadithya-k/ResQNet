# 🚨 ResQNet — AI Emergency Intelligence & Tactical Response Platform

> **An AI-powered emergency coordination platform that transforms citizen distress signals into prioritized, intelligently dispatched, real-time emergency responses.**

---

## 📌 Overview

**ResQNet** is an end-to-end disaster coordination and emergency intelligence network connecting citizens in crisis, 911/112 dispatchers, tactical commanders, field paramedics, community first responders, and regional trauma hospitals in a synchronized real-time mesh.

```text
Distress Report ➔ Multilingual AI Triage ➔ 6-Factor Matching ➔ Concurrency-Locked Dispatch ➔ GIS Navigation ➔ Hospital Bed Mesh
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Vue 3 (Composition API), Vite, Pinia, Vue Router, Leaflet GIS |
| **Backend** | Node.js, Express.js, Socket.IO Real-Time Engine |
| **Database & ORM** | PostgreSQL, Prisma ORM (Serializable ACID Locks) |
| **AI / Intelligence** | Multilingual NLP (EN, TA, HI, TE), Dynamic Priority Scoring, 6-Factor Matcher |
| **Security & Auth** | JWT Authentication, Bcrypt Password Hashing, RBAC Middleware |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **npm** (v9+)
- **Docker** (for PostgreSQL) or local PostgreSQL instance on port `5432`

---

### 2. Clone & Install Dependencies

Clone the repository and install dependencies for the root, backend, and frontend:

```bash
# Clone the repository
git clone https://github.com/saiadithya-k/ResQNet.git
cd ResQNet

# Install all dependencies (Monorepo root, backend, and frontend)
npm run install:all
```

---

### 3. Setup Database (PostgreSQL & Prisma)

Start the PostgreSQL Docker container, push the schema, and seed the demo accounts:

```bash
# Start PostgreSQL via Docker Compose
docker compose up -d postgres

# Push Prisma schema to the database
npm run prisma:push

# Seed demo users, responders, hospitals, and sample incidents
npm run prisma:seed
```

---

### 4. Run the Application

#### Option A: Start Both Frontend & Backend Together (Recommended)
From the project root:

```bash
npm run dev
```

#### Option B: Start Separately

**Terminal 1 — Backend API & Socket.IO (`http://localhost:5000`):**
```bash
npm --prefix backend run dev
```

**Terminal 2 — Frontend App (`http://localhost:5173`):**
```bash
npm --prefix frontend run dev
```

---

## 🌐 Quick Access URLs

| Portal | URL | Description |
|---|---|---|
| **Public Landing Page** | [http://localhost:5173/](http://localhost:5173/) | Public hero portal & entry gateways |
| **Citizen Emergency Portal** | [http://localhost:5173/login/citizen](http://localhost:5173/login/citizen) | Distress reporting, Multilingual Voice SOS & safety circle |
| **Operations & Command Portal** | [http://localhost:5173/login/operations](http://localhost:5173/login/operations) | Tactical command, 911 dispatch, EMT units & hospital mesh |
| **Central Auth Gateway** | [http://localhost:5173/login](http://localhost:5173/login) | Universal role-based authentication |

---

## 🔑 Seeded Demo Accounts

> **Default Password for all demo accounts:** `password123`

| Role | Mobile Number (Username) | Full Name | Primary Dashboard |
|---|---|---|---|
| **🚨 Citizen** | `+91 9876543210` *(or `9876543210`)* | Vignesh Kumar | `/citizen` |
| **🛡️ Admin** | `+91 9876543211` *(or `9876543211`)* | Command Chief Miller | `/admin/command` |
| **📡 Dispatcher** | `+91 9876543212` *(or `9876543212`)* | Dispatcher John Davis | `/admin/command` |
| **🚑 Paramedic (Responder)** | `+91 9876543213` *(or `9876543213`)* | Paramedic Sarah Connor | `/responder` |
| **🧑‍🚒 Community Responder** | `+91 9876543214` *(or `9876543214`)* | Volunteer Alex Rivera | `/community` |
| **🏥 Hospital Staff** | `+91 9876543215` *(or `9876543215`)* | Dr. Robert Chen (Apollo) | `/hospital` |

---

## 🌟 Key Platform Capabilities

### 1. 🚨 Citizen Emergency Portal
- **Multilingual Voice SOS**: Emergency transcription and entity extraction supporting English, Tamil, Hindi, and Telugu.
- **Instant Incident Reporting**: GPS coordinate geotagging, severity classification, and trapped-victim indicators.
- **Family Safety Circle & Survivor Check-in**: Automated status broadcast and location updates for loved ones during disasters.
- **Public Safety Alerts**: Real-time broadcast alerts for severe weather, flooding, and regional evacuation orders.

### 2. 🗺️ Tactical Command & GIS Center
- **Interactive Leaflet GIS Command Map**: Live tracking of field units, incident heatmaps, route vectors, and hazard zones.
- **Disaster Mode & Simulation**: Scenario stress-testing for structural collapses, earthquakes, and flood surges.
- **Command Analytics & KPIs**: Real-time response time tracking, casualty statistics, and resource utilization rates.

### 3. ⚡ Concurrency-Locked Dispatch Engine
- **Serializable ACID Transaction**: Eliminates race conditions for simultaneous multi-dispatcher dispatches to the same unit.
- **6-Factor Weighted Allocation**: Matches responders by skill set (25%), equipment (20%), distance (15%), ETA (10%), fatigue index (15%), and active workload (15%).

### 4. 🏥 Regional Hospital Capacity Mesh
- **Live Bed & ICU Balancing**: Real-time telemetry for general beds, ICU suites, ventilators, and surgical operating rooms.
- **Automated Intake & Transfer Routing**: Pre-reserves trauma beds ahead of paramedic arrival and coordinates patient transfers.

### 5. 🤝 Hyper-Local Community Mesh
- **500m Proximity Matching**: Alerts CPR/First-Aid certified citizen volunteers within 500 meters during life-critical initial minutes.

### 6. 🔐 Cryptographic Audit Vault
- **SHA-256 Tamper-Proof Audit Log**: Immutable chain-of-custody recording for every status transition, dispatch order, and medical intake.

---

## 📁 Repository Structure

```text
ResQNet/
├── backend/                  # Express.js REST API & Real-Time Engine
│   ├── src/
│   │   ├── config/          # Database & Environment configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # JWT Authentication & RBAC middleware
│   │   ├── routes/          # API route definitions (30 route modules)
│   │   ├── services/        # Business logic (AI Triage, Matching, Dispatch, GIS, Hospital)
│   │   └── utils/           # Utility helpers & SHA-256 hashing
│   ├── server.js            # Express & Socket.IO bootstrap
│   └── package.json
├── frontend/                 # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── components/      # UI components (Map, Navbar, Sidebar, Copilot)
│   │   ├── views/           # Application views (Landing, Citizen, Command, Responder, Hospital)
│   │   ├── stores/          # Pinia state stores (Auth, Incidents, Disasters, Map, UI)
│   │   ├── router/          # Vue Router definitions & role navigation guards
│   │   └── main.js          # Vue 3 entry point
│   ├── vite.config.js       # Vite build & proxy configuration
│   └── package.json
├── prisma/                   # Prisma ORM Schema & Database Seed
│   ├── schema.prisma        # PostgreSQL data models
│   └── seed.js              # Demo accounts & seed data generator
├── docker-compose.yml        # PostgreSQL container configuration
├── package.json              # Monorepo root scripts
└── README.md                 # Project documentation
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both backend and frontend concurrently |
| `npm run dev:backend` | Starts the Express server with Nodemon |
| `npm run dev:frontend` | Starts the Vite development server |
| `npm run install:all` | Installs root, backend, and frontend dependencies |
| `npm run prisma:push` | Pushes the Prisma schema to the active database |
| `npm run prisma:seed` | Seeds database with demo accounts and data |
| `npm --prefix frontend run build` | Compiles production bundle for the frontend |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
