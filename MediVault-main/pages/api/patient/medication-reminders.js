// GET  /api/patient/medication-reminders — list reminders
// POST /api/patient/medication-reminders — create reminder
// AUDIT FIX [Step 8]: Missing route — PatientMedicationReminders.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../lib/devDataStore';

if (!globalThis.__mvPatientReminders) {
  globalThis.__mvPatientReminders = new Map(); // patientId → Reminder[]
}
const reminderStore = globalThis.__mvPatientReminders;

function getReminders(patientId) {
  if (!reminderStore.has(patientId)) reminderStore.set(patientId, []);
  return reminderStore.get(patientId);
}

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: getReminders(patientId) });
  }

  if (req.method === 'POST') {
    const { medicineName, dosage, frequency, times, startDate, endDate, prescriptionId, notes } = req.body || {};
    if (!medicineName) return res.status(400).json({ error: 'medicineName is required' });

    const reminder = {
      id: `REM-${Date.now()}`,
      patientId,
      medicineName,
      dosage: dosage || '',
      frequency: frequency || 'daily',
      times: times || ['09:00'],
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || null,
      prescriptionId: prescriptionId || null,
      notes: notes || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    getReminders(patientId).unshift(reminder);
    return res.status(201).json({ success: true, data: reminder, message: 'Reminder set' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
