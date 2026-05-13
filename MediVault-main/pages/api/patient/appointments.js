// GET  /api/patient/appointments — list patient's appointments
// POST /api/patient/appointments — book a new appointment

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId, getAppointmentsByPatientId, getDoctorById, createAppointment } from '../../../lib/devDataStore';

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.userId);

  // ── POST: book appointment ────────────────────────────────────────────────
  if (req.method === 'POST') {
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

  // ── GET: list appointments ────────────────────────────────────────────────
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const patientId = patient?.id || authUser.userId;

  const appointments = getAppointmentsByPatientId(patientId);

  // Enrich with doctor info
  const enriched = appointments.map(appt => {
    const doctor = appt.doctorId ? getDoctorById(appt.doctorId) : null;
    return {
      ...appt,
      doctor: doctor ? {
        id: doctor.id,
        fullName: doctor.fullName,
        name: doctor.fullName,
        specialization: doctor.specialization,
        degree: doctor.degree,
        phone: doctor.phone,
      } : null,
    };
  });

  return res.status(200).json({ success: true, data: enriched });
}
