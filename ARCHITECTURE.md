# 🏗️ ResQNet — System Architecture & Development Blueprint

> Complete technical architecture for the AI-Powered Emergency Intelligence & Disaster Coordination Platform.

---

## 📋 Table of Contents

1. [Project File Structure](#project-file-structure)
2. [System Architecture](#system-architecture)
3. [AI Architecture](#ai-architecture)
4. [Dispatch Architecture](#dispatch-architecture)
5. [Community Responder Architecture](#community-responder-architecture)
6. [Hospital Matching Architecture](#hospital-matching-architecture)
7. [Cross-Agency Resource Architecture](#cross-agency-resource-architecture)
8. [Disaster Intelligence Architecture](#disaster-intelligence-architecture)
9. [Disaster Mode Architecture](#disaster-mode-architecture)
10. [GIS Architecture](#gis-architecture)
11. [Evidence Architecture](#evidence-architecture)
12. [Real-Time Architecture](#real-time-architecture)
13. [Database Architecture](#database-architecture)
14. [Incident State Machine](#incident-state-machine)
15. [Team Ownership](#team-ownership)
16. [Final Architecture Diagram](#final-architecture-diagram)

---

## 📁 Project File Structure

Modular monorepo so all 3 teams can work independently without creating three separate applications.

```text
smart-emergency-response/
│
├── README.md
├── ARCHITECTURE.md
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── main.js
│       ├── App.vue
│       │
│       ├── assets/
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── AppNavbar.vue
│       │   │   ├── AppSidebar.vue
│       │   │   ├── LoadingSpinner.vue
│       │   │   ├── StatusBadge.vue
│       │   │   ├── ConfirmDialog.vue
│       │   │   └── NotificationToast.vue
│       │   │
│       │   ├── map/
│       │   │   ├── EmergencyMap.vue
│       │   │   ├── IncidentMarker.vue
│       │   │   ├── ResponderMarker.vue
│       │   │   ├── HospitalMarker.vue
│       │   │   ├── ShelterMarker.vue
│       │   │   ├── DisasterZone.vue
│       │   │   └── MapLegend.vue
│       │   │
│       │   ├── incidents/
│       │   │   ├── IncidentCard.vue
│       │   │   ├── IncidentDetails.vue
│       │   │   ├── IncidentTimeline.vue
│       │   │   ├── PriorityBadge.vue
│       │   │   └── IncidentFilters.vue
│       │   │
│       │   ├── ai/
│       │   │   ├── EmotionIndicator.vue
│       │   │   ├── SeverityScore.vue
│       │   │   ├── AIAnalysisCard.vue
│       │   │   ├── DuplicateReports.vue
│       │   │   └── CopilotChat.vue
│       │   │
│       │   ├── responders/
│       │   │   ├── ResponderCard.vue
│       │   │   ├── ResponderStatus.vue
│       │   │   ├── ResponderLocation.vue
│       │   │   ├── FatigueIndicator.vue
│       │   │   └── DispatchPanel.vue
│       │   │
│       │   ├── hospitals/
│       │   │   ├── HospitalCard.vue
│       │   │   ├── HospitalCapacity.vue
│       │   │   ├── IncomingPatient.vue
│       │   │   └── HospitalMatch.vue
│       │   │
│       │   ├── resources/
│       │   │   ├── ResourceCard.vue
│       │   │   ├── ResourceRequest.vue
│       │   │   ├── ResourceTransfer.vue
│       │   │   └── ResourceShortage.vue
│       │   │
│       │   ├── disaster/
│       │   │   ├── DisasterMode.vue
│       │   │   ├── DisasterSimulator.vue
│       │   │   ├── SurvivorCheckIn.vue
│       │   │   ├── MissingPersons.vue
│       │   │   └── ShelterCard.vue
│       │   │
│       │   └── evidence/
│       │       ├── EvidenceUpload.vue
│       │       ├── EvidenceVerification.vue
│       │       └── AuditTimeline.vue
│       │
│       ├── views/
│       │   │
│       │   ├── auth/
│       │   │   ├── Login.vue
│       │   │   ├── Register.vue
│       │   │   └── ForgotPassword.vue
│       │   │
│       │   ├── citizen/
│       │   │   ├── CitizenDashboard.vue
│       │   │   ├── ReportEmergency.vue
│       │   │   ├── VoiceReport.vue
│       │   │   ├── MyEmergencies.vue
│       │   │   ├── EmergencyTracking.vue
│       │   │   ├── FamilySafety.vue
│       │   │   ├── SurvivorCheckIn.vue
│       │   │   └── PublicAlerts.vue
│       │   │
│       │   ├── responder/
│       │   │   ├── ResponderDashboard.vue
│       │   │   ├── ActiveIncident.vue
│       │   │   ├── ResponderProfile.vue
│       │   │   ├── Certifications.vue
│       │   │   ├── Equipment.vue
│       │   │   └── DutyStatus.vue
│       │   │
│       │   ├── community/
│       │   │   ├── CommunityDashboard.vue
│       │   │   ├── Certification.vue
│       │   │   ├── NearbyEmergency.vue
│       │   │   └── AssistanceHistory.vue
│       │   │
│       │   ├── hospital/
│       │   │   ├── HospitalDashboard.vue
│       │   │   ├── CapacityManagement.vue
│       │   │   ├── IncomingPatients.vue
│       │   │   ├── Specialists.vue
│       │   │   └── HospitalResources.vue
│       │   │
│       │   └── admin/
│       │       ├── CommandCenter.vue
│       │       ├── Incidents.vue
│       │       ├── Responders.vue
│       │       ├── Hospitals.vue
│       │       ├── Resources.vue
│       │       ├── DisasterManagement.vue
│       │       ├── DisasterSimulation.vue
│       │       ├── Predictions.vue
│       │       ├── Analytics.vue
│       │       ├── EvidenceAudit.vue
│       │       └── AuditLogs.vue
│       │
│       ├── stores/
│       │   ├── authStore.js
│       │   ├── incidentStore.js
│       │   ├── responderStore.js
│       │   ├── hospitalStore.js
│       │   ├── resourceStore.js
│       │   ├── disasterStore.js
│       │   └── notificationStore.js
│       │
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── incidentService.js
│       │   ├── responderService.js
│       │   ├── hospitalService.js
│       │   ├── resourceService.js
│       │   ├── disasterService.js
│       │   ├── evidenceService.js
│       │   ├── predictionService.js
│       │   └── socketService.js
│       │
│       ├── composables/
│       │   ├── useAuth.js
│       │   ├── useSocket.js
│       │   ├── useLocation.js
│       │   ├── useEmergency.js
│       │   └── useNotifications.js
│       │
│       ├── router/
│       │   └── index.js
│       │
│       └── utils/
│           ├── constants.js
│           ├── formatters.js
│           ├── validators.js
│           └── permissions.js
│
├── backend/
│   ├── package.json
│   ├── server.js
│   │
│   └── src/
│       ├── app.js
│       │
│       ├── config/
│       │   ├── database.js
│       │   ├── ai.js
│       │   ├── storage.js
│       │   └── environment.js
│       │
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── citizen.routes.js
│       │   ├── incident.routes.js
│       │   ├── ai.routes.js
│       │   ├── responder.routes.js
│       │   ├── community.routes.js
│       │   ├── hospital.routes.js
│       │   ├── resource.routes.js
│       │   ├── dispatch.routes.js
│       │   ├── route.routes.js
│       │   ├── survivor.routes.js
│       │   ├── disaster.routes.js
│       │   ├── prediction.routes.js
│       │   ├── alert.routes.js
│       │   ├── analytics.routes.js
│       │   ├── evidence.routes.js
│       │   └── audit.routes.js
│       │
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── incident.controller.js
│       │   ├── ai.controller.js
│       │   ├── responder.controller.js
│       │   ├── hospital.controller.js
│       │   ├── resource.controller.js
│       │   ├── dispatch.controller.js
│       │   ├── disaster.controller.js
│       │   ├── survivor.controller.js
│       │   ├── prediction.controller.js
│       │   ├── evidence.controller.js
│       │   └── analytics.controller.js
│       │
│       ├── services/
│       │   ├── auth/
│       │   │   ├── auth.service.js
│       │   │   └── token.service.js
│       │   │
│       │   ├── ai/
│       │   │   ├── extraction.service.js
│       │   │   ├── emotion.service.js
│       │   │   ├── severity.service.js
│       │   │   ├── priority.service.js
│       │   │   ├── duplicate.service.js
│       │   │   ├── copilot.service.js
│       │   │   └── prediction.service.js
│       │   │
│       │   ├── dispatch/
│       │   │   ├── dispatch.service.js
│       │   │   ├── responder-matching.service.js
│       │   │   ├── fatigue.service.js
│       │   │   └── skill-matching.service.js
│       │   │
│       │   ├── hospital/
│       │   │   ├── hospital-matching.service.js
│       │   │   └── capacity.service.js
│       │   │
│       │   ├── resources/
│       │   │   ├── resource.service.js
│       │   │   ├── negotiation.service.js
│       │   │   └── reconciliation.service.js
│       │   │
│       │   ├── disaster/
│       │   │   ├── disaster.service.js
│       │   │   ├── simulation.service.js
│       │   │   ├── crowd.service.js
│       │   │   └── weather.service.js
│       │   │
│       │   ├── routing/
│       │   │   └── routing.service.js
│       │   │
│       │   ├── evidence/
│       │   │   ├── hash.service.js
│       │   │   └── integrity.service.js
│       │   │
│       │   └── notification/
│       │       ├── notification.service.js
│       │       └── push.service.js
│       │
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── role.middleware.js
│       │   ├── validation.middleware.js
│       │   ├── upload.middleware.js
│       │   ├── rateLimit.middleware.js
│       │   └── error.middleware.js
│       │
│       ├── socket/
│       │   ├── socket.js
│       │   ├── incident.socket.js
│       │   ├── responder.socket.js
│       │   ├── hospital.socket.js
│       │   ├── resource.socket.js
│       │   └── disaster.socket.js
│       │
│       ├── utils/
│       │   ├── logger.js
│       │   ├── geo.js
│       │   ├── scoring.js
│       │   └── errors.js
│       │
│       └── jobs/
│           ├── prediction.job.js
│           ├── fatigue.job.js
│           ├── weather.job.js
│           └── crowd.job.js
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
│
├── docs/
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── database-architecture.md
│   │   ├── api-architecture.md
│   │   └── realtime-architecture.md
│   │
│   ├── api/
│   │   └── API.md
│   │
│   └── team/
│       ├── team-1.md
│       ├── team-2.md
│       └── team-3.md
│
└── tests/
    ├── frontend/
    ├── backend/
    └── integration/
```

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │        CITIZENS          │
                         │                          │
                         │ Text | Voice | Media     │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │      VUE FRONTEND        │
                         │                          │
                         │ Citizen / Responder      │
                         │ Community / Hospital     │
                         │ Admin / Command Center   │
                         └────────────┬─────────────┘
                                      │
                           REST API + WebSocket
                                      │
                                      ▼
                 ┌────────────────────────────────────────┐
                 │             EXPRESS.JS                 │
                 │             API GATEWAY                │
                 ├────────────────────────────────────────┤
                 │                                        │
                 │ Authentication / RBAC                  │
                 │ Incident Management                    │
                 │ AI Intelligence                        │
                 │ Dispatch                               │
                 │ Hospitals                              │
                 │ Resources                              │
                 │ Disaster Management                    │
                 │ Analytics                              │
                 │ Evidence / Audit                       │
                 └───────────────┬────────────────────────┘
                                 │
             ┌───────────────────┼────────────────────┐
             │                   │                    │
             ▼                   ▼                    ▼
    ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ AI INTELLIGENCE│  │ REAL-TIME ENGINE  │  │ EXTERNAL SERVICES│
    │                │  │                  │  │                  │
    │ Extraction     │  │ Socket.IO        │  │ Maps             │
    │ Emotion        │  │ Notifications    │  │ Weather          │
    │ Severity       │  │ Live Tracking    │  │ Events           │
    │ Priority       │  │ Alerts           │  │ Voice / AI       │
    │ Duplicate      │  │                  │  │ Storage          │
    │ Prediction     │  │                  │  │                  │
    └───────┬────────┘  └────────┬─────────┘  └──────────────────┘
            │                    │
            └────────────────────┼──────────────────┐
                                 │                  │
                                 ▼                  ▼
                       ┌──────────────────┐  ┌───────────────┐
                       │    POSTGRESQL    │  │ FILE STORAGE  │
                       │                  │  │               │
                       │ Users            │  │ Photos        │
                       │ Incidents        │  │ Videos        │
                       │ Responders       │  │ Audio         │
                       │ Hospitals        │  │ Documents     │
                       │ Resources        │  │ Evidence      │
                       │ Disasters        │  │               │
                       │ Audit Logs       │  │               │
                       └──────────────────┘  └───────────────┘
```

---

## 🧠 AI Architecture

Dedicated sequential AI pipeline. Every report passes through every stage.

```text
             CITIZEN INPUT
                   │
          ┌────────┴────────┐
          │                 │
        TEXT              VOICE
          │                 │
          │          Speech Recognition
          │                 │
          └────────┬────────┘
                   ▼
             NORMALIZATION
                   │
                   ▼
           LANGUAGE DETECTION
                   │
                   ▼
          ┌───────────────────┐
          │ AI EXTRACTION     │
          │                   │
          │ Incident Type     │
          │ Location          │
          │ Victims           │
          │ Injuries          │
          │ Hazards           │
          │ Trapped           │
          └─────────┬─────────┘
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
     EMOTION     SEVERITY     DUPLICATE
       AI           AI          AI
        │           │            │
        └───────────┼────────────┘
                    ▼
             PRIORITY ENGINE
                    │
                    ▼
              INCIDENT SCORE
                    │
                    ▼
           EMERGENCY QUEUE
```

> **Critical Rule:**
> - `Emotion` = urgency signal
> - `Severity` = danger / impact signal
> - `Priority` = combined operational decision
>
> Emotion should **not** directly override medical / operational severity.

---

## 🚑 Dispatch Architecture

```text
                  INCIDENT
                     │
                     ▼
            PRIORITY ENGINE
                     │
                     ▼
          REQUIRED SKILLS
                     │
                     ▼
          AVAILABLE RESPONDERS
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
       SKILLS    EQUIPMENT    FATIGUE
          │          │           │
          └──────────┼───────────┘
                     ▼
                  DISTANCE
                     │
                     ▼
                    ETA
                     │
                     ▼
              MATCHING SCORE
                     │
                     ▼
          BEST RESPONDER / UNIT
                     │
                     ▼
                  DISPATCH
```

---

## 🧑‍🚒 Community Responder Architecture

```text
Incident Created
       │
       ▼
Geospatial Search
       │
       ▼
500m Radius
       │
       ▼
Certified Responders
       │
       ▼
Skill Verification
       │
       ▼
Availability Check
       │
       ▼
Push Notification
       │
 ┌─────┴─────┐
 ▼           ▼
ACCEPT      DECLINE
 │
 ▼
Assist Until Professional Response
```

---

## 🏥 Hospital Matching Architecture

```text
Patient / Incident
       │
       ▼
Medical Requirements
       │
       ▼
Hospital Search
       │
 ┌─────┼────────┬─────────┐
 ▼     ▼        ▼         ▼
ICU  Trauma   Beds    Specialist
 │     │        │         │
 └─────┴────────┴─────────┘
              │
              ▼
         Distance / ETA
              │
              ▼
        Hospital Score
              │
              ▼
       Best Hospital
              │
              ▼
      Incoming Patient
              │
       ┌──────┴──────┐
       ▼             ▼
    ACCEPT         REDIRECT
```

---

## 🏛️ Cross-Agency Resource Architecture

```text
District A
Resource Shortage
       │
       ▼
Resource Intelligence
       │
       ▼
Find Nearby Districts
       │
       ▼
Available Resources
       │
       ▼
Generate Request
       │
       ▼
District B / C
       │
 ┌─────┴─────┐
 ▼           ▼
APPROVE     REJECT
 │
 ▼
Resource Dispatched
 │
 ▼
In Transit
 │
 ▼
Received
 │
 ▼
Deployed
 │
 ▼
Returned
 │
 ▼
Reconciliation Report
```

---

## 🌪️ Disaster Intelligence Architecture

```text
               EXTERNAL DATA
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
    Weather       Events       Historical
                                Data
       │            │             │
       └────────────┼─────────────┘
                    ▼
             RISK ENGINE
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
   Crowd Risk   Weather Risk  Incident Risk
        │           │            │
        └───────────┼────────────┘
                    ▼
             ZONE RISK SCORE
                    │
                    ▼
          RESOURCE REQUIREMENTS
                    │
                    ▼
          PRE-POSITION RESOURCES
```

---

## 🚨 Disaster Mode Architecture

```text
                ADMIN
                  │
                  ▼
        ACTIVATE DISASTER MODE
                  │
                  ▼
       ┌──────────────────────┐
       │ Disaster Controller  │
       └──────────┬───────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
Affected Zones  Alerts      Survivor System
    │             │             │
    ▼             ▼             ▼
Shelters      Citizens      Missing Persons
    │
    ▼
Resources
    │
    ▼
Responders
    │
    ▼
Hospitals
    │
    ▼
Command Center
```

---

## 📍 GIS Architecture

```text
                    LIVE MAP
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   INCIDENTS       RESPONDERS       HOSPITALS
       │               │                │
       ▼               ▼                ▼
   Severity         Status          Capacity
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                 GIS DATA LAYER
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Routes       Zones        Shelters
          │            │            │
          └────────────┼────────────┘
                       ▼
               COMMAND CENTER
```

---

## 🔐 Evidence Architecture

```text
Citizen Upload
      │
      ▼
File Validation
      │
      ▼
SHA-256 Hash
      │
      ├──────────────► File Storage
      │
      ▼
PostgreSQL
      │
      ├── Hash
      ├── Timestamp
      ├── Uploader
      ├── Incident ID
      └── Metadata
      │
      ▼
Audit Log
      │
      ▼
Later Verification
      │
      ▼
Recalculate Hash
      │
 ┌────┴────┐
 ▼         ▼
MATCH    MISMATCH
 │         │
 ▼         ▼
VERIFIED  ALERT
```

---

## ⚡ Real-Time Architecture

Socket.IO connects all operational dashboards. No polling, no page refresh.

```text
                     SOCKET.IO
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
     CITIZEN         RESPONDER         HOSPITAL
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                    ADMIN PANEL
```

### Socket Events

```text
incident:created
incident:updated
incident:priority_changed
incident:assigned

responder:location_updated
responder:status_changed
responder:fatigue_alert

hospital:capacity_updated
hospital:patient_incoming

resource:requested
resource:approved
resource:dispatched

survivor:checkin
alert:created

disaster:activated
disaster:updated
```

---

## 🗄️ Database Architecture

The database is centered around the **Incident** entity. Everything attaches to it.

```text
                         USERS
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
      CITIZENS        RESPONDERS        HOSPITALS
          │                │                │
          ▼                ▼                ▼
      REPORTS         DISPATCHES       CAPACITY
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                       INCIDENT
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
     EVIDENCE          TIMELINE           PRIORITY
        │                  │                  │
        ▼                  ▼                  ▼
      AUDIT             STATUS             AI DATA
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
    RESOURCES          HOSPITALS          SURVIVORS
        │
        ▼
  CROSS-AGENCY
    REQUESTS
```

---

## 🔄 Incident State Machine

Consistent status lifecycle for every incident.

```text
REPORTED
    │
    ▼
AI_ANALYZING
    │
    ▼
VERIFIED
    │
    ▼
PRIORITIZED
    │
    ▼
DISPATCHING
    │
    ▼
ASSIGNED
    │
    ▼
EN_ROUTE
    │
    ▼
ON_SCENE
    │
    ▼
TRANSPORTING
    │
    ▼
HOSPITAL_RECEIVED
    │
    ▼
RESOLVED
```

**Alternative states:**

```text
CANCELLED
DUPLICATE
ESCALATED
REASSIGNED
```

---

## 👥 Team Ownership

### 🟦 Team 1 — Intelligence

| Person | Ownership |
|--------|-----------|
| **Person 1** | Citizen · Voice · Family · Survivor · Public Alerts · Media Upload · Citizen Tracking |
| **Person 2** | AI Extraction · Emotion · Severity · Priority · Duplicate Detection · Prediction · Crowd Surge · AI Copilot Backend |

---

### 🟧 Team 2 — Response

| Person | Ownership |
|--------|-----------|
| **Person 3** | Responders · Community Responders · Dispatch · Skills · Certification · Fatigue · Equipment · GPS |
| **Person 4** | Hospitals · ICU · Trauma · Beds · Hospital Matching · Resources · Cross-Agency Requests · Reconciliation |

---

### 🟩 Team 3 — Command

| Person | Ownership |
|--------|-----------|
| **Person 5** | GIS · Live Map · Routes · Tracking · Shelters · Disaster Zones · Heatmaps · Road Blocks |
| **Person 6** | Command Center · Incident Management · Disaster Mode · Simulation · Analytics · AI Copilot UI · Evidence Audit · Audit Logs |

> **Everyone integrates through one shared:** `Express API + PostgreSQL + Socket.IO`

---

## 🔥 Final Architecture Diagram

```text
                              ┌──────────────────────┐
                              │       CITIZEN        │
                              │                      │
                              │ Text / Voice / Media │
                              └──────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │    VUE FRONTEND      │
                              └──────────┬───────────┘
                                         │
                                  REST + SOCKET.IO
                                         │
                                         ▼
                       ┌────────────────────────────────┐
                       │          EXPRESS.JS            │
                       │                                │
                       │     API + Business Logic       │
                       └───────────────┬────────────────┘
                                       │
             ┌─────────────────────────┼────────────────────────┐
             │                         │                        │
             ▼                         ▼                        ▼
   ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
   │  TEAM 1          │     │  TEAM 2          │     │  TEAM 3          │
   │                  │     │                  │     │                  │
   │ AI Intelligence  │     │ Response         │     │ Command          │
   │ Citizen          │     │ Hospitals        │     │ GIS              │
   │ Emotion          │     │ Resources        │     │ Disaster         │
   │ Severity         │     │ Dispatch         │     │ Analytics        │
   │ Prediction       │     │ Community Mesh   │     │ Simulation       │
   └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   INCIDENT ENGINE   │
                          │                     │
                          │ Priority            │
                          │ State Machine       │
                          │ Coordination        │
                          └──────────┬──────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │ POSTGRESQL   │   │ FILE STORAGE │   │ EXTERNAL API │
          │              │   │              │   │              │
          │ Users        │   │ Photos       │   │ Maps         │
          │ Incidents    │   │ Videos       │   │ Weather      │
          │ Responders   │   │ Audio        │   │ Events       │
          │ Hospitals    │   │ Evidence     │   │ AI / Voice   │
          │ Resources    │   │              │   │              │
          │ Audit        │   │              │   │              │
          └──────────────┘   └──────────────┘   └──────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   COMMAND CENTER    │
                          │                     │
                          │ Live Incidents      │
                          │ Live GIS            │
                          │ Responders          │
                          │ Hospitals           │
                          │ Resources           │
                          │ Disaster Mode       │
                          │ AI Copilot          │
                          │ Analytics           │
                          └─────────────────────┘
```

---

## 🔑 Most Important Architectural Rule

**Everything revolves around the `Incident`.**

```text
Citizen Report
      ↓
AI enriches it
      ↓
Priority engine scores it
      ↓
Responders matched
      ↓
Hospital selected
      ↓
Resources coordinated
      ↓
GIS tracks the operation
      ↓
Survivor / Evidence / Audit attaches to incident
      ↓
Command Center monitors everything in real time
```

That gives the project a **single coherent architecture** instead of 40 disconnected features.

---

*ResQNet — Respond Faster. Coordinate Better. Save More Lives.*
