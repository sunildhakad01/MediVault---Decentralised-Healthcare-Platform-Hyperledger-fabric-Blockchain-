# AI-Vaidya — Production Deployment Guide
## MediVault Platform

---

## 1. Required Environment Variables

Add the following to your `.env.local` (or production secrets manager). Never commit API keys.

```env
# === AI-VAIDYA VARIABLES (added by AI-Vaidya setup) ===

# ── Primary LLM (Google AI Studio — free tier) ────────────────────────────
GEMINI_API_KEY=                        # aistudio.google.com → Get API Key

# ── Fast classification LLM (Groq — free tier) ────────────────────────────
GROQ_API_KEY=                          # console.groq.com → API Keys

# ── Medical embeddings (HuggingFace — free tier) ──────────────────────────
HUGGINGFACE_API_KEY=                   # huggingface.co/settings/tokens (read scope)

# ── Model selection ────────────────────────────────────────────────────────
AIVAIDYA_PRIMARY_MODEL=gemini-1.5-flash
AIVAIDYA_FAST_MODEL=llama3-8b-8192
AIVAIDYA_EMBED_MODEL=pritamdeka/S-PubMedBert-MS-MARCO
AIVAIDYA_MAX_TOKENS=1500
AIVAIDYA_TEMPERATURE=0.3
AIVAIDYA_CONTEXT_WINDOW=8000

# ── Vector DB ─────────────────────────────────────────────────────────────
VECTOR_DB_TYPE=faiss
VECTOR_DB_PATH=./ai_vaidya/vector_store

# ── Feature flags ──────────────────────────────────────────────────────────
AIVAIDYA_ENABLE_RAG=true
AIVAIDYA_ENABLE_FILE_ANALYSIS=true
AIVAIDYA_ENABLE_MONITORING=true
AIVAIDYA_AUDIT_LOGGING=true

# ── Security ──────────────────────────────────────────────────────────────
AIVAIDYA_INTERNAL_SECRET=             # Random string — used for internal audit writes
AIVAIDYA_CONSENT_STRICT=false         # Set true in production (denies on consent API failure)

# ── Blockchain (optional — enable when Fabric is live) ────────────────────
AIVAIDYA_FABRIC_ANCHOR=false          # Set true to anchor audit hashes to Fabric
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_MSP_ID=Org1MSP
FABRIC_CERT_PATH=
FABRIC_KEY_PATH=
FABRIC_TLS_CERT_PATH=
FABRIC_CHANNEL_CONSENT=medivault-consent
FABRIC_CHANNEL_AUDIT=medivault-audit
```

---

## 2. Free API Setup (Step-by-Step)

All three APIs are free. No credit card required at startup scale.

### Gemini (Google AI Studio)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with a Google account
3. Click **Get API key** → **Create API key**
4. Copy the key → set as `GEMINI_API_KEY`

**Free tier limits:** 15 requests/min · 1,500 requests/day · 1M tokens/min

### Groq
1. Go to [console.groq.com](https://console.groq.com)
2. Create a free account
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key → set as `GROQ_API_KEY`

**Free tier limits:** 30 requests/min · 14,400 requests/day

### HuggingFace (Inference API)
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **New token** → select **Read** scope
3. Copy the token → set as `HUGGINGFACE_API_KEY`

**Free tier limits:** ~1,000 requests/day on shared inference

---

## 3. Initial Knowledge Base Seeding

Run once after deployment to pre-populate the RAG vector store with medical knowledge.

```bash
# From the project root
node ai_vaidya/rag/knowledge_base/ingest.js
```

This ingests:
- WHO Essential Medicines List
- ICMR clinical guidelines (public PDFs)
- openFDA drug monographs (top 500 common Indian drugs)
- Indian immunisation schedule
- Common lab reference ranges (Indian population)

**Estimated time:** 20–30 minutes on first run (embeddings are cached after).

---

## 4. Audit Log Database Migration

AI-Vaidya logs every query to `ai_vaidya_audit_logs`. Create this collection/table in your database.

### MongoDB (Mongoose)
```js
// models/AuditLog.js
const mongoose = require('mongoose');
const AuditLogSchema = new mongoose.Schema({
  query_id:          { type: String, required: true, unique: true },
  session_id:        String,
  portal_id:         String,
  user_id:           String,
  user_role:         String,
  patient_id:        String,
  query_text:        String,
  intent:            String,
  agent_used:        String,
  model_version:     String,
  retrieved_sources: [String],
  response_hash:     String,   // SHA-256 — never store the response itself
  confidence:        Number,
  urgency:           String,
  safety_passed:     Boolean,
  blocked:           Boolean,
  timestamp:         { type: Date, default: Date.now },
}, { collection: 'ai_vaidya_audit_logs' });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
```

Then update `pages/api/ai-vaidya/audit.js` to use:
```js
const AuditLog = require('../../../models/AuditLog');
await AuditLog.create(entry);
```

### PostgreSQL (Prisma)
```sql
CREATE TABLE ai_vaidya_audit_logs (
  query_id          TEXT PRIMARY KEY,
  session_id        TEXT,
  portal_id         TEXT,
  user_id           TEXT,
  user_role         TEXT,
  patient_id        TEXT,
  query_text        TEXT,
  intent            TEXT,
  agent_used        TEXT,
  model_version     TEXT,
  retrieved_sources TEXT[],
  response_hash     TEXT,
  confidence        FLOAT,
  urgency           TEXT,
  safety_passed     BOOLEAN DEFAULT TRUE,
  blocked           BOOLEAN DEFAULT FALSE,
  timestamp         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_portal ON ai_vaidya_audit_logs(portal_id);
CREATE INDEX idx_audit_user ON ai_vaidya_audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON ai_vaidya_audit_logs(timestamp DESC);
```

---

## 5. API Quota Monitoring

Monitor usage to avoid hitting free tier limits.

| Provider    | Monitor at                            | Key limit                     |
|-------------|---------------------------------------|-------------------------------|
| Gemini      | aistudio.google.com → Usage           | 15 RPM · 1,500 RPD            |
| Groq        | console.groq.com → Rate Limits        | 30 RPM · 14,400 RPD           |
| HuggingFace | huggingface.co/settings/usage         | ~1,000 RPD (shared inference) |

**When to upgrade:**
- > 1,000 AI-Vaidya queries/day → upgrade Gemini to paid tier
- Groq is generous on free tier — upgrade only if latency matters at scale
- HuggingFace: switch to dedicated inference endpoint for > 500 embedding calls/day

---

## 6. Upgrade Path (When Scaling)

Everything is a config change — no code rewrites needed.

### Upgrade LLM
Change `AIVAIDYA_PRIMARY_MODEL` in `.env`:
```env
# Option A: Gemini Pro (paid — better reasoning)
AIVAIDYA_PRIMARY_MODEL=gemini-1.5-pro

# Option B: Claude Sonnet (Anthropic — paid)
# Also update orchestrator to use the Anthropic SDK format
AIVAIDYA_PRIMARY_MODEL=claude-sonnet-4-6
```

### Upgrade Vector DB (FAISS → Pinecone)
1. Set `VECTOR_DB_TYPE=pinecone` in env
2. Add `PINECONE_API_KEY` and `PINECONE_INDEX` to env
3. Update `ai_vaidya/rag/vector_store.js` to use the Pinecone client

### Upgrade Consent Cache (Memory → Redis)
1. Set `REDIS_URL` in env
2. In `consent_cache.js`, replace the `_cache` Map with an `ioredis` client:
```js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
// Replace _cache.set with: await redis.setex(key, 300, JSON.stringify(value))
// Replace _cache.get with: JSON.parse(await redis.get(key))
```

### Enable Hyperledger Fabric
1. Set `AIVAIDYA_FABRIC_ANCHOR=true` in env
2. Configure `FABRIC_PEER_ENDPOINT`, `FABRIC_MSP_ID`, cert paths
3. Install: `npm install @hyperledger/fabric-gateway @grpc/grpc-js`
4. Uncomment the implementation blocks in `ai_vaidya/blockchain/fabric_client.js`
5. Uncomment the Fabric sync call in `ai_vaidya/blockchain/consent_cache.js`

---

## 7. Adding a New Portal

To add a researcher, lab, or government agency portal:

1. Open `ai_vaidya/config/register_portal.js`
2. Uncomment the relevant pre-built config block (researcher / lab / govt_agency)
3. Add the JWT role mapping in `ai_vaidya/api/query_handler.js`:
   ```js
   researcher: 'researcher',   // add to the roleToPortalId map
   ```
4. Done — orchestrator, policies, consent gate, UI all pick it up automatically.

---

## 8. Running the Test Suite

```bash
# Unit + integration tests (no API keys required for unit tests)
node ai_vaidya/tests/e2e_test.js

# With API keys (full 22-test suite including LLM tests)
GEMINI_API_KEY=your_key GROQ_API_KEY=your_key node ai_vaidya/tests/e2e_test.js
```

All 22 tests must pass before production deployment.

---

## 9. Monitoring & Health Checks

### Weekly audit review
```js
// Check for caught safety issues (safety_passed=false)
// Run against your audit_logs collection
db.ai_vaidya_audit_logs.find({ safety_passed: false }).sort({ timestamp: -1 }).limit(20)
```

### Key metrics to track
- `blocked: true` rate — high rate may indicate poor intent classification
- `safety_passed: false` rate — indicates content the filter is catching
- `confidence < 0.5` rate — queries the classifier is uncertain about
- Response latency (track in audit timestamp vs. received_at)

### Consent cache stats
```js
const { getCacheStats } = require('./ai_vaidya/blockchain/consent_cache');
console.log(getCacheStats()); // { total, valid, expired }
```

---

## 10. Files Modified in Existing Codebase

Only 2 lines were added to pre-existing files:

| File | Change |
|------|--------|
| `pages/_app.js` | Added `<AiVaidyaButton />` as last child of root layout |
| `pages/api/ai-vaidya/query.js` | Created (new file — not a modification) |

All AI-Vaidya logic lives in `ai_vaidya/` — zero existing functionality was modified.

---

*AI-Vaidya Deployment Guide — MediVault Platform*
*Portals: Patient · Doctor · Hospital · Admin*
*Extensible to: Researcher · Lab · Government Agency*
