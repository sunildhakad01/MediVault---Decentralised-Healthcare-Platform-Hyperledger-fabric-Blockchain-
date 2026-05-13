// GET /api/admin/audit-logs — list admin audit log entries
// AUDIT FIX [Step 10]: Missing route — AdminAuditLogs.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvAuditLogs) {
  globalThis.__mvAuditLogs = [];
}
const logStore = globalThis.__mvAuditLogs;

// Helper to append a log entry (used by other routes internally)
export function appendAuditLog(entry) {
  logStore.unshift({ id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...entry, createdAt: new Date().toISOString() });
  if (logStore.length > 500) logStore.splice(500); // Cap at 500 entries
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { action, actorId, targetId, from, to, page = '1', limit = '50' } = req.query;

  let logs = [...logStore];
  if (action) logs = logs.filter(l => l.action?.toLowerCase().includes(action.toLowerCase()));
  if (actorId) logs = logs.filter(l => l.actorId === actorId);
  if (targetId) logs = logs.filter(l => l.targetId === targetId);
  if (from) logs = logs.filter(l => new Date(l.createdAt) >= new Date(from));
  if (to) logs = logs.filter(l => new Date(l.createdAt) <= new Date(to));

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const total = logs.length;
  const paginated = logs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.status(200).json({ success: true, data: paginated, total, page: pageNum, limit: limitNum });
}
