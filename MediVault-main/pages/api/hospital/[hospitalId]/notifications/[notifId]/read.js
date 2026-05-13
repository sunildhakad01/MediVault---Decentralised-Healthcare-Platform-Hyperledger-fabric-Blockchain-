// PUT /api/hospital/[hospitalId]/notifications/[notifId]/read
// AUDIT FIX [Step 7]: Missing single-notification read route.

import { verifyJWT } from '../../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalNotifications) {
  globalThis.__mvHospitalNotifications = new Map();
}
const notifStore = globalThis.__mvHospitalNotifications;

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, notifId } = req.query;
  const notifs = notifStore.get(hospitalId) || [];
  const notif = notifs.find(n => n.id === notifId);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  notif.read = true;
  return res.status(200).json({ success: true, data: notif });
}
