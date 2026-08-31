# 🚨 AI-Powered Emergency Intelligence & Disaster Coordination Platform

> **An AI-powered emergency coordination platform that turns citizen reports into prioritized, intelligently dispatched, real-time emergency responses.**

## 📌 Project Overview

The platform is designed as a competition-level **Smart Emergency Response & Disaster Coordination System** connecting:

- Citizens
- Professional responders
- Community responders
- Hospitals
- Dispatchers
- Administrators
- Cross-agency emergency resources

The goal is to build an **actual emergency command system**, not just an emergency-reporting CRUD application.

### Core Lifecycle

```text
Report → Verify → Prioritize → Dispatch → Coordinate → Treat → Resolve → Analyze
```

---

## 🌐 Quick Access URLs & Demo Accounts

### 🔗 Application Gateways

| Portal | URL | Description |
|---|---|---|
| **Public Landing Page** | [http://localhost:5173/](http://localhost:5173/) | Hero page, live status & entry gateways |
| **Citizen Emergency Portal** | [http://localhost:5173/login/citizen](http://localhost:5173/login/citizen) | Citizen registration, Voice SOS & distress reporting |
| **Operations & Command Portal** | [http://localhost:5173/login/operations](http://localhost:5173/login/operations) | Tactical operations, dispatch, hospital & field units |
| **Central Authentication Gateway** | [http://localhost:5173/login](http://localhost:5173/login) | Direct universal role-routing portal |

### 🔑 Demo Accounts (Mobile Number + Password)

> **Default Password for all accounts:** `password123`

| Role | Mobile Number (Username) | Name | Target Dashboard |
|---|---|---|---|
| **🚨 Citizen** | `+91 9876543210` *(or `9876543210`)* | Vignesh Kumar | `/citizen` |
| **🛡️ Admin** | `+91 9876543211` *(or `9876543211`)* | Command Chief Miller | `/admin/command` |
| **📡 Dispatcher** | `+91 9876543212` *(or `9876543212`)* | Dispatcher John Davis | `/admin/command` |
| **🚑 Paramedic (Responder)** | `+91 9876543213` *(or `9876543213`)* | Paramedic Sarah Connor | `/responder` |
| **🧑‍🚒 Community Responder** | `+91 9876543214` *(or `9876543214`)* | Volunteer Alex Rivera | `/community` |
| **🏥 Hospital Staff** | `+91 9876543215` *(or `9876543215`)* | Dr. Robert Chen (Apollo) | `/hospital` |

---

# 🎯 Core Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite |
| Backend | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Real-Time | Socket.IO |
| Maps | Leaflet / Mapbox |
| AI | LLM + ML services |
| Voice | Web Speech API / Whisper |
| Notifications | Web Push / SMS / Email |
| File Storage | S3-compatible storage |
| Authentication | JWT |
| Security | Password hashing, validation, rate limiting |
| Deployment | AWS |

---

# 🏆 ULTIMATE FEATURE SET

## 1. 👤 Multi-Role Identity & Access

### Citizen

- Emergency reporting
- Voice reporting
- Text reporting
- Media upload
- Live incident tracking
- Survivor check-in
- Family safety tracking
- Public alerts
- Emergency history
- Report status

### Professional Responder

- Responder profile
- Skill/certification management
- Availability toggle
- GPS location
- Incident acceptance
- Navigation
- Incident status updates
- Fatigue monitoring
- Equipment tracking
- Shift management

### Community Responder

- CPR/First Aid certifications
- Skill verification
- Availability
- 500m emergency alerts
- Accept/decline assistance
- Safe arrival check-in
- Assistance status

### Hospital

- Bed management
- ICU availability
- Trauma capacity
- Specialist availability
- Ambulance acceptance
- Incoming patient tracking
- Emergency capacity

### Administrator

- Command center
- Incident management
- Resource management
- Disaster mode
- Cross-agency coordination
- Analytics
- Prediction
- Simulation
- Audit

---

# 🧠 2. AI Emergency Intelligence Engine

The platform uses an AI pipeline instead of a single AI feature.

```text
Citizen Input
      ↓
Language Detection
      ↓
Voice → Text
      ↓
Entity Extraction
      ↓
Emotion Analysis
      ↓
Incident Classification
      ↓
Severity Analysis
      ↓
Duplicate Detection
      ↓
Risk Assessment
      ↓
Priority Engine
```

### AI should extract

- Incident type
- Location
- Victim count
- Injuries
- Fire
- Explosion
- Trapped people
- Vulnerable people
- Hazardous materials
- Urgency
- Required resources

---

# ❤️ 3. Emotional Triage AI

When a citizen submits a report, the system performs an emotional urgency analysis separately from actual incident severity.

Example:

```text
Emotion:
PANICKED

Confidence:
94%

Emotional Urgency:
HIGH
```

### Important Design Principle

**Emotion ≠ Severity**

A calm report about a gas leak can still be **CRITICAL**.

The dashboard should display both independently.

---

# 🎙️ 4. Multilingual Voice Emergency

Citizens can report emergencies without typing.

### Supported Languages

- Tamil
- English
- Hindi
- Telugu

### Example

Citizen says:

> "There is a fire near the market and three people are trapped."

AI extracts:

```text
Type: FIRE
Victims: 3
Trapped: YES
Location: Market
```

Then:

```text
Voice
  ↓
Speech-to-Text
  ↓
AI Extraction
  ↓
Structured Emergency
  ↓
Citizen Confirmation
  ↓
Incident Created
```

---

# 🔄 5. Duplicate Emergency Intelligence

If many citizens report the same emergency, the system merges supporting reports instead of overwhelming operators with duplicate incidents.

```text
50 Reports
     ↓
Location similarity
+
Text similarity
+
Time proximity
     ↓
INCIDENT #1042

Reports: 50
Confidence: 97%
```

Store:

```text
duplicateOf
similarityScore
supportingReports
```

---

# 🚦 6. Dynamic Priority Engine

Create a configurable priority score out of 100.

```text
Priority =
Severity
+ Victim Count
+ Vulnerability
+ Hazard
+ Spread Risk
+ Emotional Urgency
+ Response Delay
+ Population Density
+ Resource Availability
```

Example:

```text
CRITICAL
95

HIGH
78

MEDIUM
54

LOW
22
```

The emergency queue automatically reorders based on changing conditions.

---

# 🗺️ 7. Live GIS Command Center

The live map is the centerpiece of the platform.

### Map Layers

- 🔴 Emergencies
- 🚑 Ambulances
- 🚒 Fire units
- 👮 Police
- 🧑‍🚒 Professional responders
- 🧑‍⚕️ Community responders
- 🏥 Hospitals
- 🏠 Shelters
- 🚧 Blocked roads
- 🌊 Flood zones
- 🔥 Hazard zones

Clicking a marker opens the relevant details panel.

---

# 🚑 8. AI Responder Dispatch

The system recommends responders based on:

```text
Distance
+
ETA
+
Skill
+
Equipment
+
Availability
+
Fatigue
+
Current Workload
```

Example:

```text
Recommended Responder: A12

Match Score: 94%

Distance       ✓
Trauma Kit     ✓
Available      ✓
Low Fatigue    ✓
ETA            ✓
```

The system should explain **why** a responder was recommended.

---

# 🧑‍🚒 9. Community Responder Mesh

Certified civilians can provide appropriate first-response assistance until professional responders arrive.

```text
Incident
   ↓
500m Radius
   ↓
Certified Responders
   ↓
Skill Filter
   ↓
Availability Filter
   ↓
Push Notification
```

Example:

> CPR-certified responder found 280m away.

```text
[ACCEPT ASSISTANCE]
```

Community responders do **not** replace professional emergency services.

---

# 🏥 10. Intelligent Hospital Matching

The system does not simply select the nearest hospital.

```text
Hospital Match =
Distance
+
ICU
+
Beds
+
Trauma
+
Specialization
+
Emergency Capacity
+
Current Load
```

Example:

```text
Hospital A
Match: 94%

Hospital B
Match: 83%

Hospital C
Match: 72%
```

---

# 🛏️ 11. Live Hospital Resource Management

Track hospital capacity in real time:

- General beds
- ICU beds
- Trauma beds
- Burn unit
- Ventilators
- Operating rooms
- Blood availability
- Specialists
- Ambulance capacity

Hospital dashboards update live.

---

# 🚦 12. Emergency Route Intelligence

Consider:

- Current route
- Traffic
- Road blocks
- Floods
- Construction
- Incident zones

The system recommends the fastest emergency route and automatically recalculates when conditions change.

Example:

```text
Route A
22 minutes ❌

Route B
11 minutes ✓
```

---

# 📱 13. Citizen Live Responder Tracking

After reporting:

```text
✓ Report received
✓ AI analyzed
✓ Responder assigned
✓ Responder accepted
🚑 En route
🏥 Hospital notified
```

The citizen can see the responder's location and ETA when available.

---

# 📡 14. Real-Time Event Architecture

Use **Socket.IO** for live synchronization.

```text
Citizen
  ↕
Backend
  ↕
Admin
  ↕
Responder
  ↕
Hospital
```

No page refresh should be required for operational updates.

---

# 🚨 15. Disaster Mode

Administrators can activate:

# 🌊 FLOOD DISASTER MODE

The system automatically:

- Defines affected zones
- Prioritizes incidents
- Shows shelters
- Shows hospitals
- Shows ambulances
- Shows blocked roads
- Tracks missing people
- Activates survivor check-in
- Broadcasts alerts
- Detects resource shortages
- Starts inter-agency coordination

---

# 🆘 16. Survivor Check-In

Citizens can report themselves or family members.

```text
MYSELF
FAMILY MEMBER
```

Statuses:

- 🟢 Safe
- 🟠 Injured
- 🔴 Missing

Example:

```text
SAFE       8,201
INJURED      732
MISSING      128
```

---

# 👨‍👩‍👧 17. Family Safety Network

Create private family groups.

Example:

```text
My Family

Father       🟢 SAFE
Mother       🟠 INJURED
Brother      🟢 SAFE
Grandmother  🔴 MISSING
```

Only authorized family members should be able to view appropriate safety information.

---

# 🏛️ 18. Cross-Agency Resource Negotiation

When one district runs out of resources:

```text
District A
Ambulances: 0
       ↓
Resource Request
       ↓
District B / C
```

Example:

```text
REQUEST

Ambulances × 3
Priority: CRITICAL
Reason: Mass casualty
```

Receiving district:

```text
[APPROVE]
[REJECT]
```

Track:

- Request
- Approval
- Dispatch
- ETA
- Receipt
- Return
- Utilization

---

# 🚛 19. Resource Inventory

Track emergency assets.

### Ambulances

- Vehicle
- Type
- Equipment
- Status
- Location

### Fire Units

- Vehicle
- Equipment
- Capacity

### Rescue Equipment

- Boats
- Stretchers
- Oxygen
- Medical kits

Additional resources:

- Medical supplies
- Shelter capacity

---

# 📦 20. Resource Shortage Prediction

The system detects demand/capacity imbalance.

```text
Zone 4

Ambulance demand ↑
Hospital capacity ↓

⚠ Resource shortage predicted
```

Recommendation:

> Move 3 ambulances from Zone 2.

---

# 😴 21. Responder Fatigue Intelligence

Track:

- Duty hours
- Incidents handled
- Critical incidents
- Continuous deployment
- Break time
- Response intensity

Example:

```text
Fatigue Risk: 82%
Risk: HIGH
```

High-fatigue responders can be excluded from unsuitable new critical assignments.

---

# 🎯 22. Skill-Based Dispatch

Responder skills:

```text
CPR
Trauma
Fire Rescue
Flood Rescue
Hazmat
```

Incident:

```text
Chemical Fire
```

The system selects a suitable **Hazmat-certified** responder rather than simply choosing the nearest person.

---

# 🧯 23. Hazard Intelligence

Incident classifications can include:

- Fire
- Gas leak
- Chemical
- Explosion
- Electrical
- Flood
- Structural collapse

Responders receive relevant hazard warnings.

Example:

> ⚠️ Possible hazardous material.

---

# 🔐 24. Evidence Chain of Custody

For every uploaded:

- Photo
- Video
- Audio
- Document

Generate/store:

```text
SHA-256
Timestamp
Uploader
Incident ID
```

Audit lifecycle:

```text
Uploaded
   ↓
Accessed
   ↓
Transferred
   ↓
Verified
```

---

# 🧾 25. Tamper-Evidence Verification

Operators can verify evidence integrity.

```text
Stored Hash
     =
Current Hash

✓ INTEGRITY VERIFIED
```

The system should describe this as **tamper-evidence/integrity verification**, supported by hashing and audit logs.

---

# 🌡️ 26. Crowd Surge Prediction

Combine:

```text
Events
+
Weather
+
Historical Incidents
+
Population Density
```

Example:

```text
50,000-person event
+
39°C
+
High humidity

↓

HIGH CROWD RISK
```

Recommendation:

```text
+4 Ambulances
+1 Fire Unit
+20 Hospital Beds
```

---

# 🌦️ 27. Weather Risk Engine

Monitor:

- Extreme heat
- Heavy rain
- Flooding
- Cyclone conditions
- Lightning
- Storms

Pipeline:

```text
Weather Risk
      ↓
Zone Risk
      ↓
Resource Recommendation
```

---

# 🔮 28. Emergency Prediction

Use:

```text
Time
Weather
Location
Incident Frequency
Population
Events
```

Predict emergency probability for a specific zone/time.

Example:

```text
Zone 4
Emergency Probability: HIGH
```

---

# 🧪 29. Disaster Simulator

Administrators can run what-if scenarios.

```text
SIMULATE DISASTER

Type:
Flood

Population:
100,000

Severity:
HIGH
```

Output:

```text
Expected Incidents: 147
Ambulances Needed: 23
ICU Beds Needed: 17
Shelters Needed: 4
Responders Needed: 62
```

Also identify resource gaps.

Example:

> Current resources are insufficient by 18%.

---

# 🤖 30. AI Emergency Command Copilot

Administrators can ask natural-language operational questions:

> "What requires immediate attention?"

> "Which hospitals can take trauma patients?"

> "Where are ambulance shortages?"

The AI must query **actual PostgreSQL/backend data** and must not invent operational information.

---

# 📊 31. Real-Time Command Analytics

Display:

- Active emergencies
- Critical emergencies
- Available responders
- Available ambulances
- Hospital capacity
- Average response time
- Average dispatch time
- People rescued

---

# ⏱️ 32. Full Incident Timeline

Every incident gets an operational timeline.

```text
10:31 Reported
10:31 AI analyzed
10:31 Admin notified
10:32 Responder dispatched
10:36 Responder arrived
10:41 Transported
10:52 Hospital received
11:10 Resolved
```

Calculate:

- Detection time
- Dispatch time
- Arrival time
- Transport time
- Resolution time

---

# 📈 33. Responder Performance Analytics

Track:

```text
Average ETA
Incidents handled
Critical incidents
Acceptance rate
Response success
Fatigue exposure
```

---

# 📈 34. Hospital Performance Analytics

Track:

```text
Patients received
Average admission time
Bed utilization
ICU utilization
Emergency capacity
Transfer rate
```

---

# 🗺️ 35. Emergency Heatmaps

Display historical incidents geographically.

```text
Incident Density
      ↓
   Heatmap
      ↓
High-risk Areas
```

Use this to identify emergency hotspots.

---

# 📢 36. Public Alert System

Administrators can broadcast location-targeted alerts.

Example:

> ⚠️ FLOOD WARNING

Delivery:

- Push notification
- Web notification
- Emergency banner

---

# 🏠 37. Shelter Management

Track:

- Capacity
- Current occupancy
- Food
- Water
- Medical support
- Accessibility

Recommend the nearest suitable shelter.

---

# ♿ 38. Vulnerable Population Intelligence

Priority factors can include:

- Children
- Elderly
- Disabled people
- Pregnant people
- Multiple victims

This should be **one prioritization factor**, not a replacement for actual medical severity.

---

# 🔔 39. Smart Notification Engine

Different roles receive different alerts.

### Citizen

> Responder arriving.

### Responder

> New critical incident.

### Hospital

> Incoming trauma patient.

### Admin

> District resource shortage.

### Community Responder

> Emergency within 500m.

---

# 🔑 40. RBAC + Security

Roles:

```text
Citizen
Responder
Community Responder
Hospital Staff
Dispatcher
Admin
Super Admin
```

Implement:

- JWT authentication
- Password hashing
- Role-based permissions
- Input validation
- Rate limiting
- File validation
- Secure API endpoints
- Audit logs

---

# 🧱 FINAL MODULE STRUCTURE

The entire platform is divided into 10 major modules:

```text
1. AUTH & IDENTITY
        ↓
2. CITIZEN EMERGENCY INTAKE
        ↓
3. AI INTELLIGENCE ENGINE
        ↓
4. INCIDENT & PRIORITY ENGINE
        ↓
5. RESPONDER / COMMUNITY MESH
        ↓
6. HOSPITAL & RESOURCE ENGINE
        ↓
7. GIS / ROUTING / LIVE TRACKING
        ↓
8. DISASTER & PREDICTION ENGINE
        ↓
9. COMMAND CENTER
        ↓
10. ANALYTICS / AUDIT / REPORTING
```

---

# 👥 6-MEMBER / 3-TEAM WORK SPLIT

The six members are divided into three teams of two.

| Team | Member 1 | Member 2 | Main Responsibility |
|---|---|---|---|
| **Team 1 — Intelligence & Citizen** | Person 1 | Person 2 | Citizen platform + AI emergency intelligence |
| **Team 2 — Response & Resources** | Person 3 | Person 4 | Responders + hospitals + resources + dispatch |
| **Team 3 — Command & Disaster** | Person 5 | Person 6 | GIS + command center + disaster intelligence |

> **Important:** Do not divide the work as "one frontend developer + one backend developer." Each pair owns a functional subsystem end-to-end.

---

# 🟦 TEAM 1 — CITIZEN + AI INTELLIGENCE

## Team Goal

Turn citizen **text/voice/media** into a structured, intelligent emergency incident.

```text
Citizen
   ↓
Voice / Text / Media
   ↓
AI Processing
   ↓
Emotion + Severity
   ↓
Duplicate Detection
   ↓
Priority
   ↓
Emergency Created
```

---

## 👤 PERSON 1 — CITIZEN PLATFORM

### Authentication

Build:

- Citizen registration
- Login
- Logout
- JWT authentication
- Password hashing
- Profile
- Emergency contacts

Roles supported across the platform:

```text
CITIZEN
RESPONDER
COMMUNITY_RESPONDER
HOSPITAL
ADMIN
```

### Citizen Dashboard

```text
Citizen Home
├── Report Emergency
├── My Active Emergencies
├── Emergency History
├── Family Safety
├── Public Alerts
└── Profile
```

### Emergency Reporting

Fields:

```text
Incident Type
Description
Location
Victim Count
Vulnerable People
Injury Information
Additional Notes
```

Media:

- Photo
- Video
- Audio

### Voice-to-Report

```text
🎙️ Speak Emergency
       ↓
Speech → Text
       ↓
AI
       ↓
Structured Emergency
```

### Citizen Live Tracking

```text
Report Received
      ↓
Verified
      ↓
Responder Assigned
      ↓
Responder En Route
      ↓
Arrived
      ↓
Hospital
      ↓
Resolved
```

### Family Safety

```text
My Family

Father       SAFE
Mother       INJURED
Brother      MISSING
```

### Public Emergency Alerts

Show warnings based on affected location.

### Person 1 Deliverables

```text
✓ Auth UI
✓ Citizen dashboard
✓ Emergency reporting
✓ Voice input
✓ Media upload
✓ Citizen tracking
✓ Family safety
✓ Survivor check-in UI
✓ Public alerts
```

---

# 🧠 PERSON 2 — AI + INCIDENT INTELLIGENCE

Person 2 owns the **brain of the system**.

### AI Emergency Extraction

Input:

```text
"Please help! Our building collapsed.
There are 8 people trapped."
```

Output:

```json
{
  "incidentType": "BUILDING_COLLAPSE",
  "victimCount": 8,
  "trapped": true,
  "fire": false,
  "severity": "CRITICAL"
}
```

### Emotional Triage

```text
emotion_state
emotion_score
emotional_urgency
```

Example:

```text
Emotion: PANICKED
Score: 94%
Urgency: HIGH
```

### Severity Engine

```text
Severity =
victims
+
injuries
+
fire
+
explosion
+
trapped
+
hazard
+
spread risk
```

### Dynamic Priority

```text
Priority =
Severity
+ Victim Count
+ Vulnerability
+ Hazard
+ Spread Risk
+ Emotional Urgency
+ Response Delay
```

### Duplicate Detection

Compare:

```text
Location
Time
Description
Incident Type
```

Store:

```text
duplicateOf
similarityScore
supportingReports
```

### AI Emergency Copilot Backend

APIs for questions such as:

- What are the critical incidents?
- Which hospitals can take trauma patients?
- Where are ambulance shortages?

The AI must use actual backend data.

### Emergency Prediction

Use:

```text
Historical incidents
+
Weather
+
Time
+
Location
+
Events
```

### Crowd Surge Detection

Use:

```text
Events
+
Weather
+
Population
+
Historical incidents
```

### Person 2 Deliverables

```text
✓ AI extraction
✓ Emotion AI
✓ Severity model
✓ Priority engine
✓ Duplicate detection
✓ AI Copilot backend
✓ Emergency prediction
✓ Crowd surge prediction
✓ Resource demand prediction
```

---

# 🟧 TEAM 2 — RESPONSE + RESOURCE COORDINATION

## Team Goal

Own everything that happens **after an emergency exists**.

```text
Incident
   ↓
Find Responder
   ↓
Dispatch
   ↓
Route
   ↓
Hospital
   ↓
Treatment
```

---

# 🚑 PERSON 3 — RESPONDER + DISPATCH

### Professional Responder

```text
Name
Role
Skills
Certification
Vehicle
Equipment
Location
Availability
```

### Responder Dashboard

```text
Responder Dashboard

Status: 🟢 AVAILABLE

Current Assignment:
Incident #1042

Distance:
1.4 km

ETA:
5 min

[ACCEPT]
[REJECT]
```

### Responder Location

Track:

```text
latitude
longitude
status
lastUpdated
```

Send live updates using Socket.IO.

### Smart Dispatch

```text
Incident
   ↓
Available Responders
   ↓
Skill Filtering
   ↓
Equipment Filtering
   ↓
Fatigue Filtering
   ↓
Distance
   ↓
ETA
   ↓
Best Responder
```

### Community Responder Mesh

```text
Community Responder
├── Certification
├── Skills
├── Location
├── Availability
└── Verification
```

Emergency flow:

```text
Incident
   ↓
500m Radius
   ↓
Certified Responders
   ↓
Push Notification
```

### Responder Fatigue

Track:

```text
Duty hours
Critical incidents
Total incidents
Break duration
Response intensity
```

### Equipment

Track:

```text
Ambulance
Trauma Kit
Oxygen
CPR Equipment
Rescue Equipment
```

### Person 3 Deliverables

```text
✓ Responder registration
✓ Responder dashboard
✓ GPS tracking
✓ Smart dispatch
✓ Community responder mesh
✓ Certification
✓ Fatigue system
✓ Equipment
✓ Responder status
```

---

# 🏥 PERSON 4 — HOSPITAL + RESOURCE NETWORK

### Hospital Dashboard

```text
Hospital

Beds        23/50
ICU          4/10
Trauma       6/10
Ventilator   7/12
OT           2/4

Status: 🟢 ACCEPTING
```

### Real-Time Capacity

Update:

```text
beds
ICU
trauma
ventilators
OT
specialists
```

Broadcast changes with Socket.IO.

### Smart Hospital Matching

```text
Distance
+
ICU
+
Trauma
+
Beds
+
Specialization
+
Capacity
```

### Incoming Patient Management

```text
🚑 INCOMING PATIENT

Incident #1042

Condition:
Critical Trauma

ETA:
8 minutes

Required:
ICU
```

Hospital can:

```text
ACCEPT
REDIRECT
```

### Cross-Agency Resource Negotiation

```text
District A
   ↓
Resource Request
   ↓
District B / C
```

Track:

- Request
- Approval
- Dispatch
- ETA
- Receipt
- Return
- Utilization

### Resource Inventory

Track:

- Ambulances
- Fire Units
- Boats
- Rescue Kits
- Medical Supplies
- Oxygen
- Shelter Capacity

### Resource Movement

```text
Requested
Approved
Dispatched
In Transit
Received
Deployed
Returned
```

### Post-Disaster Reconciliation

```text
District B

Resources Loaned:
3 ambulances

Deployment:
7h 42m

Incidents:
18

Returned:
3

Status:
COMPLETE
```

### Person 4 Deliverables

```text
✓ Hospital dashboard
✓ Hospital capacity
✓ ICU/trauma management
✓ Smart hospital matching
✓ Incoming patient system
✓ Resource inventory
✓ Cross-agency requests
✓ Resource transfer
✓ Reconciliation
```

---

# 🟩 TEAM 3 — COMMAND CENTER + DISASTER INTELLIGENCE

This is the **judge-facing team**.

---

# 🗺️ PERSON 5 — GIS + LIVE OPERATIONS

### Live Emergency Map

```text
🔴 Emergencies
🚑 Ambulances
🚒 Fire
👮 Police
🧑‍🚒 Responders
🧑‍⚕️ Community Responders
🏥 Hospitals
🏠 Shelters
🚧 Blocked Roads
🌊 Flood Zones
```

### Incident Details

```text
INCIDENT #1042

Building Collapse
CRITICAL

Victims: 8
Priority: 96

Emotion:
PANICKED

Nearest Responder:
1.4 km

Nearest Hospital:
3.2 km

[DISPATCH]
```

### Live Responder Tracking

Show responder movement toward the incident.

### Route Optimization

```text
Route A
22 minutes ❌

Route B
11 minutes ✓
```

Recalculate when:

- Road blocked
- Flood detected
- Traffic changes

### Disaster Zones

```text
Safe Zone
Warning Zone
Evacuation Zone
Danger Zone
```

### Shelter Map

```text
🏠 Shelter A
Capacity: 82%

🏠 Shelter B
Capacity: 42%
```

### Heatmaps

```text
Incident Density
↓
Heatmap
↓
High-risk Areas
```

### Person 5 Deliverables

```text
✓ GIS map
✓ Incident markers
✓ Responder tracking
✓ Hospital markers
✓ Shelter map
✓ Route optimization
✓ Road blocks
✓ Disaster zones
✓ Heatmaps
✓ Live map updates
```

---

# 🖥️ PERSON 6 — COMMAND CENTER + DISASTER MANAGEMENT

### Emergency Command Center

```text
🚨 EMERGENCY COMMAND CENTER

ACTIVE       CRITICAL      RESPONDERS
  27            6             84

HOSPITALS    AMBULANCES     AVG ETA
  12            31             7m

LIVE MAP

CRITICAL INCIDENTS

🔴 Building Collapse      96
🔴 Industrial Fire        94
🔴 Flood Rescue           91
```

### Incident Management

Admin can:

- Verify
- Escalate
- Dispatch
- Reassign
- Resolve
- Cancel
- Merge duplicates

### Disaster Mode

```text
🚨 ACTIVATE DISASTER MODE
```

Show:

```text
Affected Zones
Missing Persons
Shelters
Resource Shortages
Hospitals
Responders
Evacuations
Public Alerts
```

### Disaster Simulation

```text
SIMULATE DISASTER

Type:
Flood

Population:
100,000

Severity:
HIGH
```

Output:

```text
Expected Incidents: 147
Ambulances: 23
ICU Beds: 17
Responders: 62
Shelters: 4
```

### AI Command Copilot UI

```text
┌───────────────────────────┐
│ Emergency Copilot         │
├───────────────────────────┤
│ Ask anything...           │
│                           │
│ > Which incidents need    │
│   immediate attention?    │
│                           │
│ AI: 3 critical incidents  │
│ require intervention...   │
└───────────────────────────┘
```

Backend is provided by Person 2.

### Incident Timeline

```text
10:31 Reported
10:31 AI analyzed
10:31 Admin notified
10:32 Responder dispatched
10:36 Responder arrived
10:41 Transported
10:52 Hospital received
11:10 Resolved
```

### Analytics

Charts:

- Average response time
- Emergency volume
- Incident types
- Responder performance
- Hospital utilization
- Resource utilization
- Critical incidents
- Resolution time

### Evidence Verification

```text
Evidence #EV-1092

SHA-256

Stored:
9e107d9...

Current:
9e107d9...

✓ INTEGRITY VERIFIED
```

### Audit Logs

Track:

```text
Who
What
When
Where
Action
```

### Person 6 Deliverables

```text
✓ Command center
✓ Incident management
✓ Disaster Mode
✓ Disaster simulation
✓ AI Copilot UI
✓ Analytics
✓ Incident timeline
✓ Evidence audit
✓ Audit logs
✓ Admin management
```

---

# 🔗 TEAM INTEGRATION

Do **not** let the three teams build separate applications.

Use one shared architecture and shared contracts.

## PostgreSQL Tables

```text
users
roles
citizens
responders
community_responders
certifications
hospitals
hospital_resources
incidents
incident_reports
incident_evidence
incident_events
dispatches
routes
survivor_checkins
family_members
resources
resource_requests
resource_transfers
disaster_zones
shelters
alerts
notifications
fatigue_records
audit_logs
predictions
```

---

# 🔌 EXPRESS API STRUCTURE

```text
/api/auth
/api/citizens
/api/incidents
/api/ai
/api/responders
/api/community-responders
/api/hospitals
/api/resources
/api/dispatch
/api/routes
/api/survivors
/api/disasters
/api/predictions
/api/alerts
/api/analytics
/api/evidence
/api/audit
```

---

# ⚡ SOCKET.IO EVENT CONTRACT

All teams use the same real-time event names.

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

# 🧩 TEAM OWNERSHIP

```text
                 ┌─────────────────────┐
                 │      TEAM 1         │
                 │ CITIZEN + AI        │
                 │                     │
                 │ Person 1            │
                 │ Citizen             │
                 │                     │
                 │ Person 2            │
                 │ AI Intelligence     │
                 └──────────┬──────────┘
                            │
                            ▼
                     INCIDENT ENGINE
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
      ┌──────────────┐              ┌──────────────┐
      │   TEAM 2     │              │   TEAM 3     │
      │ RESPONSE     │              │ COMMAND      │
      │              │              │              │
      │ Person 3     │              │ Person 5     │
      │ Responders   │              │ GIS          │
      │ Dispatch     │              │              │
      │              │              │ Person 6     │
      │ Person 4     │              │ Command      │
      │ Hospitals    │              │ Disaster     │
      │ Resources    │              │ Analytics     │
      └──────────────┘              └──────────────┘
```

---

# 🔄 SHARED INCIDENT LIFECYCLE

```text
Citizen
   ↓
Text / Voice / Media
   ↓
AI Intake
   ├── Language
   ├── Extraction
   ├── Emotion
   ├── Severity
   └── Duplicate Detection
   ↓
Priority Engine
   ↓
Responder / Hospital / Resource Engine
   ↓
Dispatch
   ↓
Route Optimization
   ↓
Live Response
   ↓
Hospital
   ↓
Survivor / Family Updates
   ↓
Evidence & Audit
   ↓
Incident Resolution
   ↓
Analytics
   ↓
Prediction & Disaster Preparedness
```

---

# 🏆 END-TO-END DEMO FLOW

The demo should show all three teams working on the same emergency.

## 1️⃣ Citizen — Person 1

Citizen speaks in Tamil:

> "Building collapsed. Five people are trapped."

---

## 2️⃣ AI — Person 2

```text
Language: Tamil
Emotion: PANICKED
Severity: CRITICAL
Victims: 5
Priority: 94
```

---

## 3️⃣ GIS — Person 5

Live map immediately displays:

```text
🔴 Incident #1042
```

---

## 4️⃣ Responder — Person 3

System finds:

```text
Community responder: 280m
Ambulance: 1.4km
```

Community responder receives an alert.

Ambulance A12 is recommended.

---

## 5️⃣ Hospital — Person 4

```text
Hospital A
ICU: Available
Trauma: Available

Match: 94%
```

Hospital receives:

> 🚑 Incoming critical patient.

---

## 6️⃣ Route — Person 5

```text
Normal: 22 min
Emergency route: 11 min
```

---

## 7️⃣ Command Center — Person 6

```text
🚨 CRITICAL INCIDENT

Priority: 94
Emotion: PANICKED
Responder: A12
Hospital: City General
ETA: 11 min

Community responder:
ON SCENE
```

---

## 8️⃣ Resource Shortage

District A has no ambulances.

Person 4's resource engine detects:

```text
Resource shortage detected

District B
3 ambulances available

[REQUEST]
```

District B approves.

---

## 9️⃣ Survivor Check-In — Person 1

Family members report:

```text
Father → SAFE
Mother → MISSING
```

---

## 🔟 Command Center — Person 6

Dashboard updates:

```text
SAFE: 124
INJURED: 32
MISSING: 11
```

---

## 1️⃣1️⃣ Evidence

Citizen uploads a video.

```text
SHA-256
↓
Stored
↓
Verified
```

---

## 1️⃣2️⃣ Resolution

```text
INCIDENT RESOLVED

Detection: 6 sec
Dispatch: 21 sec
Arrival: 4m 42s
Hospital: 8m 51s

People rescued: 7
Community responder contribution: YES
Inter-district resources: 2
Evidence: VERIFIED
```

---

# 🥇 FINAL PRODUCT POSITIONING

This project is not simply:

> **Smart Emergency Response System**

It is:

# 🚨 AI-POWERED EMERGENCY INTELLIGENCE & DISASTER COORDINATION PLATFORM

### Core differentiators

- 🎙️ Multilingual emergency voice reporting
- 🧠 AI severity intelligence
- ❤️ Emotional triage
- 🔄 Duplicate incident intelligence
- 🚦 Dynamic priority scoring
- 🧑‍🚒 Community responder mesh
- 🚑 AI responder dispatch
- 😴 Responder fatigue intelligence
- 🏥 Intelligent hospital matching
- 🏛️ Cross-agency resource negotiation
- 🗺️ Live GIS operations
- 🚦 Emergency route optimization
- 🆘 Survivor/family safety network
- 🔐 Evidence integrity verification
- 🌡️ Crowd surge prediction
- 🌦️ Weather risk intelligence
- 🔮 Emergency prediction
- 🧪 Disaster simulation
- 🚨 Disaster Mode
- 🤖 AI Command Copilot
- 📊 Real-time operational analytics
- 🧾 Full incident audit timeline

---

# 👥 FINAL 6-PERSON STRUCTURE

## TEAM 1 — INTELLIGENCE

**Person 1:** Citizen / Voice / Family / Survivor  
**Person 2:** AI / Emotion / Severity / Duplicate / Prediction

## TEAM 2 — RESPONSE

**Person 3:** Responders / Community Mesh / Dispatch / Fatigue  
**Person 4:** Hospitals / Resources / Cross-Agency

## TEAM 3 — COMMAND

**Person 5:** GIS / Routing / Tracking / Maps  
**Person 6:** Command Center / Disaster / Simulation / Analytics

All three teams connect through:

```text
Incident Engine
+
PostgreSQL
+
Express.js
+
Socket.IO
```

---

# 🚀 DEVELOPMENT PRINCIPLE

Each team owns a complete functional subsystem, but all teams must follow the same:

- Database schema
- API conventions
- Authentication/RBAC
- Socket.IO event contract
- Incident status model
- Error-handling conventions
- Git branching conventions

The objective is to deliver **one integrated emergency operations platform**, not three independent applications.

---

## 🏆 ONE-LINE PITCH

> **"An AI-powered emergency coordination platform that transforms citizen reports into prioritized, intelligently dispatched, real-time emergency responses while predicting risks and coordinating resources before disasters escalate."**
