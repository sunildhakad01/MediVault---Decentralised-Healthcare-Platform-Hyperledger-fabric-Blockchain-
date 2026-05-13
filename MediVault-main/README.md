# MediVault

> A trusted digital foundation for the healthcare ecosystem — Web3-powered, patient-centric healthcare data management platform.

**Health in Pixels: Startup Hackathon & Cohort 2025**  
Theme: Health IT Systems & Healthcare Data Privacy  
Stage: Functional Web3 MVP (Foundational Layer)

---

## The Problem

Modern healthcare systems face systemic, interconnected challenges:

- Healthcare data is fragmented across hospitals, doctors, labs, and insurers
- Patients lack ownership and control over their own medical records
- Centralized systems create single points of failure, increasing cyber risk
- Appointments, prescriptions, and clinical records are opaque and hard to verify
- Limited interoperability blocks continuity of care and research

---

## The Solution

MediVault is a **decentralized healthcare data ecosystem** that acts as a single, trusted health data layer connecting patients, providers, hospitals, and systems.

**What MediVault delivers today:**

| Capability | Status |
|-----------|--------|
| PIN-based secure authentication for patients and doctors | Live |
| Patient-controlled health records and consent | Live |
| Doctor consultation, prescription, and lab order workflows | Live |
| Hospital management portal (doctors, departments, beds, staff) | Live |
| Super admin system with 2FA and full audit trail | Live |
| AI-Vaidya — multi-agent medical AI assistant | Live |
| Hyperledger Fabric consent and audit blockchain | Live (non-fatal in dev) |
| On-chain doctor and patient identity registration | Live |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER  (Next.js 13 — port 3000)                                      │
│  Patient Portal · Doctor Portal · Hospital Portal · Admin Portal        │
│                                                                          │
│  DEV MODE:  pages/api/**  (Next.js API routes, in-process)              │
│  PROD MODE: NEXT_PUBLIC_API_URL → Express backend (port 3002)           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
    ┌──────▼────────┐           ┌──────────▼──────────┐
    │  DEV STORE    │           │  EXPRESS BACKEND     │
    │  globalThis   │           │  Node.js + Sequelize │
    │  28 namespaces│           │  PostgreSQL + Redis  │
    └───────────────┘           └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  AI-VAIDYA  ·  Gemini 1.5 Flash  ·  Groq LLaMA3  ·  FAISS RAG          │
│  Clinical Decision · Drug Safety · Document Analysis · Monitoring       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  HYPERLEDGER FABRIC  ·  2 Hospital Orgs  ·  Raft Orderer               │
│  Consent Channel  ·  Audit Channel  ·  CouchDB World State             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Next.js 13** (pages router) — full-stack React framework
- **React 18** — UI rendering
- **Tailwind CSS** — utility-first styling
- **TanStack Query** — server state management
- **Axios** — HTTP client
- **React Hot Toast** — in-app notifications

### Backend (Production)
- **Node.js 18 + Express.js** — REST API server (port 3002)
- **Sequelize ORM + PostgreSQL 15** — primary relational database
- **Redis 7** — session cache, token store, OTP expiry
- **PDFKit** — server-side prescription PDF generation
- **Pinata / IPFS** — decentralized profile and asset storage

### AI-Vaidya
- **Google Gemini 1.5 Flash** — primary reasoning LLM
- **Groq LLaMA3-8B** — fast intent classification
- **HuggingFace S-PubMedBert** — medical embeddings
- **FAISS** — local vector store for RAG retrieval
- Knowledge base: WHO guidelines, ICMR protocols, openFDA drug data

### Blockchain
- **Hyperledger Fabric 2.x** — permissioned blockchain
- **CouchDB 3.3** — Fabric world state (2 instances, one per hospital org)
- **fabric-gateway 1.4** — Node.js chaincode SDK
- Consent chaincode + Audit chaincode on separate channels

### Infrastructure
- **Docker Compose** — 13 services orchestrated
- **pgAdmin 4** — database admin UI

---

## Portals

### Patient Portal
Patients register via a 3-step OTP + PIN flow. The dashboard provides access to appointments, prescriptions, lab reports, medication reminders, invoices, and emergency contacts. Patients control their own consent via the Fabric layer.

### Doctor Portal
Doctors register and are verified by hospital admins or the super admin. The portal supports consultation workflows (pre-consult patient history, diagnosis notes, prescription issuance, lab test orders), availability scheduling, and digital signature capture.

### Hospital Admin Portal
Hospitals register and are verified by the super admin. The portal covers full hospital operations: doctor management, department CRUD, appointment tracking, bed occupancy, staff management, lab coordination, billing, and broadcast notifications.

### Super Admin Portal
Password + 2FA OTP authentication. Full system visibility: hospital verification, doctor verification, system-wide announcements, audit logs, team management, revenue analytics, and configuration of specializations and insurance providers.

---

## AI-Vaidya

AI-Vaidya is a multi-agent medical AI assistant embedded in all four portals via a floating button.

**How it works:**
1. User sends a query from any portal
2. Groq LLaMA3 classifies intent (fast, cheap inference)
3. FAISS + HuggingFace retrieves relevant knowledge from the medical RAG
4. The appropriate specialist agent is selected (clinical decision, drug safety, document analysis, monitoring, research, or general health)
5. Gemini 1.5 Flash generates the final response under portal-specific policy
6. Every query is audit-logged with a SHA-256 response hash (never the response itself)

Portal policies ensure patients receive plain-language wellness guidance while doctors receive full clinical detail including drug dosages and differential diagnosis support.

---

## Blockchain Layer

Two Hyperledger Fabric channels run alongside the platform:

- **medivault-consent** — patient consent grants, revocations, and time-limited access tokens
- **medivault-audit** — immutable record of every data access event

The consent layer gates AI-Vaidya queries: if a doctor queries patient data, their consent status is checked against the Fabric ledger before the response is generated. All AI audit hashes can optionally be anchored on-chain.

---

## Local Setup

### Prerequisites
- Node.js >= 18
- Docker Desktop (for production mode with PostgreSQL + Redis + Fabric)

### Clone & Install

```bash
git clone <your-repo-url>
cd MediVault-main
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# API routing (omit entirely for dev mode — uses Next.js routes)
# NEXT_PUBLIC_API_URL=http://localhost:3002

# AI-Vaidya (all free tier)
GEMINI_API_KEY=           # aistudio.google.com
GROQ_API_KEY=             # console.groq.com
HUGGINGFACE_API_KEY=      # huggingface.co/settings/tokens
AIVAIDYA_INTERNAL_SECRET= # any random string

# Storage (optional in dev)
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Run in Dev Mode

```bash
npm run dev
# Frontend available at http://localhost:3000
# No database or Docker required
```

All data is stored in memory (`globalThis`) and resets on server restart. This is expected behavior in dev mode.

### Seed AI Knowledge Base (one-time)

```bash
node ai_vaidya/rag/knowledge_base/ingest.js
# Ingests WHO guidelines, ICMR protocols, openFDA drug data (~20 min)
```

### Run Tests

```bash
node ai_vaidya/tests/e2e_test.js
# 22 tests — unit tests run without API keys
```

### Production Mode (Docker)

```bash
# Copy and configure backend env
cp backend/.env.example backend/.env
# Edit backend/.env: change localhost → postgres in DATABASE_URL

docker-compose up -d
# Services: postgres, redis, api-server, frontend, fabric network (13 total)
```

---

## Project Structure

```
MediVault-main/
├── pages/              # Next.js pages + API routes (90 routes)
│   ├── patient/        # Patient portal pages
│   ├── doctor/         # Doctor portal pages
│   ├── hospital/       # Hospital admin pages
│   ├── admin/          # Super admin pages
│   └── api/            # Dev-mode API handlers
├── components/         # React components by portal
│   ├── patient/        # 13 patient components
│   ├── doctor/         # 10 doctor components
│   ├── hospital/       # 6 hospital components
│   └── admin/          # 11 admin components
├── ai_vaidya/          # AI assistant (self-contained)
│   ├── agents/         # 6 specialist agents
│   ├── api/            # Query handler + portal config
│   ├── blockchain/     # Fabric consent cache + client
│   ├── policies/       # Portal response policies
│   ├── rag/            # Vector store + knowledge base
│   ├── tests/          # 22-test e2e suite
│   └── ui/             # React components (button, chat, file upload)
├── lib/                # Dev-mode in-memory stores
├── context/            # AuthContext (token management)
├── utils/              # API client (axios)
├── backend/            # Express production backend
│   └── src/
│       ├── controllers/
│       ├── models/     # 15 Sequelize models
│       ├── routes/     # 19 route files
│       └── services/
├── fabric/             # Hyperledger Fabric network config
│   ├── chaincodes/     # Consent + audit chaincode
│   ├── organizations/  # MSP configs
│   └── channel-artifacts/
├── docker-compose.yml  # 13-service orchestration
├── PROJECT_STATUS.md   # Detailed technical reference
└── MEDIVAULT_GRAPH.md  # Living architecture map + audit log
```

---

## Docker Services Reference

| Service | Port | Purpose |
|---------|------|---------|
| frontend | 3000 | Next.js app |
| api-server | 3002 | Express REST API |
| postgres | 5432 | Primary database |
| redis | 6379 | Cache + sessions |
| pgadmin | 5050 | DB admin UI |
| peer0.hospital1 | 7051 | Fabric peer — Hospital1 |
| peer0.hospital2 | 8051 | Fabric peer — Hospital2 |
| orderer | 7050 | Fabric block orderer |
| ca-hospital1/2/orderer | 7054–7056 | Fabric certificate authorities |
| couchdb-hospital1/2 | 5984–5985 | Fabric world state |

---

## Roadmap

- [ ] Ethereum L2 deployment (parallel Web3 layer)
- [ ] ABDM / ABHA national health ID integration
- [ ] Emergency access override protocols (break-glass consent)
- [ ] AI post-treatment monitoring and drug interaction alerts
- [ ] The Graph for off-chain blockchain indexing
- [ ] Mobile app (React Native)
- [ ] HL7 FHIR API compatibility
- [ ] Privacy-preserving research data export
- [ ] Clinical pilot deployment with partner hospitals

---

## Challenges Solved

- Next.js 13 server-side globalThis isolation for multi-namespace dev stores
- Hyperledger Fabric non-fatal integration (portal works without Fabric running)
- Multi-LLM orchestration with portal-specific response policies
- 3-step OTP + PIN auth flow with automatic token rotation
- 90 API routes across 4 user roles with consistent auth middleware

---

## Team

**Medi-Vaulters**

| Name | Role |
|------|------|
| Sunil Dhakad | AI, Research & Strategy Lead |
| Vedant Jain | Blockchain & Backend Lead |
| Milan Goswami | Frontend & UX Engineer |
| Sumit Kumar Ahirwar | Product & Healthcare Domain Lead |

---

## Documentation

- [PROJECT_STATUS.md](PROJECT_STATUS.md) — Full technical reference: logical flows, data models, API surface, dev vs prod modes
- [MEDIVAULT_GRAPH.md](MEDIVAULT_GRAPH.md) — Living architecture map: component-to-route mapping, dev store namespaces, audit fix log
- [ai_vaidya/DEPLOYMENT.md](ai_vaidya/DEPLOYMENT.md) — AI-Vaidya production deployment guide
- [CONFIGURATION_SETUP_GUIDE.md](CONFIGURATION_SETUP_GUIDE.md) — Environment and config reference
