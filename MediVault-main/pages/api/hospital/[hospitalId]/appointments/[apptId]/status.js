// PUT /api/hospital/[hospitalId]/appointments/[apptId]/status — update appointment status
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard appointment section called this and got 404.

import { verifyJWT } from '../../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalAppointments) {
  globalThis.__mvHospitalAppointments = new Map();
}
const apptStore = globalThis.__mvHospitalAppointments;

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, apptId } = req.query;
  const { newStatus, changedBy } = req.body || {};

  const VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'walk_in'];
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({ error: `newStatus must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const appts = apptStore.get(hospitalId) || [];
  const appt = appts.find(a => a.id === apptId);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  appt.status = newStatus;
  appt.statusChangedAt = new Date().toISOString();
  appt.statusChangedBy = changedBy || 'hospital';

  return res.status(200).json({ success: true, data: appt });
}
