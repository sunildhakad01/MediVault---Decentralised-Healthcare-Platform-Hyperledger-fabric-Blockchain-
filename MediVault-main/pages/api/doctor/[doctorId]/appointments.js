// GET  /api/doctor/[doctorId]/appointments  — list appointments
// POST /api/doctor/[doctorId]/appointments  — create appointment

import { verifyJWT } from '../../../../lib/devAuthStore';
import {
  getAppointmentsByDoctorId,
  createAppointment,
  updateAppointmentStatus,
  updateConsultationNote,
  getPatientById,
} from '../../../../lib/devDataStore';

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId } = req.query;

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { date, status } = req.query;
    const filters = {};
    if (date) filters.date = date;
    if (status) filters.status = status;

    const appointments = getAppointmentsByDoctorId(doctorId, filters);

    // Enrich each appointment with patient info
    const enriched = appointments.map(appt => {
      const patient = appt.patientId ? getPatientById(appt.patientId) : null;
      return {
        ...appt,
        patientName: patient?.fullName || appt.patientName || '',
        patientPhone: patient?.phone || appt.patientPhone || '',
        patientEmail: patient?.email || appt.patientEmail || '',
        patient: patient ? {
          id: patient.id,
          fullName: patient.fullName,
          phone: patient.phone,
          email: patient.email,
          dob: patient.dob,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
        } : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      appointments: enriched,
    });
  }

  // ── POST ───────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const appt = createAppointment({ ...body, doctorId });
    return res.status(201).json({ success: true, data: appt });
  }

  // ── PATCH — update status or add consultation note ─────────────────────────
  if (req.method === 'PATCH') {
    const { appointmentId, status, consultationNote } = req.body || {};
    if (!appointmentId) return res.status(400).json({ error: 'appointmentId required' });

    if (consultationNote) {
      const updated = updateConsultationNote(appointmentId, consultationNote);
      return updated
        ? res.status(200).json({ success: true, data: updated })
        : res.status(404).json({ error: 'Appointment not found' });
    }

    if (status) {
      const updated = updateAppointmentStatus(appointmentId, status);
      return updated
        ? res.status(200).json({ success: true, data: updated })
        : res.status(404).json({ error: 'Appointment not found' });
    }

    return res.status(400).json({ error: 'Provide status or consultationNote to update' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
