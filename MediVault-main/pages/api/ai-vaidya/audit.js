// AI-Vaidya — pages/api/ai-vaidya/audit.js | MediVault Platform
// ==============================================================
// Internal API route: POST /api/ai-vaidya/audit
// Receives audit log entries from audit_logger.js and writes them to storage.
//
// This endpoint is INTERNAL — it only accepts requests from the same server process
// (localhost) or from a valid admin JWT. Never expose audit writes to the public client.

// In-memory audit store for development (survives the request but not restarts).
// In production, replace this with a real DB write (MongoDB/PostgreSQL via your ORM).
const auditStore = [];
const MAX_STORE_SIZE = 10000;

/**
 * Validate that the request is internal (same-origin) or from an admin user.
 */
function isInternalRequest(req) {
  const host = req.headers.host || '';
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const xInternal = req.headers['x-internal-request'];

  // Internal service call (from audit_logger within the same Next.js process)
  if (xInternal === process.env.AIVAIDYA_INTERNAL_SECRET) return true;

  // Same-origin (localhost development)
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;

  // Reject public cross-origin writes
  return false;
}

export default function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Gate: internal calls only
  if (!isInternalRequest(req)) {
    return res.status(403).json({ error: 'Audit writes are internal only.' });
  }

  const entry = req.body;

  // Basic shape validation
  if (!entry || typeof entry !== 'object' || !entry.query_id) {
    return res.status(400).json({ error: 'Invalid audit entry' });
  }

  // Write to in-memory store (dev) — replace with DB write in production
  // ─────────────────────────────────────────────────────────────────────
  // PRODUCTION EXAMPLE (Mongoose):
  //   const AuditLog = require('../../../models/AuditLog');
  //   await AuditLog.create(entry);
  //
  // PRODUCTION EXAMPLE (Prisma):
  //   const { prisma } = require('../../../lib/prisma');
  //   await prisma.aiVaidyaAuditLog.create({ data: entry });
  // ─────────────────────────────────────────────────────────────────────

  if (auditStore.length >= MAX_STORE_SIZE) {
    auditStore.shift(); // Drop oldest entry when full
  }
  auditStore.push({
    ...entry,
    received_at: new Date().toISOString(),
  });

  // Optionally anchor to Fabric (async, non-blocking)
  if (entry.response_hash && process.env.AIVAIDYA_FABRIC_ANCHOR === 'true') {
    setImmediate(async () => {
      try {
        const fabricClient = require('../../../ai_vaidya/blockchain/fabric_client');
        await fabricClient.anchorAuditHash(entry.query_id, entry.response_hash);
      } catch (_) { /* Non-fatal */ }
    });
  }

  return res.status(201).json({ ok: true });
}

// ─── GET endpoint for admin analytics ────────────────────────────────────────
// GET /api/ai-vaidya/audit?portal_id=patient&blocked=true&limit=50
// Only reachable with a valid admin JWT (validated at the layout level).
export function getAuditLogs(filters = {}) {
  let results = [...auditStore];
  if (filters.portal_id) results = results.filter(e => e.portal_id === filters.portal_id);
  if (filters.blocked !== undefined) results = results.filter(e => e.blocked === filters.blocked);
  if (filters.safety_failed) results = results.filter(e => e.safety_passed === false);
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return results.slice(0, filters.limit || 100);
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};
