// GET  /api/hospital/[hospitalId]/appointments — list hospital appointments
// POST /api/hospital/[hospitalId]/appointments — create walk-in appointment
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard appointments section 404'd.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { createAppointment } from '../../../../lib/devDataStore';

if (!globalThis.__mvHospitalAppointments) {
  globalThis.__mvHospitalAppointments = new Map();
}
const apptStore = globalThis.__mvHospitalAppointments;

function getHospitalAppts(hospitalId) {
  if (!apptStore.has(hospitalId)) apptStore.set(hospitalId, []);
  return apptStore.get(hospitalId);
}

export default function handler(req, res) {
  const { hospitalId } = req.query;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    const appts = getHospitalAppts(hospitalId);
    const { status } = req.query;
    const filtered = status
      ? appts.filter(a => status.split(',').includes(a.status))
      : appts;
    return res.status(200).json({ success: true, data: filtered });
  }

  if (req.method === 'POST') {
    const { patientId, patientName, doctorId, date, time } = req.body || {};
    if (!doctorId || !date) return res.status(400).json({ error: 'doctorId and date are required' });

    const appt = createAppointment({
      doctorId,
      patientId: patientId || 'walk-in',
      patientName: patientName || 'Walk-in Patient',
      hospitalId,
      date,
      from: time || '09:00',
      to: time || '09:30',
      status: 'scheduled',
    });

    // Also store in hospital-specific store
    const appts = getHospitalAppts(hospitalId);
    appts.unshift(appt);

    return res.status(201).json({ success: true, data: appt, message: 'Appointment created' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
