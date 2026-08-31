# 📖 ResQNet API Reference

All requests and responses use JSON format. Base URL: `/api`

## Authentication (`/api/auth`)
- `POST /api/auth/login` — Log in with email and password
- `POST /api/auth/register` — Register a new account
- `GET /api/auth/me` — Retrieve current user profile

## Incidents (`/api/incidents`)
- `GET /api/incidents` — List all incidents (filters: status, type, severity)
- `GET /api/incidents/:id` — Retrieve incident by ID with full lifecycle timeline
- `POST /api/incidents` — Create new incident (runs AI extraction & prioritization automatically)
- `PATCH /api/incidents/:id/status` — Update incident status and add timeline note

## AI Intelligence (`/api/ai`)
- `POST /api/ai/extract` — Extract incident entities, emotion triage, and severity score
- `POST /api/ai/duplicates` — Spatial-temporal duplicate cluster detector
- `POST /api/ai/copilot` — Natural language operational query interface

## Responders & Dispatch (`/api/responders`, `/api/dispatch`)
- `GET /api/responders` — List active field units, telemetry, and fatigue scores
- `GET /api/responders/:id` — Retrieve individual responder by ID
- `POST /api/responders` — Create a new professional responder profile
- `PATCH /api/responders/:id` — Update general responder details
- `PATCH /api/responders/:id/status` — Operational status lifecycle transition (triggers `responder:status_changed` Socket.IO event)
- `DELETE /api/responders/:id` — Soft-deactivate responder (sets status to `OFF_DUTY`)
- `PATCH /api/responders/:id/location` — Live GPS position update (`latitude: [-90, 90]`, `longitude: [-180, 180]`, updates server `lastLocationTime`, triggers `responder:location_updated` Socket.IO event)
- `GET /api/responders/:id/skills` — Get responder skills collection
- `POST /api/responders/:id/skills` — Add a skill to responder's skill set (`{ "skill": "CPR" }`)
- `PATCH /api/responders/:id/skills` — Replace/update entire skill collection (`{ "skills": ["CPR", "Trauma"] }`)
- `DELETE /api/responders/:id/skills/:skill` — Remove a skill from responder
- `GET /api/responders/:id/certifications` — List all certifications for a responder
- `POST /api/responders/:id/certifications` — Create a certification record (`name`, `issuingOrg`, `certificateNumber`, `issuedDate`, `expiryDate`, `isVerified`)
- `GET /api/responders/:id/certifications/:certificationId` — Retrieve a specific certification by ID
- `PATCH /api/responders/:id/certifications/:certificationId` — Update a certification record
- `DELETE /api/responders/:id/certifications/:certificationId` — Delete a certification record
- `GET /api/responders/:id/equipment` — Get responder equipment inventory
- `POST /api/responders/:id/equipment` — Add an equipment item to responder inventory (`{ "equipment": "Trauma Kit" }`)
- `PATCH /api/responders/:id/equipment` — Replace/update entire equipment collection (`{ "equipment": ["Trauma Kit", "Oxygen"] }`)
- `DELETE /api/responders/:id/equipment/:equipment` — Remove an equipment item from inventory
- `GET /api/responders/:id/fatigue` — Get responder operational fatigue score (0-100), level (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), and contributing factor breakdown (*operational dispatch decision-support indicator, not a medical diagnosis*)
- `POST /api/responders/:id/fatigue/recalculate` — Recalculate operational fatigue score, persist snapshot, and trigger `responder:fatigue_alert` Socket.IO event when entering `HIGH` or `CRITICAL` state
- `POST /api/responders/:id/fatigue` — Record a fatigue snapshot and update current fatigue score
- `GET /api/responders/:id/fatigue/history` — Get historical fatigue record snapshots
- `GET /api/dispatch/:incidentId/matches` — Get ranked responder matches for an incident with explainable score breakdown (*decision-support tool; ETA is estimated via straight-line distance*)
- `POST /api/dispatch/:incidentId/matches` — Get ranked responder matches with optional requirement overrides (`{ "requiredSkills": [...], "requiredEquipment": [...] }`)
- `POST /api/dispatch` — Assign a responder to an incident (`{ "incidentId": "...", "responderId": "..." }`, updates responder status to `DISPATCHED`, updates incident status to `ASSIGNED`, creates timeline record, triggers `responder:status_changed` and `incident:assigned` Socket.IO events)
- `GET /api/dispatch/:id` — Retrieve single dispatch record by ID

## Community Responders Mesh (`/api/community-responders`, `/api/community`)
- `POST /api/community-responders` — Register a community first responder profile (`{ "email": "...", "name": "...", "phone": "..." }`)
- `GET /api/community-responders/:id` — Retrieve community responder profile details
- `PATCH /api/community-responders/:id/availability` — Toggle operational availability (`{ "isAvailable": true/false }`)
- `PATCH /api/community-responders/:id/location` — Update community GPS coordinates (`{ "latitude": 13.08, "longitude": 80.27 }`)
- `GET /api/community-responders/:id/nearby` — Discover nearby safe response tasks filtered by radius and safety constraints, ordered by proximity
- `POST /api/community-responders/:id/accept` — Accept an eligible response task (protected against race-conditions via database transactions)
- `PATCH /api/community-responders/:id/tasks/:taskId/status` — Lifecycle status update (`EN_ROUTE`, `ON_SCENE`, `COMPLETED`, `CANCELLED`)
- `POST /api/community-responders/:id/tasks/:taskId/decline` — Decline/cancel an accepted community task
- `GET /api/community-responders/mesh` — List community responder mesh units

## Hospitals & Capacity (`/api/hospitals`)
- `GET /api/hospitals` — List registered hospitals (supports filtering by `district`, `status`, `isAccepting`)
- `GET /api/hospitals/:id` — Retrieve hospital details by ID
- `POST /api/hospitals` — Register a new hospital (`{ "name": "...", "district": "...", "latitude": 13.08, "longitude": 80.27 }`)
- `PATCH /api/hospitals/:id` — Update hospital metadata, status, or coordinates
- `DELETE /api/hospitals/:id` — Deactivate hospital (sets `isAccepting: false`)
- `GET /api/hospitals/:id/capacity` — Retrieve hospital bed and ICU capacity breakdown with server-derived occupancy and rates
- `PATCH /api/hospitals/:id/capacity` — Update hospital capacity metrics (`totalBeds`, `availableBeds`, `totalIcu`, `availableIcu`, `totalTrauma`, `availableTrauma`, `ventilators`, `operatingRooms`) with strict invariant validation and real-time Socket.IO emission (`hospital:capacity_updated`)
- `GET /api/hospitals/:hospitalId/specialists` — List specialists for a hospital (supports filtering by `specialty` and `status`/`availability`)
- `GET /api/hospitals/:hospitalId/specialists/:specialistId` — Retrieve single specialist details scoped to hospital
- `POST /api/hospitals/:hospitalId/specialists` — Register a medical specialist under a hospital (`{ "name": "...", "specialty": "Cardiology", "status": "AVAILABLE" }`)
- `PATCH /api/hospitals/:hospitalId/specialists/:specialistId` — Update specialist details and availability
- `DELETE /api/hospitals/:hospitalId/specialists/:specialistId` — Deactivate specialist record
- `GET /api/hospitals/match/:incidentId` — Match and rank candidate hospitals for an incident (*read-only deterministic scoring: capacity 30%, ICU 25%, specialty 25%, proximity 20%; does NOT reserve beds or admit patients*)
- `POST /api/hospitals/match/:incidentId` — Match hospitals with requirement overrides (`{ "requiredSpecialty": "...", "requiredBeds": 2, "requiresIcu": true }`)
- `GET /api/hospitals/:hospitalId/patients` — List incoming patients for a hospital (supports `?status=EXPECTED|ARRIVED|CHECKED_IN|ADMITTED|CANCELLED`)
- `GET /api/hospitals/:hospitalId/patients/:patientId` — Retrieve incoming patient details scoped to hospital
- `POST /api/hospitals/:hospitalId/patients` — Register incoming patient intake (`{ "name": "...", "age": 45, "gender": "MALE", "triageSeverity": "HIGH", "etaMinutes": 15 }`)
- `PATCH /api/hospitals/:hospitalId/patients/:patientId` — Update patient operational metadata
- `PATCH /api/hospitals/:hospitalId/patients/:patientId/status` — Transition patient intake lifecycle state (`EXPECTED` -> `ARRIVED` -> `CHECKED_IN` -> `ADMITTED` / `CANCELLED`) with server-authoritative timestamps and Socket.IO emission (`hospital:patient_status_changed`)
- `GET /api/hospitals/:hospitalId/resources` — List emergency resource inventory for a hospital (supports `?category=OXYGEN|BLOOD|VENTILATOR|PPE|MEDICATION` and `?status=AVAILABLE|DEPLOYED`)
- `GET /api/hospitals/:hospitalId/resources/:resourceId` — Retrieve single hospital resource with derived `allocatedQty`
- `POST /api/hospitals/:hospitalId/resources` — Register a hospital emergency resource (`{ "name": "...", "category": "OXYGEN", "quantity": 50, "availableQty": 35 }`)
- `PATCH /api/hospitals/:hospitalId/resources/:resourceId` — Update resource metadata and quantities with invariant validation (`0 <= availableQty <= quantity`)
- `DELETE /api/hospitals/:hospitalId/resources/:resourceId` — Deactivate hospital resource and emit Socket.IO `hospital:resource_updated`
- `GET /api/hospitals/:hospitalId/coordination-requests` — List coordination requests sent and received by a hospital

## Cross-Agency Resource Coordination (`/api/resources`)
- `GET /api/resources/available` — Discover external surplus resources across all hospitals/districts (supports `?category=...`, `?district=...`, `?externalOnly=true&hospitalId=...`)
- `POST /api/resources/coordination-requests` — Create cross-agency resource coordination request (`{ "resourceId": "...", "toHospitalId": "...", "quantity": 10, "notes": "..." }`) and emit `resource:coordination_requested` (*P4-07 does NOT physically mutate source inventory or deduct capacity*)
- `GET /api/resources/coordination-requests/:id` — Retrieve coordination request details with participating hospital authorization scoping
- `PATCH /api/resources/coordination-requests/:id/status` — Transition coordination lifecycle status (`REQUESTED` -> `APPROVED` / `REJECTED` / `CANCELLED`) with source hospital ownership protection and emit `resource:coordination_updated`
- `GET /api/resources` — List all registered resources across the entire network
- `GET /api/resources/transfers` — Operational transfer list
- `POST /api/resources/transfers` — Operational transfer request

> *Note: Cross-agency coordination is P4-07. Physical logistics, shipment, and vehicle tracking belong to P4-08 (Transfers). Final inventory audit belongs to P4-09 (Reconciliation).*

## Resource Transfers & Logistics (`/api/resource-transfers`)
- `GET /api/resource-transfers` — List transfers (supports `?hospitalId=...`, `?status=IN_TRANSIT|DELIVERED|RECEIVED`, `?direction=incoming|outgoing`)
- `GET /api/resource-transfers/:id` — Retrieve transfer details with participating hospital scoping
- `POST /api/resource-transfers/:id/start` — Dispatch approved transfer into transit (`APPROVED` -> `IN_TRANSIT`); atomically deducts source available inventory and emits `resource:transfer_started`
- `POST /api/resource-transfers/:id/deliver` — Mark transit shipment as delivered (`IN_TRANSIT` -> `DELIVERED`) and emit `resource:transfer_updated`
- `POST /api/resource-transfers/:id/receive` — Confirm receipt at destination facility (`DELIVERED` / `IN_TRANSIT` -> `RECEIVED`); atomically credits destination hospital inventory with duplicate receipt protection and emits `resource:transfer_received`
- `PATCH /api/resource-transfers/:id/status` — Status transition dispatcher (`{ "status": "IN_TRANSIT|DELIVERED|RECEIVED|CANCELLED" }`)

## Resource Reconciliation & Inventory Audit (`/api/reconciliation`)
- `GET /api/reconciliation` — List all reconciliation records across the network (supports `?status=...`, `?discrepancyType=MATCH|SHORTAGE|OVERAGE`)
- `GET /api/reconciliation/:id` — Retrieve reconciliation record details with participating hospital authorization scoping
- `POST /api/reconciliation/transfers/:transferId` — Reconcile completed (`RECEIVED`) transfer; calculates deterministic discrepancy (`actualQuantity - expectedQuantity`), detects `MATCH`, `SHORTAGE`, `OVERAGE`, persists record idempotently without mutating historical transfer quantities, and emits `resource:reconciliation_created`
- `PATCH /api/reconciliation/:id/resolve` — Resolve a recorded discrepancy with audit explanation (`{ "reason": "...", "notes": "..." }`) and emit `resource:reconciliation_resolved`
- `GET /api/hospitals/:hospitalId/reconciliations` — List reconciliation records sent and received by a hospital

## Disasters & Simulator (`/api/disasters`)
- `GET /api/disasters/status` — Get active disaster mode status, zones, and shelters
- `POST /api/disasters/toggle` — Activate / stand-down tactical disaster mode
- `POST /api/disasters/simulate` — Algorithmic disaster casualty & asset demand projection

## Evidence & Verification (`/api/evidence`)
- `GET /api/evidence` — List ingested media artifacts
- `POST /api/evidence/verify` — SHA-256 cryptographic tamper verification

## Analytics (`/api/analytics`)
- `GET /api/analytics/stats` — Real-time command KPIs and response time telemetry
- `GET /api/analytics/heatmap` — Incident density coordinates
