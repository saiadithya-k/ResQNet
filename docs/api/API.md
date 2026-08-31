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
- `PATCH /api/responders/:id/location` — Live GPS position update
- `POST /api/dispatch` — Dispatch responder to incident (triggers Socket.IO assignment)

## Hospitals (`/api/hospitals`)
- `GET /api/hospitals` — List hospitals, capacity (ICU, Trauma, Beds), and match scores
- `PATCH /api/hospitals/:id/capacity` — Update live bed availability

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
