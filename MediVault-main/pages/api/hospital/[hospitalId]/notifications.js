// GET  /api/hospital/[hospitalId]/notifications      — list notifications
// PUT  /api/hospital/[hospitalId]/notifications/read-all  — mark all read
// POST /api/hospital/[hospitalId]/notifications/send      — send to patients
// AUDIT FIX [Step 7]: Missing routes — HospitalDashboard notifications section 404'd.

import { verifyJWT } from '../../../../lib/devAuthStore';

// Per-hospital notification store (in-memory, survives HMR via globalThis)
if (!globalThis.__mvHospitalNotifications) {
  globalThis.__mvHospitalNotifications = new Map();
}
const notifStore = globalThis.__mvHospitalNotifications;

function getHospitalNotifs(hospitalId) {
  if (!notifStore.has(hospitalId)) notifStore.set(hospitalId, []);
  return notifStore.get(hospitalId);
}

export default function handler(req, res) {
  const { hospitalId } = req.query;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  // GET list
  if (req.method === 'GET') {
    const notifs = getHospitalNotifs(hospitalId);
    const unread = notifs.filter(n => !n.read).length;
    const limit = parseInt(req.query.limit) || 50;
    return res.status(200).json({ success: true, data: notifs.slice(0, limit), unread });
  }

  // PUT mark-all-read (path: /notifications when method=PUT with no extra segment)
  if (req.method === 'PUT') {
    const notifs = getHospitalNotifs(hospitalId);
    notifs.forEach(n => { n.read = true; });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  }

  // POST send-to-patients
  if (req.method === 'POST') {
    const { title, body, channels, audience } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
    const notifs = getHospitalNotifs(hospitalId);
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

  return res.status(405).json({ error: 'Method not allowed' });
}
