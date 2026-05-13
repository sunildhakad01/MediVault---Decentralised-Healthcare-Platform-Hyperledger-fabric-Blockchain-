// GET /api/patient/notifications     — list patient notifications
// PUT /api/patient/notifications/read-all is handled in read-all.js
// AUDIT FIX [Step 8]: Was a stub returning []. Now backed by per-patient in-memory store.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../lib/devDataStore';

if (!globalThis.__mvPatientNotifications) {
  globalThis.__mvPatientNotifications = new Map(); // patientId → Notification[]
}
const notifStore = globalThis.__mvPatientNotifications;

export { notifStore as __patientNotifStore };

function getNotifs(patientId) {
  if (!notifStore.has(patientId)) {
    // Seed with a welcome notification on first access
    notifStore.set(patientId, [
      {
        id: `PN-WELCOME-${patientId}`,
        type: 'system',
        title: 'Welcome to MediVault',
        message: 'Your health records are safe and accessible anytime.',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
  return notifStore.get(patientId);
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  // Resolve patientId from authenticated user
  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  const notifs = getNotifs(patientId);
  const unread = notifs.filter(n => !n.read).length;

  return res.status(200).json({ success: true, data: notifs, unread });
}
