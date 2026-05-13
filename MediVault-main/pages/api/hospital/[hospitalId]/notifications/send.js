// POST /api/hospital/[hospitalId]/notifications/send
// AUDIT FIX [Step 7]: Missing sub-route for send-to-patients action.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalNotifications) {
  globalThis.__mvHospitalNotifications = new Map();
}
const notifStore = globalThis.__mvHospitalNotifications;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const { title, body, channels, audience } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

  if (!notifStore.has(hospitalId)) notifStore.set(hospitalId, []);
  const notifs = notifStore.get(hospitalId);

  const n = {
    id: `NOTIF-${Date.now()}`,
    type: 'system',
    title,
    message: body,
    channels: channels || ['in_app'],
    audience: audience || 'all',
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.unshift(n);

  return res.status(201).json({ success: true, data: n, message: 'Notification sent' });
}
