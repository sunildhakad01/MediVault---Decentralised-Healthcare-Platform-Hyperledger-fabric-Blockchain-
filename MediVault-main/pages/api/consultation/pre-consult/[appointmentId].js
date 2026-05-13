// GET /api/consultation/pre-consult/[appointmentId] — get pre-consultation data for doctor
// AUDIT FIX [Step 10]: Missing route — DoctorConsultation.jsx called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getPatientById } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { appointmentId } = req.query;

  // Find the appointment from the global store
  const { __mvDataStore: ds } = globalThis;
  const appt = ds?.appointments?.get(appointmentId);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const patient = appt.patientId ? getPatientById(appt.patientId) : null;

  // Return pre-consultation context: patient profile + recent appointments + prior consultation notes
  const patientAppts = ds?.appointments
    ? [...ds.appointments.values()]
        .filter(a => a.patientId === appt.patientId && a.id !== appointmentId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    : [];

  return res.status(200).json({
    success: true,
    data: {
      appointment: appt,
      patient: patient || { id: appt.patientId, fullName: appt.patientName || 'Unknown' },
      priorVisits: patientAppts,
      allergies: patient?.allergies || [],
      chronicConditions: patient?.chronicConditions || [],
      currentMedications: patient?.currentMedications || [],
    },
  });
}
