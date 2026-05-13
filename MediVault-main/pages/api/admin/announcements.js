// GET  /api/admin/announcements — list system announcements
// POST /api/admin/announcements — create announcement
// AUDIT FIX [Step 10]: Missing route — AdminAnnouncements.jsx called these and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvAdminAnnouncements) {
  globalThis.__mvAdminAnnouncements = [];
}
const annStore = globalThis.__mvAdminAnnouncements;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: [...annStore].reverse() });
  }

  if (req.method === 'POST') {
    const { title, body, type, audience, expiresAt } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

    const ann = {
      id: `ANN-${Date.now()}`,
      title,
      body,
      type: type || 'info',
      audience: audience || 'all',
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
      createdBy: authUser?.id || 'admin',
    };
    annStore.push(ann);
    return res.status(201).json({ success: true, data: ann, message: 'Announcement created' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
