// PUT /api/hospital/[hospitalId]/notifications/read-all
// AUDIT FIX [Step 7]: Missing sub-route for mark-all-read action.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalNotifications) {
  globalThis.__mvHospitalNotifications = new Map();
}
const notifStore = globalThis.__mvHospitalNotifications;

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const notifs = notifStore.get(hospitalId) || [];
  notifs.forEach(n => { n.read = true; });

  return res.status(200).json({ success: true, message: 'All notifications marked as read' });
}
