// AI-Vaidya — audit_logger.js | MediVault Platform
// ===================================================
// Tamper-evident audit logging for every AI-Vaidya query.
// Logs to database via the backend API + optional Fabric hash anchoring (Phase 4).

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// In-memory buffer for when backend is unavailable
const auditBuffer = [];
const MAX_BUFFER_SIZE = 500;

/**
 * Log an AI-Vaidya query audit entry.
 *
 * AuditEntry shape:
 * { query_id, session_id, portal_id, user_id, user_role, patient_id,
 *   query_text, intent, agent_used, model_version, retrieved_sources,
 *   response_hash, confidence, urgency, safety_passed, blocked, timestamp }
 */
async function log(entry) {
  if (!entry) return;

  // Write to in-memory buffer first (immediate, never fails)
  if (auditBuffer.length < MAX_BUFFER_SIZE) {
    auditBuffer.push(entry);
  }

  // Attempt to write to backend database (best-effort, non-blocking)
  setImmediate(async () => {
    try {
      const internalSecret = process.env.AIVAIDYA_INTERNAL_SECRET || '';
      const res = await fetch(`${API_URL}/api/ai-vaidya/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-request': internalSecret,
        },
        body: JSON.stringify(entry),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        console.warn(`[audit_logger] Backend write failed: ${res.status}`);
      }
    } catch (_) {
      // Non-fatal — entry is already in memory buffer
    }
  });

  // Anchor hash to Fabric for tamper-evidence (async, non-blocking)
  if (entry.response_hash && process.env.AIVAIDYA_FABRIC_ANCHOR === 'true') {
    setImmediate(async () => {
      try {
        const fabricClient = require('./fabric_client');
        await fabricClient.anchorAuditHash(entry.query_id, entry.response_hash);
      } catch (_) { /* Non-fatal */ }
    });
  }
}

/**
 * Query audit log entries from memory buffer.
 * For full historical queries, use the backend API directly.
 */
async function queryAuditLog(filters = {}) {
  let results = [...auditBuffer];

  if (filters.portal_id) results = results.filter(e => e.portal_id === filters.portal_id);
  if (filters.user_id) results = results.filter(e => e.user_id === filters.user_id);
  if (filters.blocked === true) results = results.filter(e => e.blocked === true);
  if (filters.safety_failed === true) results = results.filter(e => e.safety_passed === false);

  // Sort by timestamp descending
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return results.slice(0, filters.limit || 100);
}

// TODO (Phase 4): Hyperledger Fabric hash anchoring stub
// async function anchorHashToFabric(queryId, responseHash) {
//   const fabricClient = require('./fabric_client');
//   await fabricClient.submitTransaction('AuditChaincode', 'LogQueryHash', queryId, responseHash);
// }

module.exports = { log, queryAuditLog };
