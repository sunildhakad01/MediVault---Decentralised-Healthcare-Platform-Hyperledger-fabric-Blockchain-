// PUT /api/patient/notifications/read-all — mark all patient notifications as read
// AUDIT FIX [Step 8]: Missing sub-route called by PatientNotifications.jsx.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../../lib/devDataStore';

if (!globalThis.__mvPatientNotifications) {
  globalThis.__mvPatientNotifications = new Map();
}
const notifStore = globalThis.__mvPatientNotifications;

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  const notifs = notifStore.get(patientId) || [];
  notifs.forEach(n => { n.read = true; });

  return res.status(200).json({ success: true, message: 'All notifications marked as read' });
}
