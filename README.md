# 🚨 RESQNET
### AI-Assisted Emergency Intelligence & Tactical Response Mesh

[![Live Deployment](https://img.shields.io/badge/PRODUCTION_MESH-res--q--net--flame.vercel.app-00F2FE?style=for-the-badge&logo=vercel&logoColor=black)](https://res-q-net-flame.vercel.app/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-Vector_GIS-3969EC?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![OpenFreeMap](https://img.shields.io/badge/OpenFreeMap-Vector_Tiles-F59E0B?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://openfreemap.org/)
[![SHA-256 Audit](https://img.shields.io/badge/Audit_Vault-SHA--256-10B981?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/saiadithya-k/ResQNet)

ResQNet converts fragmented emergency signals into an orchestrated tactical response. By synthesizing cross-lingual NLP triage, dynamic multi-factor priority calculation, vector GIS overlays, ACID concurrency-locked dispatching, live hospital telemetry, 500m community first-responder mobilization, disaster scenario modeling, and tamper-evident SHA-256 audit logging, ResQNet eliminates operational latency across the entire emergency lifecycle.

```
[ 🌐 LIVE PRODUCTION ]   https://res-q-net-flame.vercel.app/
[ ⚡ WORKFLOW CANVAS ]   https://res-q-net-flame.vercel.app/workflow (No Login Required)
[ 🚀 QUICK START GUIDE ] #quick-start
[ 🔑 DEMO PERSONAS ]     #demo-credentials
```

---

## THE RESQNET THESIS

During severe urban emergencies and mass casualty disasters, conventional response workflows break down at the seams between disconnected systems: voice distress calls lack structured telemetry, dispatchers suffer concurrency race conditions, hospital diversion statuses are unknown to en-route units, and post-incident compliance lacks cryptographically verifiable records.

ResQNet restructures emergency management as a deterministic, closed-loop pipeline:

```
[ SIGNAL ]       Citizen Voice SOS / Multilingual Text / GPS Telemetry
    │
    ▼
[ INTELLIGENCE ] Cross-Lingual NLP Extraction & Emotional Urgency Analysis
    │
    ▼
[ INCIDENT ]     Spatial-Temporal Deduplication & Cluster Association
    │
    ▼
[ DECISION ]     Dynamic Priority Scoring (1–100) & Algorithmic Triage
    │
    ▼
[ ACTION ]       6-Factor ACID-Locked Responder Dispatch & 500m Community Mobilization
    │
    ▼
[ COORDINATION ] MapLibre Vector GIS Routing & Hospital Bed Telemetry Reservation
    │
    ▼
[ OUTCOME ]      Targeted Field Care, Surgical Intake & Evacuation Safe Handoff
    │
    ▼
[ AUDIT ]        Tamper-Evident SHA-256 Evidence Vault & Verifiable Audit Trail
```

---

## THE EMERGENCY PIPELINE

Every distress signal reported in ResQNet traverses a synchronized 10-stage lifecycle state machine:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  01 REPORT   │ ──► │02 AI ANALYSIS│ ──► │ 03 VERIFIED  │ ──► │04 PRIORITIZED│ ──► │05 DISPATCHING│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                                            │
                                                                                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 10 RESOLVED  │ ◄── │ 09 RECEIVED  │ ◄── │ 08 ON SCENE  │ ◄── │ 07 EN ROUTE  │ ◄── │ 06 ASSIGNED  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Stage | Identifier | Operational Purpose | System Action & State Transition | Responsible Subsystem |
|---|---|---|---|---|
| **01** | `REPORT` | Distress signal ingestion | Captures location coordinates, description, casualty count, and media attachments | Citizen Portal / Voice SOS |
| **02** | `AI ANALYSIS` | NLP extraction & triage | Normalizes text across 4 languages; extracts victims, trapped status, fire/hazmat hazards | AI Extraction Service |
| **03** | `VERIFIED` | Spatial-temporal validation | Runs spatial radius (500m) and temporal window (30m) deduplication clustering | Incident Engine |
| **04** | `PRIORITIZED` | Urgency score computation | Computes deterministic priority score (1–100) and assigns priority factor tags | Priority Engine |
| **05** | `DISPATCHING` | Resource matching | Evaluates active units via 6-factor scoring algorithm (skills, gear, distance, ETA, fatigue, workload) | Dispatcher Service |
| **06** | `ASSIGNED` | Concurrency-safe lock | Executes atomic PostgreSQL transaction lock; transitions unit to `DISPATCHED` | ACID Dispatch Engine |
| **07** | `EN ROUTE` | Tactical GIS transit | Streams live GPS telemetry; computes dual-path emergency vs standard corridors | Routing / MapLibre Engine |
| **08** | `ON SCENE` | Field operation & triage | Unit arrives on-scene; updates victim triage status, mutual aid requests, and casualty count | Responder Field Portal |
| **09** | `HOSPITAL RECEIVED` | Trauma center intake | Patient handoff to receiving hospital; locks ICU bed and emergency trauma suite | Hospital Mesh Network |
| **10** | `RESOLVED` | Mission closure & audit | Incident marked resolved; seals all timeline events and evidence with SHA-256 hashes | SHA-256 Audit Vault |

---

## TACTICAL WORKFLOW CANVAS

ResQNet provides a dedicated, full-screen **Tactical Emergency Workflow Canvas** that visually models how all twelve operational subsystems interconnect in real time.

```
CITIZEN INTAKE ──► AI INTELLIGENCE ──► INCIDENT ENGINE ──► PRIORITY ENGINE
                                                                 │
                                                                 ▼
COMMAND CENTER ◄── GIS / ROUTING ◄── RESPONDER FLEET ◄────── DISPATCH MESH
      │
      ├──► HOSPITAL CAPACITY MESH ──► SURVIVOR SAFETY
      │
      └──► RESOURCE COORDINATION ──► SHA-256 AUDIT VAULT
```

- **Interactive State Inspection**: Operators can click any subsystem node to inspect underlying REST endpoints, WebSocket events, payload schemas, and operational status.
- **End-to-End Simulation**: Allows dispatchers and system evaluators to simulate the progression of an emergency from citizen SOS ingestion through to hospital handoff.
- **Public Accessibility**: Hosted publicly at `/workflow` (and `/admin/workflow`) with zero authentication required for public architectural transparency and training demonstrations.

---

## LOCATION INTELLIGENCE

Authoritative spatial positioning is the cornerstone of emergency response. ResQNet implements three convergent location acquisition mechanisms:

```
[ BROWSER GPS API ] ─────► High-Precision Coordinates (Lat/Lon) ┐
                                                                 │
[ PLACE / NOMINATIM ] ───► Geocoding Normalization & Matching ───┼──► AUTHORITATIVE INCIDENT LOCATION
                                                                 │    (Latitude, Longitude, District)
[ INTERACTIVE MAP PIN ] ─► MapLibre Draggable Vector Anchor ─────┘
                                                                               │
                                                                               ▼
                                                            PostgreSQL / Prisma + Socket.IO Broadcast
                                                                               │
                                                                               ▼
                                                            Command Center Tactical GIS Visualization
```

1. **Browser GPS Hardware Acquisition**: Direct device geolocation query retrieving high-precision latitude, longitude, and estimated accuracy circle.
2. **Place Search & Geocoding**: Search bar backed by structured landmark caching and Nominatim geocoding to resolve street addresses, buildings, and transit hubs into geographic coordinates.
3. **Interactive Vector Map Pinning**: Draggable tactical map marker rendered over MapLibre vector tiles allowing citizens and dispatchers to adjust incident coordinates down to exact building entry gates.

---

## TACTICAL GIS

ResQNet utilizes a high-performance vector mapping architecture that decouples basemap vector tile delivery from client-side operational visualization:

- **OpenFreeMap Vector Tile Infrastructure**: Provides high-resolution global base map vector tiles (`positron` light and `dark` tactical night modes) without third-party API token constraints or rate limits.
- **MapLibre GL Vector Rendering Engine**: Renders client-side WebGL vector overlays, smooth marker interpolation, dynamic zoom scaling, and layer visibility toggles.
- **Operational Tactical Overlays**:
  - **Active Emergency Markers**: Color-coded by incident severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with priority badges.
  - **Tactical Responder Fleet**: Real-time position markers tracking ambulances, heavy rescue fire engines, police units, and volunteer first responders.
  - **Trauma Centers & Hospitals**: Geographic markers with live bed occupancy percentages and accepting/diverting status.
  - **Evacuation Shelters**: Capacity monitoring pins indicating shelter occupancy ratios.
  - **Hazard Inundation Zones**: Vector polygon overlays representing active flood, collapse perimeter, and toxic chemical dispersion boundaries.
  - **Roadblocks & Avoidance Corridors**: Closed road vectors mapped to prevent routing units into hazardous zones.
  - **Dual Route Optimization**: Visual comparison between standard traffic routes and emergency priority transit corridors with calculated ETA savings.
  - **Incident Heatmap**: Dynamic density clustering visualizing geographic emergency concentration hotspots.

---

## AI EMERGENCY INTELLIGENCE

ResQNet includes an embedded, multimodal emergency extraction and triage engine designed to process chaotic distress messages under zero-latency conditions:

```
Distress Message (Voice / Text)
      │
      ▼
Language Normalization [ English | Tamil | Hindi | Telugu ]
      │
      ├──► Entity Extraction: Incident Type [ COLLAPSE | FIRE | HAZMAT | FLOOD | MEDICAL ]
      ├──► Casualty Count: Numeric digits and multilingual number word parsing
      ├──► Hazard Flags: Entrapment, Active Fire, Toxic Hazmat, Injuries, Vulnerable Groups
      └──► Emotion State: Distress & Urgency classification [ PANICKED | DISTRESSED | ANXIOUS | CALM ]
      │
      ▼
Dynamic Priority Score Computation (1–100)
```

### Deterministic Priority Scoring Model

Priority is computed with strict precedence for physical life-safety threats over subjective emotional signals:

$$\text{Priority} = \text{Base}(30) + \text{Severity} + \min(20, \text{Victims} \times 3) + \min(10, \text{Vulnerable} \times 2) + \text{Hazards} + \text{Emotion Urgency}$$

- **Physical Severity Foundation**: `CRITICAL` (+35), `HIGH` (+25), `MEDIUM` (+15), `LOW` (+5).
- **Physical Hazard Amplifiers**: Trapped Victims (+12), Structural/Bodily Injuries (+8), Active Fire (+10), Hazmat/Chemical Leak (+15).
- **Emotional Urgency Supplement**: High urgency signal (+5).
- **Bounded Range**: Deterministically clamped to $[1, 100]$.

### Operational AI Copilot Interface

The built-in Copilot is an **Operational Intelligence Interface** with real-time access to database state, hospital telemetry, resource inventories, and disaster status. It supports role-adaptive prompt chips and natural-language queries:

- **Commander Copilot**: Real-time analytical queries regarding critical unassigned incidents, ICU bed bottlenecks, ambulance shortages, and shelter capacity pressure.
- **Citizen Safety Assist**: Guided step-by-step CPR and first-aid instructions, nearest evacuation shelter routing, active disaster alerts, and verified emergency helplines.

---

## DISPATCH INTELLIGENCE

### 6-Factor Responder Matching Engine

When an emergency is prioritized, ResQNet scores all available units using a multi-factor operational algorithm:

$$\text{Match Score} = 0.25(\text{Skill}) + 0.20(\text{Equipment}) + 0.15(\text{Distance}) + 0.10(\text{ETA}) + 0.15(\text{Fatigue Freshness}) + 0.15(\text{Workload})$$

```
┌───────────────────────────┬────────┬────────────────────────────────────────────────────────┐
│ Factor                    │ Weight │ Calculation Logic                                      │
├───────────────────────────┼────────┼────────────────────────────────────────────────────────┤
│ Skill Compatibility       │  25%   │ Percentage match against incident requirement set      │
│ Equipment Compatibility   │  20%   │ Match ratio for required tactical apparatus & gear     │
│ Geographic Proximity      │  15%   │ Linear decay based on distance in kilometers           │
│ Estimated Time of Arrival │  10%   │ Travel time calculation based on road transit estimate │
│ Fatigue Freshness         │  15%   │ Inverse score of cumulative duty hours (100 - Fatigue) │
│ Active Workload Capacity  │  15%   │ Unit availability penalty per active assignment        │
└───────────────────────────┴────────┴────────────────────────────────────────────────────────┘
```

### ACID Concurrency Protection

To eliminate double-dispatch race conditions where two simultaneous dispatchers attempt to assign the same unit, ResQNet wraps responder assignment inside **ACID-compliant PostgreSQL transactions** (`prisma.$transaction`). If a concurrent assignment is detected, the transaction aborts with a `409 Conflict` status, protecting field units against conflicting orders.

---

## HOSPITAL CAPACITY INTELLIGENCE

ResQNet continuously tracks regional medical infrastructure to eliminate ambulance diversion loops and emergency room delays:

- **Live Medical Telemetry**: Real-time tracking of general staffed beds, specialized ICU rooms, pediatric units, operating theaters, and emergency intake bays.
- **Incoming Patient Notification**: Automated pre-arrival transmission of incident severity, victim counts, and triage notes directly to the destination hospital's intake dashboard.
- **Deterministic Hospital Matching (4-Factor Model)**:
  - Bed Capacity Ratio (30%)
  - ICU Availability Ratio (25%)
  - Specialty Department Readiness (25%)
  - Geographic Distance Proximity (20%)
- **Inter-Hospital Transfers**: Coordinated load balancing and patient transfer routing when regional facilities reach high occupancy thresholds ($\ge 80\%$).

---

## COMMUNITY RESPONSE MESH

For sudden cardiac arrests, structural collapses, and flash flood isolations, survival rates drop significantly within the initial 5 to 10 minutes. ResQNet incorporates a **500-Meter Hyper-Local Community Responder Circle**:

```
EMERGENCY REPORTED (Cardiac / Entrapment / Medical)
      │
      ├────────────────────────────────────────┐
      ▼                                        ▼
TACTICAL DISPATCH                      500m PROXIMITY RADIUS
Professional Paramedic / Fire Unit     Nearby Certified Citizen Volunteers
(Dispatched via Heavy Fleet)           (Mobilized via Citizen App Alert)
      │                                        │
      │   [ 8–15 Min Transit Window ]          │   [ 2–4 Min Arrival Window ]
      │                                        ▼
      │                                First-Aid & Bystander CPR Initiated
      ▼                                        │
Professional EMT Unit On Scene ◄───────────────┘
Definitive Care & Hospital Transit
```

- **Clear Separation of Roles**: Community responders provide immediate bystander aid (CPR, AED retrieval, bleeding control) during the initial window and hand over operational command upon professional unit arrival.

---

## DISASTER SIMULATION

ResQNet includes a built-in tactical crisis simulator allowing emergency management officials to model complex multi-hazard scenarios:

- **Scenario Customization**: Configurable disaster types (`FLOOD_FLASH_SURGE`, `EARTHQUAKE_STRUCTURAL`, `CYCLONE_COASTAL`, `INDUSTRIAL_HAZMAT`), target geographic districts, severity levels (Level 1 to 5), and radius of impact.
- **Predictive Impact Modeling**:
  - Projected total casualties and entrapped victim counts.
  - Required emergency unit demand (Ambulance, Fire Rescue, Hazmat, Watercraft).
  - Estimated regional hospital bed and ICU capacity saturation timelines.
  - Evacuation shelter demand and estimated road blockage points.
- **One-Click Live Deployment**: Enables emergency chiefs to transition the entire operational network into **Disaster Mode**, broadcasting global alert banners and activating evacuation zone polygons.

---

## RESOURCE COORDINATION & RECONCILIATION

During mass casualty incidents, inter-agency resource coordination prevents critical logistical bottlenecks:

- **Logistics Mesh**: Centralized tracking of emergency generators, inflatable rescue boats, blood supply units, heavy cutting equipment, and portable oxygen banks.
- **Request & Approval Lifecycle**: Structured workflow from field resource requisition, commander approval, to unit transit tracking.
- **Physical Reconciliation Engine**: Validates actual delivered supplies against original dispatch manifests, automatically flagging:
  - `SHORTAGE_DETECTED`: Discrepancy logged when delivered quantity falls below authorized dispatch quota.
  - `OVERAGE_LOGGED`: Excess supply received and re-indexed into regional inventory.
  - `VERIFIED_MATCH`: Complete manifest reconciliation confirmed.

---

## EVIDENCE INTEGRITY & AUDIT TRAIL

To maintain an untampered chain of custody for legal inquests and insurance verifications, ResQNet integrates cryptographic validation across all evidence and operational actions:

```
Citizen Upload (Photo / Video / Audio)
      │
      ▼
Server-Side Binary SHA-256 Hashing
      │
      ▼
Evidence Record Created: [ ID | Hash | File Size | Timestamp | Uploader ]
      │
      ▼
Client & Server Hash Verification Validation
      │
      ▼
Logged to Immutable Operational Audit Log
```

- **Tamper-Evident SHA-256 Hashing**: Every media file uploaded during an emergency is hashed using cryptographic SHA-256 before storage.
- **Chain of Custody Verification**: Verification endpoint (`POST /api/evidence/verify`) compares client-computed hashes against stored records to detect any file tampering or corruption.
- **Auditable Event Log**: Every status transition, dispatcher assignment, disaster declaration, and hospital intake is recorded with timestamps, user identities, and action summaries.

---

## TACTICAL COMMAND CENTER

The Command Center (`/admin/command`) provides dispatchers and incident commanders with a centralized operational dashboard:

- **Active Incident Queue**: Real-time list sorted dynamically by priority score ($100 \rightarrow 1$), with severity badges and lifecycle state pills.
- **Integrated Vector Map**: Interactive GIS viewport with live responder markers, route vectors, hazard perimeters, and roadblock layers.
- **One-Click Dispatch Modal**: Ranked responder recommendations with multi-factor match breakdowns and ETA estimates.
- **Hospital Bed Capacity Telemetry**: Regional medical center status cards with live bed occupancy bars and specialty availability.
- **Evacuation Shelter Monitoring**: Shelter capacity tracking with automated overload warning badges.
- **Disaster Mode Controls**: Command panel to declare, simulate, and stand down regional disaster emergencies.
- **Embedded AI Copilot**: Command-line style conversational interface for real-time grid diagnostics.

---

## SYSTEM ARCHITECTURE

```
                                  ┌───────────────────────────┐
                                  │      RESQNET CLIENT       │
                                  │   Vue 3 + Vite + Pinia    │
                                  └─────────────┬─────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │ HTTP REST (JSON)                                │ WebSocket (Socket.IO)
                       ▼                                                 ▼
        ┌─────────────────────────────────────────────────────────────────────────┐
        │                        EXPRESS.JS APPLICATION                           │
        │                                                                         │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
        │  │ Auth & RBAC      │  │ Incident Engine  │  │ AI Triage & Scoring   │  │
        │  │ JWT / Bcrypt     │  │ Lifecycle FSM    │  │ Multilingual NLP      │  │
        │  └──────────────────┘  └──────────────────┘  └───────────────────────┘  │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
        │  │ Dispatch Service │  │ Hospital Mesh    │  │ Resource Coordination │  │
        │  │ 6-Factor Matcher │  │ Capacity Tracker │  │ Reconciliation Engine │  │
        │  └──────────────────┘  └──────────────────┘  └───────────────────────┘  │
        │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
        │  │ GIS & Routing    │  │ Disaster Engine  │  │ Evidence Vault        │  │
        │  │ Nominatim Cache  │  │ Scenario Sim     │  │ SHA-256 Hasher        │  │
        │  └──────────────────┘  └──────────────────┘  └───────────────────────┘  │
        └───────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │      PRISMA CLIENT ORM      │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │     POSTGRESQL DATABASE     │
                         │    ACID Concurrency Locks   │
                         └─────────────────────────────┘

GIS Infrastructure:
┌───────────────────────────┐         ┌───────────────────────────┐
│       MAPLIBRE GL         │ ◄─────► │       OPENFREEMAP         │
│ Vector Visualization Engine│         │ Free Vector Tile Server   │
└───────────────────────────┘         └───────────────────────────┘
```

---

## REAL-TIME EVENT MESH

ResQNet uses Socket.IO to broadcast operational events across all connected browser clients with sub-100ms latency:

```
[ INCIDENT CREATED / UPDATED ] ──► io.emit('incident:created', data) ─────► Map & Incident Queue Update
[ RESPONDER DISPATCHED ] ───────► io.emit('incident:assigned', data) ────► Unit Dispatched Notification
[ RESPONDER GPS TELEMETRY ] ────► io.emit('responder:location_updated') ──► Vector Marker Interpolation
[ HOSPITAL CAPACITY CHANGED ] ──► io.emit('hospital:capacity_updated') ──► Intake Mesh Telemetry Sync
[ DISASTER MODE TOGGLED ] ──────► io.emit('disaster:activated', data) ────► Global Crisis Alert Banner
[ PUBLIC ALERT BROADCAST ] ─────► io.emit('alert:created', data) ────────► Citizen Notification Center
```

---

## SECURITY & AUDITABILITY

- **Authentication**: Stateless JSON Web Tokens (JWT) with configurable expiration windows and bcrypt password hashing.
- **Role-Based Access Control (RBAC)**: Enforced route guards for `CITIZEN`, `DISPATCHER`, `ADMIN`, `RESPONDER`, and `HOSPITAL_LEAD` roles.
- **Coordinate Bounds Validation**: Strict server-side coordinate validation ensuring latitude $\in [-90, 90]$ and longitude $\in [-180, 180]$.
- **Tamper-Evident Evidence Storage**: Binary SHA-256 hash generation for every uploaded image, video, and audio attachment.
- **ACID Transaction Isolation**: Serializable PostgreSQL write transactions preventing double-dispatch race conditions.

---

## LIVE PLATFORM GATEWAYS

| Portal Interface | Live Production Gateway | Target Role & Purpose | Access Level |
|---|---|---|---|
| **⚡ Tactical Workflow Canvas** | [res-q-net-flame.vercel.app/workflow](https://res-q-net-flame.vercel.app/workflow) | Interactive system architecture and emergency lifecycle simulation | **Public (No Login)** |
| **🚨 Public Gateway** | [res-q-net-flame.vercel.app/](https://res-q-net-flame.vercel.app/) | Platform landing page, capability highlights, and portal entry points | **Public** |
| **📱 Citizen Safety Hub** | [res-q-net-flame.vercel.app/login/citizen](https://res-q-net-flame.vercel.app/login/citizen) | Emergency reporting, voice SOS intake, family safety circles | **Role-Based** |
| **🛡️ Operations & Command** | [res-q-net-flame.vercel.app/login/operations](https://res-q-net-flame.vercel.app/login/operations) | Tactical GIS command center, unit dispatching, hospital bed mesh | **Role-Based** |
| **🚑 Field Responder Portal** | [res-q-net-flame.vercel.app/responder](https://res-q-net-flame.vercel.app/responder) | Paramedic & firefighter assignment console and navigation telemetry | **Role-Based** |
| **🏥 Hospital Intake Console** | [res-q-net-flame.vercel.app/hospital](https://res-q-net-flame.vercel.app/hospital) | Regional trauma bed capacity management and incoming patient registry | **Role-Based** |
| **🤝 Community Responder Hub** | [res-q-net-flame.vercel.app/community](https://res-q-net-flame.vercel.app/community) | 500m volunteer CPR/AED emergency mobilization | **Role-Based** |
| **🔐 Central Auth Gateway** | [res-q-net-flame.vercel.app/login](https://res-q-net-flame.vercel.app/login) | Universal role-based authentication portal | **Public** |

---

## DEMO CREDENTIALS

> [!NOTE]
> **DEMO ENVIRONMENT ONLY**: The following pre-seeded personas are configured for evaluation and demonstration. All demo accounts share the universal demo password.

**Universal Demo Password**: `password123`

| Role / Persona | Username / Mobile | Persona Name | Primary Destination Dashboard |
|---|---|---|---|
| **Citizen Reporter** | `+91 9876543210` | Vignesh Kumar | [/citizen](https://res-q-net-flame.vercel.app/citizen) |
| **Tactical Commander** | `+91 9876543211` | Chief Miller | [/admin/command](https://res-q-net-flame.vercel.app/admin/command) |
| **Emergency Dispatcher** | `+91 9876543212` | John Davis | [/admin/command](https://res-q-net-flame.vercel.app/admin/command) |
| **Field Paramedic (EMT)** | `+91 9876543213` | Sarah Connor | [/responder](https://res-q-net-flame.vercel.app/responder) |
| **Community Volunteer** | `+91 9876543214` | Alex Rivera | [/community](https://res-q-net-flame.vercel.app/community) |
| **Trauma Center Lead** | `+91 9876543215` | Dr. Robert Chen | [/hospital](https://res-q-net-flame.vercel.app/hospital) |

---

## TECHNOLOGY STACK

| Operational Layer | Technology | Repository Purpose |
|---|---|---|
| **Frontend Framework** | Vue.js 3.5 (Composition API) | Reactive Single Page Application architecture |
| **Build Tooling** | Vite 6.x | Fast ESM module bundling and production optimization |
| **State Management** | Pinia 3.x | Modular client state stores for incidents, responders, and telemetry |
| **Routing** | Vue Router 4.x | Navigation guards and role-based portal protection |
| **GIS Vector Engine** | MapLibre GL 5.x | Interactive WebGL vector map rendering |
| **Vector Basemap** | OpenFreeMap | Free vector map tile service (`positron` & `dark` styles) |
| **Backend Runtime** | Node.js 20.x + Express 4.x | RESTful API server and domain business logic |
| **Real-Time Engine** | Socket.IO 4.x | Bi-directional WebSocket event communication |
| **Database** | PostgreSQL 16 | Relational operational data store with ACID transaction support |
| **ORM** | Prisma 5.22 | Type-safe schema definition, migrations, and query generation |
| **Authentication** | JSON Web Tokens (JWT) + BcryptJS | Stateless token authentication and password hashing |
| **Audit Verification** | Node.js `crypto` (SHA-256) | Binary evidence hashing and tamper-evident audit logs |

---

## QUICK START

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or `v10.x`
- **Docker & Docker Compose** (for PostgreSQL) or local PostgreSQL instance

### 2. Repository Installation
```bash
# Clone the repository
git clone https://github.com/saiadithya-k/ResQNet.git
cd ResQNet

# Install all monorepo dependencies (root, backend, frontend)
npm run install:all
```

### 3. Environment & Database Configuration
```bash
# Start local PostgreSQL database container
docker compose up -d postgres

# Generate Prisma client & push database schema
npm run prisma:generate
npm run prisma:push

# Seed pre-configured demo personas and operational incidents
npm run prisma:seed
```

### 4. Launch Development Servers
```bash
# Concurrently launches Backend API (:5000) and Frontend SPA (:5173)
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Gateway**: `http://localhost:5000/api`
- **Socket.IO Real-Time Port**: `http://localhost:5000`

---

## REPOSITORY STRUCTURE

```text
ResQNet/
├── backend/                        # Express REST API & Socket.IO Real-Time Engine
│   ├── src/
│   │   ├── config/                # Database connection, Prisma client & environment variables
│   │   ├── controllers/           # Incident, Dispatch, Hospital, AI, GIS, Alert & Resource controllers
│   │   ├── middleware/            # JWT authentication, rate limiting, and RBAC role guards
│   │   ├── routes/                # Express endpoint definitions (19 domain route modules)
│   │   ├── services/              # Domain services (AI extraction, 6-factor matcher, hospital mesh)
│   │   ├── socket/                # Socket.IO event handlers (incidents, responders, disasters)
│   │   └── utils/                 # Priority scoring algorithms, distance math, logger & errors
│   ├── prisma/                    # Backend Prisma schema & seed script
│   └── server.js                  # Express HTTP server & Socket.IO initialization
├── frontend/                       # Vue 3 + Vite Single Page Application
│   ├── src/
│   │   ├── assets/                # Global styles, tactical themes & design tokens
│   │   ├── components/            # Reusable UI (MapLibre Map, AI Copilot, Navbar, Sidebar)
│   │   ├── router/                # Route definitions & authentication navigation guards
│   │   ├── services/              # Axios API client, Geocoding service & Socket.IO service
│   │   ├── stores/                # Pinia state stores (Auth, Incidents, Responders, Disasters)
│   │   └── views/                 # Domain views (Landing, Command Center, Workflow, Citizen, Hospital)
│   ├── vite.config.js             # Vite configuration with API & WebSocket proxies
│   └── index.html                 # Single page application entry point
├── prisma/                         # Root Prisma schema and database seeds
├── docker-compose.yml              # Local PostgreSQL container configuration
└── package.json                    # Monorepo task orchestration scripts
```

---

## RESQNET CAPABILITY MATRIX

| System Capability | Implementation Status | Technical Subsystem |
|---|---|---|
| **Citizen Emergency Reporting** | `IMPLEMENTED` | Form & location submission with media upload |
| **Multilingual AI Entity Extraction** | `IMPLEMENTED` | Cross-lingual parser (English, Tamil, Hindi, Telugu) |
| **Dynamic Priority Scoring (1–100)** | `IMPLEMENTED` | Deterministic multi-factor scoring algorithm |
| **Spatial Deduplication & Clustering** | `IMPLEMENTED` | Spatial-temporal radius similarity matcher |
| **Tactical MapLibre Vector GIS** | `IMPLEMENTED` | WebGL vector map with OpenFreeMap tiles |
| **GPS Hardware Location Acquisition** | `IMPLEMENTED` | Browser Geolocation API coordinate resolver |
| **Landmark & Place Name Search** | `IMPLEMENTED` | Nominatim search with local landmark cache |
| **Interactive Map Pinning** | `IMPLEMENTED` | Draggable vector anchor with reverse geocoding |
| **6-Factor Responder Matching** | `IMPLEMENTED` | Weighted multi-factor recommendation engine |
| **ACID Concurrency-Locked Dispatch** | `IMPLEMENTED` | PostgreSQL transaction isolation (`prisma.$transaction`) |
| **Hospital Bed & ICU Telemetry** | `IMPLEMENTED` | Real-time capacity tracker & incoming patient logger |
| **500m Community Responder Mesh** | `IMPLEMENTED` | Hyper-local CPR/AED volunteer mobilization |
| **Multi-Hazard Disaster Simulator** | `IMPLEMENTED` | Impact projection engine & Disaster Mode toggle |
| **Resource Coordination & Reconciliation**| `IMPLEMENTED` | Inter-agency request, approval & manifest reconciliation |
| **Tamper-Evident SHA-256 Vault** | `IMPLEMENTED` | Cryptographic binary media hashing & validation |
| **Tactical Workflow Canvas** | `IMPLEMENTED` | Public interactive 10-stage architecture visualization |
| **Operational AI Copilot Interface** | `IMPLEMENTED` | Context-aware telemetry diagnostics console |

---

<div align="center">
  <sub>ResQNet — Engineered for Crisis Resilience • Open-Source MIT License</sub>
</div>
