// AI-Vaidya — fabric_client.js | MediVault Platform
// ====================================================
// Routes all Fabric calls through the Express backend REST API.
// The backend owns the Fabric wallet + gateway; AI-Vaidya simply posts HTTP.
//
// CHANNELS used by backend:
//   - medicalrecords-channel  → healthcare chaincode  (records, prescriptions)
//   - (audit/consent via backend /api/contracts and /api/admin routes)

const API_URL = process.env.NEXT_PUBLIC_API_URL
  || process.env.BACKEND_URL
  || 'http://localhost:3002';

// ── Simple HTTP helper (uses Node 18+ built-in fetch — no external deps) ────────

// Node.js 18+ ships fetch globally; no node-fetch package required.
const _fetch = globalThis.fetch;

async function _post(path, body, token) {
  try {
    const res = await _fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[fabric_client] POST ${path} failed:`, err.message);
    return null;
  }
}

async function _get(path, token) {
  try {
    const res = await _fetch(`${API_URL}/api${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[fabric_client] GET ${path} failed:`, err.message);
    return null;
  }
}

// ── Connection state (no-op — backend manages gateway) ───────────────────────

let _connected = false;

async function connect() {
  // No direct connection needed — backend holds the Fabric gateway.
  _connected = true;
  console.info('[fabric_client] Fabric proxied via backend API at', API_URL);
}

function disconnect() {
  _connected = false;
}

// ── Consent chaincode API (proxied to backend) ────────────────────────────────

/**
 * Grant patient consent on-chain via backend.
 * @param {string} patientId
 * @param {string} accessorId
 * @param {string[]} scope
 * @param {string|null} expiresAt
 * @param {string} token - JWT of authenticated user
 */
async function grantConsentOnChain(patientId, accessorId, scope = ['read'], expiresAt = null, token) {
  const result = await _post('/patient/consent/grant', { patientId, accessorId, scope, expiresAt }, token);
  console.info(`[fabric_client] Consent granted: ${patientId} → ${accessorId}`);
  return result;
}

/**
 * Revoke patient consent on-chain via backend.
 */
async function revokeConsentOnChain(patientId, accessorId, token) {
  const result = await _post('/patient/consent/revoke', { patientId, accessorId }, token);
  console.info(`[fabric_client] Consent revoked: ${patientId} → ${accessorId}`);
  return result;
}

/**
 * Fetch consent state via backend.
 */
async function getConsentFromChaincode(patientId, accessorId, token) {
  const result = await _get(`/patient/consent/${patientId}/${accessorId}`, token);
  return result?.data ?? null;
}

// ── Audit chaincode API (proxied to backend) ──────────────────────────────────

/**
 * Anchor AI-Vaidya query hash on Fabric ledger via backend.
 * @param {string} queryId
 * @param {string} responseHash - SHA-256 hex of response text
 * @param {string} token
 */
async function anchorAuditHash(queryId, responseHash, token) {
  const result = await _post('/admin/audit/anchor', { queryId, responseHash, source: 'ai_vaidya' }, token);
  return result?.txId ?? null;
}

/**
 * Verify an anchored hash via backend.
 */
async function verifyAuditHash(queryId, responseHash, token) {
  const result = await _get(`/admin/audit/verify/${queryId}?hash=${responseHash}`, token);
  if (!result) return { verified: false, reason: 'backend_unreachable' };
  return { verified: result.data?.match === true, reason: result.data?.reason };
}

// ── Generic transaction helpers (via backend contracts route) ─────────────────

async function submitTransaction(channelName, chaincodeName, fcn, token, ...args) {
  return await _post('/contracts/invoke', { channelName, chaincodeName, fcn, args }, token);
}

async function evaluateTransaction(channelName, chaincodeName, fcn, token, ...args) {
  return await _get(
    `/contracts/query?channel=${channelName}&chaincode=${chaincodeName}&fcn=${fcn}&args=${encodeURIComponent(JSON.stringify(args))}`,
    token
  );
}

// ── Health check ──────────────────────────────────────────────────────────────

async function getStatus() {
  const health = await _get('/health');
  return {
    connected: health?.status === 'ok',
    backendUrl: API_URL,
    fabricProxied: true,
  };
}

module.exports = {
  connect,
  disconnect,
  submitTransaction,
  evaluateTransaction,
  getConsentFromChaincode,
  grantConsentOnChain,
  revokeConsentOnChain,
  anchorAuditHash,
  verifyAuditHash,
  getStatus,
};
