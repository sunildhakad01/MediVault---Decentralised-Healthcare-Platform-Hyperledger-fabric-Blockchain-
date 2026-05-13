// PUT    /api/patient/medication-reminders/[reminderId]/toggle — toggle active status
// DELETE /api/patient/medication-reminders/[reminderId]       — delete reminder
// AUDIT FIX [Step 8]: Missing sub-routes — PatientMedicationReminders.jsx called these and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../../lib/devDataStore';

if (!globalThis.__mvPatientReminders) {
  globalThis.__mvPatientReminders = new Map();
}
const reminderStore = globalThis.__mvPatientReminders;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  const { reminderId } = req.query;
  const reminders = reminderStore.get(patientId) || [];
  const reminder = reminders.find(r => r.id === reminderId);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  if (req.method === 'DELETE') {
    const idx = reminders.indexOf(reminder);
    reminders.splice(idx, 1);
    return res.status(200).json({ success: true, message: 'Reminder deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
