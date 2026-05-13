// PUT /api/doctor/appointments/[appointmentId]/status — update appointment status (doctor-side)
// AUDIT FIX [Step 10]: Missing route — DoctorConsultation and DoctorAppointments called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';
import { updateAppointmentStatus } from '../../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { appointmentId } = req.query;
  const { status, reason } = req.body || {};

  const VALID = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
  if (!status || !VALID.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
  }

  const appt = updateAppointmentStatus(appointmentId, status, {
    statusChangedAt: new Date().toISOString(),
    statusChangedBy: authUser.id,
    cancellationReason: reason || undefined,
  });

  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  return res.status(200).json({ success: true, data: appt });
}
