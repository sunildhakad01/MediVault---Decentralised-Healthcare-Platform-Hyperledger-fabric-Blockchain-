// AI-Vaidya — consent_cache.js | MediVault Platform
// ====================================================
// Redis-backed (or in-memory Map fallback) consent checker with 5-minute TTL caching.
// Hyperledger Fabric integration stubs are included — uncomment when Fabric is live.

const CONSENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

// ─── In-memory cache (Map) ────────────────────────────────────────────────────
// Key: `${patientId}:${accessorId}` → { allowed, scope, expiresAt, cachedAt }
const _cache = new Map();

// ─── Cache helpers ────────────────────────────────────────────────────────────

function _cacheKey(patientId, accessorId) {
  return `consent:${patientId}:${accessorId}`;
}

function _isExpired(entry) {
  return Date.now() - entry.cachedAt > CONSENT_CACHE_TTL;
}

function _setCache(patientId, accessorId, value) {
  _cache.set(_cacheKey(patientId, accessorId), {
    ...value,
    cachedAt: Date.now(),
  });
}

function _getCache(patientId, accessorId) {
  const entry = _cache.get(_cacheKey(patientId, accessorId));
  if (!entry || _isExpired(entry)) return null;
  return entry;
}

function _invalidate(patientId, accessorId) {
  _cache.delete(_cacheKey(patientId, accessorId));
}

// ─── Database consent check ───────────────────────────────────────────────────

/**
 * Check the backend consent API for a patient-accessor pair.
 * Falls back to "allowed=true" if the API endpoint is not available
 * (safe default for development — override via AIVAIDYA_CONSENT_STRICT=true).
 */
async function _checkFromDatabase(patientId, accessorId, authToken) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const strict = process.env.AIVAIDYA_CONSENT_STRICT === 'true';

  try {
    const url = `${API_URL}/api/consent/check?patientId=${encodeURIComponent(patientId)}&accessorId=${encodeURIComponent(accessorId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // If consent endpoint returns 404, the endpoint doesn't exist yet
      if (res.status === 404) {
        console.warn('[consent_cache] Consent endpoint not found — defaulting to allowed=true for development');
        return { allowed: true, scope: ['read'], expiresAt: null };
      }
      throw new Error(`Consent API responded with ${res.status}`);
    }

    const data = await res.json();
    return {
      allowed: data?.allowed === true,
      scope: data?.scope || ['read'],
      expiresAt: data?.expiresAt || null,
    };
  } catch (err) {
    if (strict) {
      console.error('[consent_cache] Strict mode: consent check failed, denying access:', err.message);
      return { allowed: false, scope: [], expiresAt: null };
    }
    // Non-strict (dev) mode: default to allowed
    console.warn('[consent_cache] Consent check failed, defaulting to allowed (set AIVAIDYA_CONSENT_STRICT=true in prod):', err.message);
    return { allowed: true, scope: ['read'], expiresAt: null };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether accessorId has consent to access patientId's data.
 * Results are cached for 5 minutes.
 *
 * @param {string} patientId   - The patient whose records are being accessed
 * @param {string} accessorId  - The doctor/hospital user requesting access
 * @param {string} [authToken] - JWT for the backend API call
 * @param {string} [dataType]  - Optional data type scope ('read' | 'write' | 'full')
 * @returns {Promise<{ allowed: boolean, scope: string[], expiresAt: Date|null }>}
 */
async function checkConsentCached(patientId, accessorId, authToken = '', dataType = 'read') {
  if (!patientId || !accessorId) {
    return { allowed: false, scope: [], expiresAt: null };
  }

  // Same person accessing own data — always allowed
  if (patientId === accessorId) {
    return { allowed: true, scope: ['read', 'write', 'full'], expiresAt: null };
  }

  // Check cache
  const cached = _getCache(patientId, accessorId);
  if (cached) {
    return { allowed: cached.allowed, scope: cached.scope, expiresAt: cached.expiresAt };
  }

  // TODO (Phase 4 — Fabric live): Try Fabric chaincode first
  // try {
  //   const fabricClient = require('./fabric_client');
  //   const fabricResult = await fabricClient.getConsentFromChaincode(patientId, accessorId);
  //   if (fabricResult) {
  //     _setCache(patientId, accessorId, fabricResult);
  //     return fabricResult;
  //   }
  // } catch (_) { /* fall through to database */ }

  // Cache miss → check database
  const result = await _checkFromDatabase(patientId, accessorId, authToken);
  _setCache(patientId, accessorId, result);
  return result;
}

/**
 * Revoke cached consent for a patient-accessor pair.
 * Call this when consent is revoked — forces next check to re-query the database.
 *
 * @param {string} patientId
 * @param {string} accessorId
 */
async function revokeConsent(patientId, accessorId) {
  _invalidate(patientId, accessorId);

  // Log revocation to audit trail
  try {
    const auditLogger = require('./audit_logger');
    await auditLogger.log({
      query_id: `revoke_${Date.now()}`,
      session_id: null,
      portal_id: 'system',
      user_id: accessorId,
      user_role: 'system',
      patient_id: patientId,
      query_text: `[CONSENT REVOKED] patient=${patientId} accessor=${accessorId}`,
      intent: 'consent_revocation',
      agent_used: 'consent_cache',
      model_version: 'n/a',
      retrieved_sources: [],
      response_hash: null,
      confidence: 1.0,
      urgency: 'normal',
      safety_passed: true,
      blocked: false,
      timestamp: new Date().toISOString(),
    });
  } catch (_) { /* Non-fatal */ }

  // TODO (Phase 4 — Fabric live): propagate revocation to chaincode
  // try {
  //   const fabricClient = require('./fabric_client');
  //   await fabricClient.submitTransaction('consent', 'ConsentChaincode', 'RevokeConsent', patientId, accessorId);
  // } catch (_) { /* Non-fatal */ }
}

/**
 * Invalidate all cached consent entries for a patient.
 * Use when a patient's consent settings are bulk-updated.
 *
 * @param {string} patientId
 */
function invalidatePatientConsents(patientId) {
  const prefix = `consent:${patientId}:`;
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

// ─── Fabric integration stubs ─────────────────────────────────────────────────

/**
 * Sync consent state from Hyperledger Fabric chaincode.
 * STUB — implement when Fabric is live.
 *
 * @param {string} patientId
 * @param {string} accessorId
 */
async function syncWithFabric(patientId, accessorId) {
  // TODO (Fabric live): Uncomment and implement
  // const fabricClient = require('./fabric_client');
  // const result = await fabricClient.getConsentFromChaincode(patientId, accessorId);
  // if (result) _setCache(patientId, accessorId, result);
  console.debug('[consent_cache] syncWithFabric called — Fabric not yet connected');
}

/**
 * Handle a Fabric consent event (e.g., ConsentGranted / ConsentRevoked chaincode events).
 * Call this from the Fabric event listener when it's set up.
 *
 * @param {{ type: 'granted'|'revoked', patientId: string, accessorId: string, payload: object }} event
 */
function onFabricConsentEvent(event) {
  if (!event?.patientId || !event?.accessorId) return;

  if (event.type === 'revoked') {
    _invalidate(event.patientId, event.accessorId);
    console.info(`[consent_cache] Cache invalidated via Fabric event: ${event.patientId}:${event.accessorId}`);
  } else if (event.type === 'granted') {
    _setCache(event.patientId, event.accessorId, {
      allowed: true,
      scope: event.payload?.scope || ['read'],
      expiresAt: event.payload?.expiresAt || null,
    });
    console.info(`[consent_cache] Cache updated via Fabric event: ${event.patientId}:${event.accessorId}`);
  }
}

// ─── Cache diagnostics (dev only) ─────────────────────────────────────────────

/**
 * Return cache stats — useful for monitoring.
 */
function getCacheStats() {
  let valid = 0;
  let expired = 0;
  for (const entry of _cache.values()) {
    if (_isExpired(entry)) expired++;
    else valid++;
  }
  return { total: _cache.size, valid, expired };
}

module.exports = {
  checkConsentCached,
  revokeConsent,
  invalidatePatientConsents,
  syncWithFabric,
  onFabricConsentEvent,
  getCacheStats,
};
