// POST /api/hospital/[hospitalId]/appointments/walk-in — create walk-in appointment
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard walk-in modal called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalAppointments) {
  globalThis.__mvHospitalAppointments = new Map();
}
const apptStore = globalThis.__mvHospitalAppointments;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const { patientName, patientId, doctorId, appointmentDate, slotStart, type } = req.body || {};

  if (!patientName || !doctorId || !appointmentDate || !slotStart) {
    return res.status(400).json({ error: 'patientName, doctorId, appointmentDate, and slotStart are required' });
  }

  if (!apptStore.has(hospitalId)) apptStore.set(hospitalId, []);
  const appts = apptStore.get(hospitalId);

  const appt = {
    id: `APPT-${Date.now()}`,
    hospitalId,
    patientId: patientId || `WALKIN-${Date.now()}`,
    patientName,
    doctorId,
    date: appointmentDate,
    from: slotStart,
    to: slotStart,
    status: 'walk_in',
    type: type || 'walk_in',
    createdAt: new Date().toISOString(),
  };

  appts.unshift(appt);

  return res.status(201).json({ success: true, data: appt, message: 'Walk-in appointment created' });
}
