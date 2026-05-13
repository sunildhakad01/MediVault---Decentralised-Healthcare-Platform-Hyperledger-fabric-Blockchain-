# MediVault — Full Project Status & Technical Reference

> Last updated: 2026-04-19  
> Version: 2.0.0 (Post-Audit MVP)  
> Audit fixes applied: Steps 2–10 (see Section 9)

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Infrastructure & Docker Services](#4-infrastructure--docker-services)
5. [Portal Flows](#5-portal-flows)
   - 5a. Patient Portal
   - 5b. Doctor Portal
   - 5c. Hospital Admin Portal
   - 5d. Super Admin Portal
6. [Authentication System](#6-authentication-system)
7. [AI-Vaidya Assistant](#7-ai-vaidya-assistant)
8. [Blockchain Layer (Hyperledger Fabric)](#8-blockchain-layer-hyperledger-fabric)
9. [API Surface (90 Routes)](#9-api-surface-90-routes)
10. [Dev Mode vs Production Mode](#10-dev-mode-vs-production-mode)
11. [Database Models](#11-database-models)
12. [Audit Fix History](#12-audit-fix-history)
13. [Known Gaps & Roadmap](#13-known-gaps--roadmap)

---

## 1. Project Vision

MediVault is a **full-stack, Web3-adjacent healthcare data management platform** built for the *Health in Pixels: Startup Hackathon & Cohort 2025* under the theme **Health IT Systems & Healthcare Data Privacy**.

**Core mission:** Act as a single, trusted health data layer that connects patients, providers, and systems — giving patients full ownership of their records while enabling verified, interoperable care workflows.

**Current stage:** Functional MVP with four working portals, a multi-agent AI assistant, and a Hyperledger Fabric consent/audit backbone.

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 13.4.19 | Full-stack React framework (pages router) |
| React | 18.2.0 | UI rendering |
| Tailwind CSS | 3.3.x | Utility-first styling |
| Axios | 1.7.x | HTTP client |
| TanStack Query | 5.59.x | Server state management |
| React Hot Toast | 2.5.x | Notification toasts |
| React Icons | 5.5.x | Icon library |

### Backend (Production)
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18-alpine | Runtime |
| Express.js | 4.x | REST API server (port 3002) |
| Sequelize ORM | 6.x | PostgreSQL model layer |
| PostgreSQL | 15-alpine | Primary relational database |
| Redis | 7-alpine | Session cache, token store, queues |
| PDFKit | — | Server-side PDF generation (prescriptions) |
| Pinata / IPFS | — | Decentralized profile photo + asset storage |

### AI-Vaidya (AI Assistant)
| Technology | Purpose |
|------------|---------|
| Google Gemini 1.5 Flash | Primary reasoning LLM |
| Groq LLaMA3-8B | Fast intent classification LLM |
| HuggingFace (S-PubMedBert) | Medical embeddings for RAG |
| FAISS | Local vector store for knowledge retrieval |
| RAG Pipeline | WHO guidelines, ICMR protocols, openFDA drug data |

### Blockchain
| Technology | Purpose |
|------------|---------|
| Hyperledger Fabric 2.x | Permissioned blockchain network |
| CouchDB 3.3.3 | Fabric world state (2 instances, one per hospital org) |
| fabric-gateway 1.4.0 | Node.js SDK for chaincode invocation |
| Consent chaincode | Patient consent management on-chain |
| Audit chaincode | Immutable audit trail for data access events |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker Compose | Orchestrates 13 services |
| pgAdmin 4 | PostgreSQL admin UI (port 5050) |
| Dockerfile.frontend | Production Next.js container build |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER  (Next.js 13 — port 3000)                                      │
│                                                                          │
│  Patient Portal    Doctor Portal    Hospital Portal    Admin Portal      │
│  pages/patient/    pages/doctor/    pages/hospital/    pages/admin/      │
│          │                                                               │
│  context/AuthContext.js  ←→  utils/api.js (axios base)                  │
│          │                                                               │
│  DEV MODE: pages/api/**  (Next.js API routes, in-process)               │
│  PROD MODE: NEXT_PUBLIC_API_URL → Express backend (port 3002)           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
    ┌──────▼────────┐           ┌──────────▼──────────┐
    │  DEV STORE    │           │  EXPRESS BACKEND     │
    │  (globalThis) │           │  backend/src/        │
    │               │           │  controllers/        │
    │  devAuthStore │           │  models/ (Sequelize) │
    │  devDataStore │           │  routes/             │
    │  28 namespaces│           │  services/           │
    └───────────────┘           └──────────┬──────────┘
                                           │
                           ┌───────────────┼──────────────┐
                           │               │              │
                    ┌──────▼──┐    ┌───────▼──┐   ┌──────▼──────────┐
                    │PostgreSQL│   │  Redis    │   │  IPFS (Pinata)  │
                    │  :5432  │    │  :6379   │   │  Profile assets │
                    └─────────┘    └──────────┘   └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  BLOCKCHAIN  (Hyperledger Fabric — permissioned)                        │
│                                                                          │
│  Org: Hospital1 MSP  ←→  peer0.hospital1:7051  ←→  CouchDB1:5984       │
│  Org: Hospital2 MSP  ←→  peer0.hospital2:8051  ←→  CouchDB2:5985       │
│  Orderer (Raft):7050                                                     │
│  3x Fabric CAs (hospital1, hospital2, orderer)                          │
│                                                                          │
│  Channels: medivault-consent  |  medivault-audit                        │
│  Chaincode: consent.tar.gz    |  audit.tar.gz                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  AI-VAIDYA  (Multi-agent medical AI)                                    │
│                                                                          │
│  POST /api/ai-vaidya/query                                               │
│       └─→ query_handler.js                                              │
│              └─→ orchestrator (index.js)                                │
│                     ├─→ Groq (intent classification)                    │
│                     ├─→ RAG pipeline (FAISS + HuggingFace embeddings)   │
│                     ├─→ Specialist agent selection                      │
│                     │      clinical_decision / drug_safety /            │
│                     │      document_analysis / monitoring /             │
│                     │      research / general_health                    │
│                     ├─→ Gemini 1.5 Flash (final response generation)    │
│                     ├─→ Portal-specific policy enforcement              │
│                     └─→ Audit log (POST /api/ai-vaidya/audit)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Infrastructure & Docker Services

13 Docker services defined in `docker-compose.yml`:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:15-alpine | 5432 | Primary production database |
| `redis` | redis:7-alpine | 6379 | Session cache & job queue |
| `pgadmin` | dpage/pgadmin4 | 5050 | Database admin UI |
| `couchdb-hospital1` | couchdb:3.3.3 | 5984 | Fabric world state — Hospital1 Org |
| `couchdb-hospital2` | couchdb:3.3.3 | 5985 | Fabric world state — Hospital2 Org |
| `ca-hospital1` | hyperledger/fabric-ca | 7054 | Certificate Authority — Hospital1 MSP |
| `ca-hospital2` | hyperledger/fabric-ca | 7055 | Certificate Authority — Hospital2 MSP |
| `ca-orderer` | hyperledger/fabric-ca | 7056 | Certificate Authority — Orderer MSP |
| `orderer` | hyperledger/fabric-orderer | 7050 | Fabric orderer (block ordering) |
| `peer0.hospital1` | hyperledger/fabric-peer | 7051, 9440 | Endorsing peer + gRPC |
| `peer0.hospital2` | hyperledger/fabric-peer | 8051, 9441 | Endorsing peer + gRPC |
| `api-server` | node:18-alpine (build) | 3002 | Express REST API backend |
| `frontend` | node:18-alpine (build) | 3000 | Next.js frontend |

> **Known gap:** `backend/.env` uses `localhost` for `DATABASE_URL` — must be changed to the service name `postgres` when running inside Docker.

---

## 5. Portal Flows

### 5a. Patient Portal

**Entry point:** `pages/patient/` | **Root component:** `components/patient/PatientDashboard.jsx`

#### Registration & Login Flow
```
1. User fills registration form (name, email, phone, DOB)
2. POST /api/auth/register/initiate  → OTP sent to email/SMS
3. POST /api/auth/register/verify-otp → OTP validated, session unlocked
4. POST /api/auth/register/set-pin   → 6-digit PIN set, account created
5. POST /api/auth/login              → PIN + identifier → JWT + refreshToken
6. Tokens stored in localStorage (mv_token, mv_refresh, mv_user_type, mv_patient_id)
```

#### Dashboard Features
| Feature | Component | Data Flow |
|---------|-----------|-----------|
| Profile summary | `PatientProfile.jsx` | GET/PUT `/patient/profile` |
| Book appointment | `PatientBookAppointment.jsx` | GET `/doctor/search/available` → POST `/patient/appointment` |
| Appointment history | `PatientHistory.jsx` | GET `/patient/appointments` + `/patient/lab-reports` |
| Prescriptions | `PatientPrescriptions.jsx` | GET `/patient/prescriptions` |
| Lab reports | `PatientLabReports.jsx` | GET `/lab/reports/patient/[id]` |
| Medication reminders | `PatientMedicationReminders.jsx` | Full CRUD `/patient/medication-reminders` |
| Invoices & billing | `PatientInvoices.jsx` | GET `/patient/invoices` |
| Notifications | `PatientNotifications.jsx` | GET/PUT `/patient/notifications` |
| Medicines browse | `PatientMedicines.jsx` | GET `/config/specializations` |
| Emergency numbers | `EmergencyNumbers.jsx` | Static data with UI |
| Blockchain profile | `PatientDashboard.jsx` | GET `/contracts/patient/[id]` |
| AI assistant | `AiVaidyaButton.jsx` | POST `/api/ai-vaidya/query` (patient policy) |

#### Logical Flow Summary
1. Patient authenticates via PIN-based JWT
2. Dashboard loads profile + notifications + upcoming appointments in parallel
3. Booking: searches available doctors by specialty/date → selects slot → creates appointment
4. Post-appointment: prescriptions and lab orders appear automatically from doctor workflow
5. Medication reminders can be added manually or seeded from active prescriptions
6. All data access events are optionally anchored to Fabric audit chain

---

### 5b. Doctor Portal

**Entry point:** `pages/doctor/` | **Root component:** `components/doctor/DoctorDashboard.jsx`

#### Registration & Onboarding Flow
```
1. Doctor self-registers via /register or hospital invite
2. POST /api/doctor/register  → creates doctor profile (pending verification)
3. Hospital admin or super admin verifies doctor credentials
4. PUT /api/hospital/[id]/doctors/[did]/verify  OR  PUT /api/admin/doctors/[id]/verify
5. Doctor logs in with PIN (same 3-step PIN auth as patient)
6. Optional: uploads digital signature via DoctorSignaturePad.jsx
```

#### Workflow Features
| Feature | Component | Data Flow |
|---------|-----------|-----------|
| Today's appointments | `DoctorAppointments.jsx` | GET `/doctor/[id]/appointments` |
| Start consultation | `DoctorConsultation.jsx` | GET `/consultation/pre-consult/[id]` → POST `/consultation` |
| Issue prescription | `DoctorPrescribeMedicine.jsx` | POST `/prescriptions` → GET `/prescriptions/[id]/pdf` |
| Order lab tests | `DoctorLabOrders.jsx` | POST `/lab/orders` |
| View lab results | `DoctorLabOrders.jsx` | GET `/lab-orders/patient/[id]` |
| Set availability | `DoctorAvailability.jsx` | GET/PUT `/availability/[id]`, manage leave slots |
| View patient records | `DoctorMedicalRecords.jsx` | Consent-gated via Fabric |
| Manage patients list | `DoctorPatients.jsx` | GET `/doctor/[id]/appointments` (unique patients) |
| Doctor profile | `DoctorProfile.jsx` | GET/PUT `/doctor/[id]`, upload signature |
| Blockchain profile | `DoctorDashboard.jsx` | GET `/contracts/doctor/[id]` |
| AI assistant | `AiVaidyaButton.jsx` | POST `/api/ai-vaidya/query` (doctor policy — clinical detail allowed) |

#### Consultation Flow (Core Workflow)
```
1. Doctor opens appointment → GET /consultation/pre-consult/[apptId]
   (loads patient history, vitals, previous prescriptions)
2. Doctor records diagnosis notes → POST /consultation
3. Optionally issues prescription → POST /prescriptions
   (prescription stored, PDF generated via PDFKit on backend)
4. Optionally orders lab tests → POST /lab/orders
5. Marks appointment complete → PUT /doctor/appointments/[id]/status
6. Patient's dashboard automatically reflects new prescription/lab data
```

---

### 5c. Hospital Admin Portal

**Entry point:** `pages/hospital/` | **Root component:** `components/hospital/HospitalDashboard.jsx`

#### Registration Flow
```
1. Hospital self-registers → POST /api/hospital/register
   (creates hospital record + admin account, pending super-admin verification)
2. Super admin verifies hospital → PUT /api/admin/hospitals/[id]/verify
3. Hospital admin logs in → POST /api/hospital/login (password-based, not PIN)
4. Token stored: mv_token, mv_hospital_id, mv_user_type=hospital
```

#### Sidebar Sections & Functionality
| Section | Components | Key Operations |
|---------|------------|----------------|
| Overview | `HospitalDashboard.jsx` | Live stats: doctors, beds, appointments today |
| Doctors | Doctor management | Register doctors, verify credentials, invite via email, manage status |
| Departments | Department CRUD | Create/edit/delete hospital departments |
| Appointments | Appointment management | View all appointments, update status, walk-in registration |
| Beds | `HospitalBeds.jsx` | Bed occupancy tracking |
| Staff | Staff management | Add/edit non-doctor hospital staff |
| Lab | `HospitalLab.jsx` | Lab order management |
| Billing | `HospitalBilling.jsx` | Invoice and billing management |
| Notifications | Notification center | Send broadcasts, mark read, per-notification actions |
| Profile/Settings | Settings section | Update hospital info, change PIN |
| AI assistant | `AiVaidyaButton.jsx` | POST `/api/ai-vaidya/query` (hospital policy) |

#### Doctor Management Sub-flow
```
1. Invite doctor by email → POST /hospital/[id]/invite-doctor
   (invite token sent via email)
2. Doctor registers using invite link → POST /hospital/[id]/doctors/register
3. Hospital admin verifies → PUT /hospital/[id]/doctors/[did]/verify
4. Doctor appears in verified list, can accept patient appointments
```

---

### 5d. Super Admin Portal

**Entry point:** `pages/admin/` | **Root component:** `components/admin/AdminDashboard.jsx`

#### Authentication Flow
```
1. Admin enters password → POST /admin/login
2. Backend sends 2FA OTP to admin email
3. POST /auth/verify-secondary/initiate → verify → confirm
4. JWT issued with admin role → stored as mv_token + mv_admin_session
5. Logout: POST /admin/auth/logout (revokes both tokens)
```

#### Admin Capabilities
| Section | Component | Operations |
|---------|-----------|------------|
| System stats | `AdminDashboard.jsx` | Total patients, doctors, hospitals, appointments |
| Hospital management | `AdminHospitals.jsx` | List all hospitals, verify/approve new registrations |
| Doctor management | `AdminDoctorsManagement.jsx` | List all doctors, verify credentials globally |
| Announcements | `AdminAnnouncements.jsx` | Create/list system-wide announcements |
| Audit logs | `AdminAuditLogs.jsx` | Full system audit trail (capped at 500 entries in dev) |
| Team management | `AdminTeam.jsx` | Add/edit/remove admin team members |
| Admin profile | `AdminProfile.jsx` | Edit profile, change password, upload photo |
| Analytics | `AdminAnalytics.jsx` | System-wide stats + charts |
| Revenue | `AdminRevenue.jsx` | Revenue by hospital, invoicing analytics |
| Config | `AdminConfig.jsx` | Manage medical specializations + insurance providers |

---

## 6. Authentication System

### Token Architecture
| localStorage Key | Value | Used By |
|-----------------|-------|---------|
| `mv_token` | JWT access token (prod) or hex token (dev) | All API requests (Bearer header) |
| `mv_refresh` | Refresh JWT | Auto-rotation via `/auth/refresh` |
| `mv_user_type` | `patient / doctor / hospital / admin` | Portal routing + API guards |
| `mv_user_id` | Auth user ID | Profile lookups |
| `mv_patient_id` | Patient record ID | Patient-specific routes |
| `mv_doctor_id` | Doctor record ID | Doctor-specific routes |
| `mv_hospital_id` | Hospital record ID | Hospital-specific routes |
| `mv_admin_session` | Admin session fallback key | Admin 2FA session management |

### Auth Strategy by Role
| Role | Method | Extra Factor |
|------|--------|-------------|
| Patient | 6-digit PIN | OTP at registration |
| Doctor | 6-digit PIN | OTP at registration + hospital/admin verification |
| Hospital Admin | Password | None (single factor) |
| Super Admin | Password | 2FA OTP on every login |

### Token Lifecycle
```
Login → Access JWT (15min) + Refresh JWT (7d)
         ↓
Auto-refresh via AuthContext.js (on 401 response)
         ↓
PUT /auth/change-pin or PUT /admin/profile/password → rotate tokens
         ↓
Logout → POST /auth/logout or POST /admin/auth/logout → token revocation
```

---

## 7. AI-Vaidya Assistant

AI-Vaidya is a **multi-agent medical AI assistant** embedded in all four portals. It surfaces as a floating button (`AiVaidyaButton.jsx`) wired into `Layout.jsx`.

### Architecture
```
User query
    │
    ▼
query_handler.js (api/query_handler.js)
    ├── Role extraction from JWT
    ├── Consent check (Fabric consent_cache.js)
    │
    ▼
orchestrator (ai_vaidya/index.js)
    ├── Intent classification → Groq LLaMA3-8B (fast, cheap)
    ├── RAG retrieval → FAISS + HuggingFace S-PubMedBert embeddings
    │   (knowledge base: WHO guidelines, ICMR protocols, openFDA drug data,
    │    immunisation schedule, Indian lab reference ranges)
    │
    ├── Agent selection:
    │   ├── clinical_decision_agent.js   → diagnosis support, treatment options
    │   ├── drug_safety_agent.js         → drug interactions, contraindications
    │   ├── document_analysis_agent.js   → parse uploaded reports/prescriptions
    │   ├── monitoring_agent.js          → vitals trend analysis
    │   ├── research_agent.js            → medical literature queries
    │   └── general_health_agent.js      → lifestyle, wellness, general queries
    │
    ├── Primary response → Gemini 1.5 Flash
    ├── Portal policy enforcement (patient/doctor/hospital/admin)
    │
    ▼
Audit log → POST /api/ai-vaidya/audit
    (query_id, intent, agent, model_version, response_hash,
     confidence, urgency, safety_passed, blocked)
    │
    ├── Dev mode: globalThis.__mvAuditLogs (in-memory, cap 500)
    └── Prod mode: PostgreSQL ai_vaidya_audit_logs table
                  (optionally anchored to Hyperledger Fabric audit channel)
```

### Portal Policies
| Portal | Policy Summary |
|--------|---------------|
| Patient | Empathetic, plain language, always recommends professional consultation, no direct diagnosis |
| Doctor | Full clinical detail allowed, drug dosages, differential diagnosis, clinical decision support |
| Hospital | Operational queries, bed management, staffing, compliance, administrative guidance |
| Admin | System-level insights, policy queries, aggregate statistics, no patient-specific data |

### Feature Flags (`.env.local`)
| Flag | Default | Description |
|------|---------|-------------|
| `AIVAIDYA_ENABLE_RAG` | `true` | Vector retrieval from medical knowledge base |
| `AIVAIDYA_ENABLE_FILE_ANALYSIS` | `true` | Upload and analyze lab reports/images |
| `AIVAIDYA_ENABLE_MONITORING` | `true` | Vitals trend monitoring agent |
| `AIVAIDYA_AUDIT_LOGGING` | `true` | Log all queries to audit table |
| `AIVAIDYA_FABRIC_ANCHOR` | `false` | Anchor audit hashes to Fabric chain |
| `AIVAIDYA_CONSENT_STRICT` | `false` | Deny queries on consent API failure (set `true` in prod) |

---

## 8. Blockchain Layer (Hyperledger Fabric)

### Network Topology
```
medivault-network
├── Organizations
│   ├── Hospital1MSP  (peer0.hospital1:7051, ca-hospital1:7054, CouchDB:5984)
│   └── Hospital2MSP  (peer0.hospital2:8051, ca-hospital2:7055, CouchDB:5985)
├── OrdererMSP        (orderer:7050, ca-orderer:7056)
└── Channels
    ├── medivault-consent  → consent chaincode (consent.tar.gz)
    └── medivault-audit    → audit chaincode   (audit.tar.gz)
```

### Chaincode Functions

**Consent Channel (`consent.tar.gz`)**
- `grantConsent(patientId, requestorId, dataType, expiryMs)` — patient grants time-limited consent
- `revokeConsent(patientId, requestorId, dataType)` — patient revokes consent
- `checkConsent(patientId, requestorId, dataType)` — gate-check before any data access
- `getConsentHistory(patientId)` — full consent audit trail per patient

**Audit Channel (`audit.tar.gz`)**
- `recordAccess(accessorId, patientId, dataType, action, txHash)` — immutable access log
- `getAuditTrail(patientId)` — complete audit history

### Integration Points
```
pages/api/contracts/register-doctor.js    → POST → Fabric: register doctor identity
pages/api/contracts/register-patient.js   → POST → Fabric: register patient identity
pages/api/contracts/doctor/[doctorId].js  → GET  → Fabric: fetch doctor on-chain record
pages/api/contracts/patient/[patientId].js → GET → Fabric: fetch patient on-chain record
ai_vaidya/blockchain/consent_cache.js     → Consent gate (in-memory cache + optional Fabric sync)
ai_vaidya/blockchain/fabric_client.js     → Fabric gateway wrapper (non-fatal in dev)
```

> **Dev mode behavior:** Fabric routes return mock transaction IDs — non-fatal. Network failures do not block portal functionality. Set `AIVAIDYA_FABRIC_ANCHOR=true` and configure cert paths to enable real Fabric anchoring.

---

## 9. API Surface (90 Routes)

### Route Categories

| Category | Route Count | Auth Required |
|----------|-------------|--------------|
| Auth (register/login/OTP/PIN) | 14 | Partial |
| Patient | 15 | Yes (patient) |
| Doctor | 8 | Yes (doctor) |
| Consultation & Availability | 7 | Yes (doctor) |
| Prescriptions & Lab | 6 | Yes (doctor) |
| Hospital | 31 | Yes (hospital) |
| Admin | 16 | Yes (admin) |
| Config | 6 | Yes (admin) |
| Invoices | 3 | Yes |
| Blockchain / Contracts | 4 | Yes |
| AI-Vaidya | 2 | Yes |

> Full route listing with file paths and AUDIT FIX tags is in [MEDIVAULT_GRAPH.md](MEDIVAULT_GRAPH.md) Section 4.

---

## 10. Dev Mode vs Production Mode

### Dev Mode (`npm run dev`, port 3000)
- All API routes are Next.js API routes (`pages/api/**`)
- Data lives in `globalThis` in-memory stores (28 namespaces defined in `lib/devAuthStore.js` + `lib/devDataStore.js`)
- Resets on server restart (expected behavior)
- No database, no Redis, no Docker required
- Fabric routes return mock transaction IDs (non-fatal)
- PDF generation and IPFS upload return stubs

### Production Mode (`NEXT_PUBLIC_API_URL=http://localhost:3002`)
- Frontend proxies all API calls to Express backend (port 3002)
- Express + Sequelize + PostgreSQL handle persistence
- Redis handles sessions, token cache, OTP expiry
- Full PDFKit PDF generation for prescriptions
- Full IPFS/Pinata upload for profile photos
- Hyperledger Fabric live (when `AIVAIDYA_FABRIC_ANCHOR=true`)

### Environment Variables
```env
# Core
NEXT_PUBLIC_API_URL=http://localhost:3002     # omit in dev (uses Next.js routes)
NODE_ENV=production

# Database (Express backend)
DATABASE_URL=postgresql://medivault:password@postgres:5432/medivault
REDIS_URL=redis://redis:6379
JWT_SECRET=<random-256-bit>
JWT_REFRESH_SECRET=<random-256-bit>

# Email (OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_USER=
SMTP_PASS=

# AI-Vaidya
GEMINI_API_KEY=
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
AIVAIDYA_INTERNAL_SECRET=

# Blockchain (optional)
AIVAIDYA_FABRIC_ANCHOR=false
FABRIC_PEER_ENDPOINT=localhost:7051

# Storage
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

---

## 11. Database Models

Defined in `backend/src/models/` (Sequelize + PostgreSQL):

| Model | Key Fields | Relationships |
|-------|-----------|--------------|
| `User` | id, email, phone, passwordHash, pinHash, role, isVerified | hasOne Patient/Doctor/Hospital |
| `Patient` | id, userId, name, dob, bloodGroup, insurance | hasMany Appointment, Prescription, LabReport |
| `Doctor` | id, userId, hospitalId, specialization, licenseNo, isVerified | hasMany Appointment, belongsTo Hospital |
| `Hospital` | id, adminUserId, name, type, address, isVerified | hasMany Doctor, Department, Staff |
| `Appointment` | id, patientId, doctorId, hospitalId, slot, status, type | belongsTo Patient, Doctor |
| `Prescription` | id, appointmentId, doctorId, patientId, medicines[], notes | belongsTo Appointment |
| `LabOrder` | id, appointmentId, doctorId, patientId, tests[], status | belongsTo Appointment |
| `LabReport` | id, labOrderId, patientId, results, uploadedAt | belongsTo LabOrder |
| `Invoice` | id, patientId, hospitalId, amount, status, items[] | belongsTo Patient, Hospital |
| `Notification` | id, userId, type, message, isRead, createdAt | belongsTo User |
| `MedicationReminder` | id, patientId, medicine, dosage, times[], isActive | belongsTo Patient |
| `OTPLog` | id, userId, code, type, expiresAt, usedAt | belongsTo User |
| `LoginHistory` | id, userId, ip, userAgent, success, createdAt | belongsTo User |
| `AdminAuditLog` | id, adminId, action, targetType, targetId, metadata | belongsTo User (admin) |
| `FabricPendingQueue` | id, txType, payload, retries, status | Retry queue for Fabric writes |

---

## 12. Audit Fix History

All bugs were discovered and fixed in a single audit session (Steps 2–10):

| Fix Tag | Files Changed | Issue |
|---------|--------------|-------|
| Step 2 | `backend/src/controllers/auth.controller.js` | Sequelize `.select()` used MongoDB syntax |
| Step 3 | `.env.local` | Port comment said 3002, value was 3000 |
| Step 4 | `components/layout/Layout.jsx` | `AiVaidyaButton` never imported or rendered |
| Step 5 | `pages/api/admin/` (4 files created) | AdminDashboard — stats/hospitals/verify/logout returned 404 |
| Step 6 | `pages/api/hospital/[id]/status.js` | `_app.js` hospital status check 404'd on every page nav |
| Step 7 | `pages/api/hospital/` (14 files created) | HospitalDashboard — notifications/appointments/staff/profile 404'd |
|        | `pages/api/auth/change-pin.js` | Settings PIN change 404'd |
|        | `components/hospital/HospitalDashboard.jsx` | Sidebar used hardcoded `MOCK_HOSPITAL` |
| Step 8 | `pages/api/patient/` (8 files created/updated) | Patient notification/prescription/lab stubs returned empty arrays |
| Step 9 | `components/hospital/HospitalDashboard.jsx` | `MOCK_STATS` hardcoded — now computed from live API data |
| Step 10 | `pages/api/hospital/[id]/doctors/` (3 files) | Doctor management 404 in HospitalDashboard |
|         | `pages/api/doctor/appointments/[id]/status.js` | Doctor appointment status change 404'd |
|         | `pages/api/consultation/` (2 files) | DoctorConsultation pre-consult + save 404'd |
|         | `pages/api/availability/` (4 files) | DoctorAvailability full CRUD 404'd |
|         | `pages/api/prescriptions/` (2 files) | DoctorPrescribeMedicine 404'd |
|         | `pages/api/lab/` + `pages/api/lab-orders/` (3 files) | DoctorLabOrders 404'd |
|         | `pages/api/admin/` (8 files) | Admin team/docs/announcements/audit/profile 404'd |
|         | `pages/api/config/` (4 files) | AdminConfig specializations/insurance 404'd |
|         | `pages/api/invoices/` (3 files) | Revenue analytics 404'd |
|         | `pages/api/user/upload-photo.js` | AdminProfile photo upload 404'd |

---

## 13. Known Gaps & Roadmap

### Current Gaps (Non-blocking)
| Gap | Location | Notes |
|-----|----------|-------|
| Docker `localhost` in DB URL | `backend/.env` | Change `localhost` → `postgres` (Docker service name) for containerized runs |
| PDF stub in dev | `pages/api/prescriptions/[id]/pdf.js` | Returns plain-text; real PDFKit is Express-only |
| IPFS stub in dev | `pages/api/user/upload-photo.js` | Returns placeholder; real Pinata upload is Express-only |
| Fabric non-fatal in dev | `pages/api/contracts/` | Returns mock tx IDs; enable with `AIVAIDYA_FABRIC_ANCHOR=true` |
| Dev store resets on restart | `lib/devAuthStore.js` | Expected; prod uses PostgreSQL/Redis |
| Insurance CRUD incomplete | `pages/api/config/` | PUT/DELETE for insurance providers not yet created |
| Revenue monthly trends | `AdminRevenue.jsx` | Returns empty array — no billing data seeded in dev |

### Planned Roadmap (Cohort Phase)
- [ ] Ethereum L2 deployment (parallel to Fabric layer)
- [ ] ABDM / ABHA national health ID integration
- [ ] Emergency access override protocols (break-glass consent)
- [ ] Advanced AI: post-treatment monitoring, drug interaction alerts
- [ ] The Graph for off-chain blockchain indexing
- [ ] Dedicated inference endpoint for AI-Vaidya (> 500 users/day)
- [ ] Clinical pilot deployment with partner hospitals
- [ ] Privacy-preserving research access (anonymized data export)
- [ ] Mobile app (React Native)
- [ ] HL7 FHIR API compatibility layer
