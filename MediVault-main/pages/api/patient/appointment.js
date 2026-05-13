// POST /api/patient/appointment
// Books an appointment for the patient with a doctor.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId, createAppointment } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.userId);
  const { doctorId, date, timeSlot, from, to, reason, condition, message } = req.body || {};

  if (!doctorId) return res.status(400).json({ error: 'doctorId is required' });

  const appt = createAppointment({
    doctorId,
    patientId: patient?.id || authUser.userId,
    patientName: patient?.fullName || '',
    patientPhone: patient?.phone || '',
    patientEmail: patient?.email || authUser.contactValue || '',
    date,
    timeSlot,
    from,
    to,
    reason,
    condition,
    message,
  });

  return res.status(201).json({ success: true, data: appt, message: 'Appointment booked successfully' });
}
