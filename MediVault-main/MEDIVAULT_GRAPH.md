# MEDIVAULT SYSTEM GRAPH
> Living map generated after full audit. Last updated: 2026-04-15.
> All fixes tagged AUDIT FIX [Step N] in source files.

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND  (Next.js 13 — port 3000)                                     │
│  pages/  components/  utils/api.js  context/AuthContext.js              │
│          ↓ NEXT_PUBLIC_API_URL (dev=3000, prod=3002)                    │
├─────────────────────────┬───────────────────────────────────────────────┤
│  DEV MODE               │  PROD MODE                                    │
│  pages/api/**           │  backend/src/  (Express + Sequelize)          │
│  lib/devAuthStore.js    │  backend/src/controllers/                     │
│  lib/devDataStore.js    │  PostgreSQL (Docker: postgres:5432)            │
│  (globalThis in-memory) │  Redis (Docker: redis:6379)                   │
├─────────────────────────┴───────────────────────────────────────────────┤
│  BLOCKCHAIN  (Hyperledger Fabric)                                       │
│  2x CouchDB, 2x Fabric Peers, Orderer, 3x Fabric CAs                   │
│  Consent + Audit trail (fabric-gateway 1.4.0)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DOCKER SERVICES (docker-compose.yml — 13 services)

| Service           | Image                   | Port(s)         | Purpose                   |
|-------------------|-------------------------|-----------------|---------------------------|
| postgres          | postgres:15-alpine      | 5432            | Primary DB (prod)         |
| redis             | redis:7-alpine          | 6379            | Session cache / queue     |
| pgadmin           | dpage/pgadmin4          | 5050            | DB admin UI               |
| couchdb-hospital1 | couchdb:3.3.3           | 5984            | Fabric world state H1     |
| couchdb-hospital2 | couchdb:3.3.3           | 5985            | Fabric world state H2     |
| ca-hospital1      | hyperledger/fabric-ca   | 7054            | CA for hospital1 MSP      |
| ca-hospital2      | hyperledger/fabric-ca   | 7055            | CA for hospital2 MSP      |
| ca-orderer        | hyperledger/fabric-ca   | 7056            | CA for orderer MSP        |
| orderer           | hyperledger/fabric-orderer | 7050         | Fabric orderer            |
| peer0.hospital1   | hyperledger/fabric-peer | 7051, 9440      | Peer + gRPC               |
| peer0.hospital2   | hyperledger/fabric-peer | 8051, 9441      | Peer + gRPC               |
| api-server        | node:18-alpine (build)  | 3002            | Express REST backend      |
| frontend          | node:18-alpine (build)  | 3000            | Next.js frontend          |

> ⚠️  KNOWN ISSUE: `backend/.env` has `DATABASE_URL=postgresql://...@localhost:5432` — needs `postgres` (service name) when running inside Docker.

---

## 3. AUTH FLOWS

### 3a. Patient / Doctor — PIN-based (3-step registration)
```
POST /auth/register/initiate   → creates session, sends OTP
POST /auth/register/verify-otp → verifies OTP, unlocks set-pin step
POST /auth/register/set-pin    → creates account, issues tokens
POST /auth/login               → PIN login → { token, refreshToken }
POST /auth/refresh             → token rotation
POST /auth/logout              → revoke token
PUT  /auth/change-pin          → change PIN  [AUDIT FIX Step 7]
POST /auth/forgot-pin/initiate → send forgot-PIN OTP
POST /auth/forgot-pin/verify-otp
POST /auth/forgot-pin/reset
```

### 3b. Hospital Admin — password-based
```
POST /hospital/register        → creates hospital + admin account
POST /hospital/login           → password login → { token }
```

### 3c. Admin — password + 2FA OTP
```
POST /admin/login              → password → triggers OTP (Express backend)
POST /auth/verify-secondary/initiate
POST /auth/verify-secondary/verify
POST /auth/verify-secondary/confirm
POST /admin/auth/logout        [AUDIT FIX Step 5]
```

### Token Storage (localStorage)
| Key               | Contents                          |
|-------------------|-----------------------------------|
| mv_token          | Access JWT / dev hex token        |
| mv_refresh        | Refresh token                     |
| mv_user_type      | patient / doctor / hospital / admin |
| mv_user_id        | Auth user ID                      |
| mv_hospital_id    | Hospital admin's hospitalId       |
| mv_patient_id     | Patient's patientId               |
| mv_doctor_id      | Doctor's doctorId                 |
| mv_admin_session  | Admin session fallback key        |

---

## 4. NEXT.JS API ROUTES (Dev mode — all 90 routes)

### Auth
```
POST   /api/auth/register/initiate
POST   /api/auth/register/verify-otp
POST   /api/auth/register/set-pin
POST   /api/auth/login
GET    /api/auth/verify
POST   /api/auth/refresh
POST   /api/auth/logout
PUT    /api/auth/change-pin                              [AUDIT FIX Step 7]
POST   /api/auth/forgot-pin/initiate
POST   /api/auth/forgot-pin/verify-otp
POST   /api/auth/forgot-pin/reset
POST   /api/auth/verify-secondary/initiate
POST   /api/auth/verify-secondary/verify
POST   /api/auth/verify-secondary/confirm
```

### Patient
```
POST   /api/patient/register
GET    /api/patient/profile
PUT    /api/patient/profile
GET    /api/patient/[patientId]/profile
GET    /api/patient/appointments
POST   /api/patient/appointment
GET    /api/patient/notifications                        [AUDIT FIX Step 8]
PUT    /api/patient/notifications/read-all              [AUDIT FIX Step 8]
GET    /api/patient/prescriptions                       [AUDIT FIX Step 8]
GET    /api/patient/lab-reports                         [AUDIT FIX Step 8]
GET    /api/patient/invoices                            [AUDIT FIX Step 8]
GET    /api/patient/medication-reminders                [AUDIT FIX Step 8]
POST   /api/patient/medication-reminders                [AUDIT FIX Step 8]
PUT    /api/patient/medication-reminders/[id]/toggle    [AUDIT FIX Step 8]
DELETE /api/patient/medication-reminders/[id]           [AUDIT FIX Step 8]
```

### Doctor
```
POST   /api/doctor/register
GET    /api/doctor/me
GET    /api/doctor/by-user/[userId]
GET    /api/doctor/[doctorId]
PUT    /api/doctor/[doctorId]
GET    /api/doctor/[doctorId]/appointments
PUT    /api/doctor/appointments/[apptId]/status         [AUDIT FIX Step 10]
GET    /api/doctor/search/available
```

### Consultation / Availability
```
GET    /api/consultation/pre-consult/[appointmentId]    [AUDIT FIX Step 10]
POST   /api/consultation                                [AUDIT FIX Step 10]
GET    /api/consultations/log-access
GET    /api/availability/[doctorId]                     [AUDIT FIX Step 10]
PUT    /api/availability/[doctorId]                     [AUDIT FIX Step 10]
POST   /api/availability/[doctorId]/leave               [AUDIT FIX Step 10]
DELETE /api/availability/[doctorId]/leave/[leaveId]     [AUDIT FIX Step 10]
```

### Prescriptions / Lab
```
POST   /api/prescriptions                               [AUDIT FIX Step 10]
GET    /api/prescriptions/[id]/pdf                      [AUDIT FIX Step 10]
POST   /api/lab/orders                                  [AUDIT FIX Step 10]
GET    /api/lab/reports/patient/[patientId]             [AUDIT FIX Step 10]
GET    /api/lab-orders/patient/[patientId]              [AUDIT FIX Step 10]
```

### Hospital
```
POST   /api/hospital/register
POST   /api/hospital/login
GET    /api/hospital/[id]/status                        [AUDIT FIX Step 6]
GET    /api/hospital/[id]                               [AUDIT FIX Step 7]
PUT    /api/hospital/[id]                               [AUDIT FIX Step 7]
GET    /api/hospital/[id]/notifications                 [AUDIT FIX Step 7]
POST   /api/hospital/[id]/notifications                 [AUDIT FIX Step 7]
PUT    /api/hospital/[id]/notifications/read-all        [AUDIT FIX Step 7]
POST   /api/hospital/[id]/notifications/send            [AUDIT FIX Step 7]
PUT    /api/hospital/[id]/notifications/[nid]/read      [AUDIT FIX Step 7]
GET    /api/hospital/[id]/appointments                  [AUDIT FIX Step 7]
POST   /api/hospital/[id]/appointments                  [AUDIT FIX Step 7]
PUT    /api/hospital/[id]/appointments/[aid]/status     [AUDIT FIX Step 7]
POST   /api/hospital/[id]/appointments/walk-in          [AUDIT FIX Step 7]
GET    /api/hospital/[id]/departments                   [AUDIT FIX Step 7]
POST   /api/hospital/[id]/departments                   [AUDIT FIX Step 7]
PUT    /api/hospital/[id]/departments/[did]             [AUDIT FIX Step 7]
DELETE /api/hospital/[id]/departments/[did]             [AUDIT FIX Step 7]
GET    /api/hospital/[id]/doctors                       [AUDIT FIX Step 10]
POST   /api/hospital/[id]/doctors/register              [AUDIT FIX Step 10]
PUT    /api/hospital/[id]/doctors/[did]/verify          [AUDIT FIX Step 10]
PUT    /api/hospital/[id]/doctors/[did]/status          [AUDIT FIX Step 7]
POST   /api/hospital/[id]/invite-doctor                 [AUDIT FIX Step 7]
GET    /api/hospital/[id]/invites                       [AUDIT FIX Step 7]
DELETE /api/hospital/[id]/invites/[iid]                 [AUDIT FIX Step 7]
POST   /api/hospital/[id]/invites/[iid]/resend          [AUDIT FIX Step 7]
GET    /api/hospital/staff/[id]                         [AUDIT FIX Step 7]
POST   /api/hospital/staff/[id]                         [AUDIT FIX Step 7]
PUT    /api/hospital/staff/[id]/[sid]                   [AUDIT FIX Step 7]
```

### Admin
```
GET    /api/admin/stats                                 [AUDIT FIX Step 5]
GET    /api/admin/hospitals                             [AUDIT FIX Step 5]
PUT    /api/admin/hospitals/[id]/verify                 [AUDIT FIX Step 5]
POST   /api/admin/auth/logout                           [AUDIT FIX Step 5]
GET    /api/admin/doctors                               [AUDIT FIX Step 10]
PUT    /api/admin/doctors/[id]/verify                   [AUDIT FIX Step 10]
GET    /api/admin/announcements                         [AUDIT FIX Step 10]
POST   /api/admin/announcements                         [AUDIT FIX Step 10]
GET    /api/admin/audit-logs                            [AUDIT FIX Step 10]
GET    /api/admin/profile                               [AUDIT FIX Step 10]
PUT    /api/admin/profile                               [AUDIT FIX Step 10]
PUT    /api/admin/profile/password                      [AUDIT FIX Step 10]
GET    /api/admin/team                                  [AUDIT FIX Step 10]
POST   /api/admin/team                                  [AUDIT FIX Step 10]
PUT    /api/admin/team/[id]                             [AUDIT FIX Step 10]
DELETE /api/admin/team/[id]                             [AUDIT FIX Step 10]
```

### Config / Invoices / User
```
GET    /api/config/specializations                      [AUDIT FIX Step 10]
POST   /api/config/specializations                      [AUDIT FIX Step 10]
PUT    /api/config/specializations/[id]                 [AUDIT FIX Step 10]
DELETE /api/config/specializations/[id]                 [AUDIT FIX Step 10]
GET    /api/config/insurance-providers                  [AUDIT FIX Step 10]
POST   /api/config/insurance-providers                  [AUDIT FIX Step 10]
GET    /api/invoices/admin/revenue                      [AUDIT FIX Step 10]
POST   /api/invoices/[id]/retry                         [AUDIT FIX Step 10]
POST   /api/invoices/[id]/retry-payment                 [AUDIT FIX Step 10]
GET    /api/patient/invoices                            [AUDIT FIX Step 8]
POST   /api/user/upload-photo                           [AUDIT FIX Step 10]
```

### Blockchain / Contracts / AI
```
POST   /api/contracts/register-doctor
POST   /api/contracts/register-patient
GET    /api/contracts/doctor/[doctorId]
GET    /api/contracts/patient/[patientId]
POST   /api/ai-vaidya/query
POST   /api/ai-vaidya/audit
```

---

## 5. COMPONENTS → API ROUTE MAP

### Patient Portal
| Component                    | Route(s) called                                              |
|------------------------------|--------------------------------------------------------------|
| PatientDashboard             | /patient/profile, /patient/notifications, /patient/appointments, /patient/prescriptions, /patient/lab-reports, /contracts/patient/[id] |
| PatientProfile               | /patient/profile (GET/PUT), /patient/register (POST)         |
| PatientBookAppointment       | /patient/appointments (POST), /doctor/search/available       |
| PatientHistory               | /patient/appointments, /patient/lab-reports                  |
| PatientPrescriptions         | /patient/prescriptions                                       |
| PatientLabReports            | /lab/reports/patient/[id], /patient/lab-reports (fallback)   |
| PatientNotifications         | /patient/notifications, /patient/notifications/read-all      |
| PatientMedicationReminders   | /patient/medication-reminders, /patient/prescriptions        |
| PatientInvoices              | /patient/invoices                                            |
| PatientMedicines             | /config/specializations (for browsing)                       |

### Doctor Portal
| Component                    | Route(s) called                                              |
|------------------------------|--------------------------------------------------------------|
| DoctorDashboard              | /doctor/[id], /doctor/[id]/appointments (today)              |
| DoctorAppointments           | /doctor/[id], /doctor/[id]/appointments, /doctor/appointments/[id]/status |
| DoctorConsultation           | /consultation/pre-consult/[id], /consultation, /doctor/appointments/[id]/status |
| DoctorPrescribeMedicine      | /prescriptions, /prescriptions/[id]/pdf                      |
| DoctorLabOrders              | /lab/orders, /lab-orders/patient/[id]                        |
| DoctorAvailability           | /availability/[id] (GET/PUT), /availability/[id]/leave (POST/DELETE) |
| DoctorProfile                | /doctor/[id] (GET/PUT), /doctor/by-user/[uid]                |
| DoctorPatients               | /doctor/[id]/appointments                                    |
| DoctorSignaturePad           | /doctor/[id] (PUT — saves signature URL)                     |
| DoctorRegistration           | /doctor/register                                             |

### Hospital Portal
| Component                    | Route(s) called                                              |
|------------------------------|--------------------------------------------------------------|
| HospitalDashboard (overview) | /hospital/[id], /hospital/[id]/doctors, /hospital/[id]/appointments |
| → doctors section            | /hospital/[id]/doctors, /hospital/[id]/doctors/register, /hospital/[id]/doctors/[did]/verify, /hospital/[id]/invite-doctor, /hospital/[id]/invites |
| → departments section        | /hospital/[id]/departments (CRUD)                            |
| → appointments section       | /hospital/[id]/appointments, /hospital/[id]/appointments/[aid]/status, /hospital/[id]/appointments/walk-in |
| → staff section              | /hospital/staff/[id] (GET/POST), /hospital/staff/[id]/[sid] (PUT) |
| → notifications section      | /hospital/[id]/notifications, read-all, send, [nid]/read     |
| → profile / settings         | /hospital/[id] (GET/PUT), /auth/change-pin                   |
| HospitalBeds                 | (self-contained component with devStore integration)         |

### Admin Portal
| Component                    | Route(s) called                                              |
|------------------------------|--------------------------------------------------------------|
| AdminDashboard               | /admin/stats, /admin/hospitals, /admin/hospitals/[id]/verify, /admin/auth/logout |
| AdminHospitals               | /admin/hospitals, /admin/hospitals/[id]/verify               |
| AdminDoctorsManagement       | /admin/doctors, /admin/doctors/[id]/verify                   |
| AdminAnnouncements           | /admin/announcements (GET/POST)                              |
| AdminAuditLogs               | /admin/audit-logs                                            |
| AdminTeam                    | /admin/team (GET/POST/PUT/DELETE)                            |
| AdminProfile                 | /admin/profile (GET/PUT), /admin/profile/password, /user/upload-photo |
| AdminAnalytics               | /admin/stats, /invoices/admin/revenue                        |
| AdminRevenue                 | /admin/stats, /admin/hospitals, /admin/doctors, /invoices/admin/revenue |
| AdminConfig                  | /config/specializations (CRUD), /config/insurance-providers  |
| AdminAppointmentsManagement  | /admin/stats                                                 |

---

## 6. DEV STORE GLOBAL STATE

```
globalThis.__mvDevStore              — devAuthStore (users, tokens, sessions)
globalThis.__mvDataStore             — devDataStore (doctors, patients, hospitals, appointments)
globalThis.__mvHospitalNotifications — hospital notifications by hospitalId
globalThis.__mvHospitalAppointments  — hospital appointments by hospitalId
globalThis.__mvHospitalDepartments   — hospital departments by hospitalId
globalThis.__mvHospitalStaff         — hospital staff by hospitalId
globalThis.__mvHospitalInvites       — hospital doctor invites by hospitalId
globalThis.__mvPatientNotifications  — patient notifications by patientId
globalThis.__mvPatientPrescriptions  — patient prescriptions by patientId
globalThis.__mvPatientLabReports     — patient lab reports by patientId
globalThis.__mvPatientInvoices       — patient invoices by patientId
globalThis.__mvPatientReminders      — medication reminders by patientId
globalThis.__mvPrescriptions         — prescriptions by prescriptionId
globalThis.__mvPrescriptionsByPatient— prescription index by patientId
globalThis.__mvLabOrders             — lab orders by orderId
globalThis.__mvLabOrdersByPatient    — lab order index by patientId
globalThis.__mvDoctorAvailability    — doctor availability by doctorId
globalThis.__mvConsultations         — consultation notes by appointmentId
globalThis.__mvAdminAnnouncements    — admin announcements array
globalThis.__mvAdminTeam             — admin team by memberId
globalThis.__mvAdminProfiles         — admin profiles by adminId
globalThis.__mvAuditLogs             — admin audit log array (cap 500)
globalThis.__mvConfigSpecializations — medical specializations array
globalThis.__mvConfigInsurance       — insurance providers array
```

---

## 7. AI-VAIDYA INTEGRATION

```
ai_vaidya/
  agents/       — specialist agents (diagnosis, symptom, medication, etc.)
  policies/     — portal-specific response policies (patient/doctor/hospital/admin)
  ui/
    components/AiVaidyaButton.jsx  — floating button (wired to Layout.jsx [AUDIT FIX Step 4])
    hooks/usePortalContext.js      — maps URL prefix → portal ID + patientId
  index.js      — multi-agent orchestrator
POST /api/ai-vaidya/query          — main query endpoint (Gemini + Groq)
POST /api/ai-vaidya/audit          — audit log endpoint
```

---

## 8. AUDIT FIXES SUMMARY

| Fix Tag        | File(s) changed                                   | Issue fixed                                             |
|----------------|---------------------------------------------------|---------------------------------------------------------|
| Step 2         | backend/src/controllers/auth.controller.js        | Sequelize `.select()` bug (MongoDB syntax used)         |
| Step 3         | MediVault-main/.env.local                         | Misleading port comment (said 3002, value was 3000)     |
| Step 4         | components/layout/Layout.jsx                      | AiVaidyaButton never imported/rendered                  |
| Step 5         | pages/api/admin/ (4 files created)                | AdminDashboard 404s on stats/hospitals/verify/logout    |
| Step 6         | pages/api/hospital/[id]/status.js                 | _app.js hospital status check 404'd on every nav        |
| Step 7         | pages/api/hospital/ (14 files created)            | HospitalDashboard — notifications/appts/staff/profile   |
|                | pages/api/auth/change-pin.js                      | Settings PIN/password change 404'd                      |
|                | components/hospital/HospitalDashboard.jsx         | Sidebar still used MOCK_HOSPITAL instead of hospitalData|
| Step 8         | pages/api/patient/ (8 files created/updated)      | Notification/prescription/lab-report stubs returned []  |
| Step 9         | components/hospital/HospitalDashboard.jsx         | MOCK_STATS hardcoded — now computed from live API data  |
| Step 10        | pages/api/hospital/[id]/doctors/ (3 files)        | Doctor management 404s in HospitalDashboard             |
|                | pages/api/doctor/appointments/[id]/status.js      | Doctor appointment status change 404'd                  |
|                | pages/api/consultation/ (2 files)                 | DoctorConsultation 404 on pre-consult + save            |
|                | pages/api/availability/ (4 files)                 | DoctorAvailability full CRUD 404'd                      |
|                | pages/api/prescriptions/ (2 files)                | DoctorPrescribeMedicine 404'd                           |
|                | pages/api/lab/ + pages/api/lab-orders/ (3 files)  | DoctorLabOrders 404'd                                   |
|                | pages/api/admin/ (8 files)                        | Admin team/docs/announcements/audit/profile 404'd       |
|                | pages/api/config/ (4 files)                       | AdminConfig specializations/insurance 404'd             |
|                | pages/api/invoices/ (3 files)                     | Revenue analytics 404'd                                 |
|                | pages/api/user/upload-photo.js                    | AdminProfile photo upload 404'd                         |

---

## 9. REMAINING KNOWN GAPS (not blocking but noted)

- `backend/.env` uses `localhost` for DB — needs `postgres` (Docker service name) in production Docker runs
- `pages/api/prescriptions/[id]/pdf.js` returns plain-text stub in dev — real PDF generation is Express-backend-only (PDFKit)
- `pages/api/user/upload-photo.js` returns avatar placeholder in dev — real IPFS/Pinata upload is Express-backend-only
- Fabric chaincode integration is best-effort (non-fatal) in dev — `contracts/` routes return mock fabric tx IDs
- `globalThis` stores reset on server restart — expected in dev; production uses PostgreSQL/Redis
- `AdminConfig` has additional insurance/config routes not yet created (PUT/DELETE insurance providers)
- `AdminRevenue` monthly trend data returns empty array — no real billing data in dev mode
