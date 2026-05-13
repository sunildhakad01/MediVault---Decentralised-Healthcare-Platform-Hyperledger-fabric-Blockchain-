// POST /api/consultation — save or draft a consultation note
// AUDIT FIX [Step 10]: Missing route — DoctorConsultation.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';
import { updateConsultationNote, updateAppointmentStatus, getPatientById } from '../../../lib/devDataStore';

if (!globalThis.__mvConsultations) {
  globalThis.__mvConsultations = new Map(); // appointmentId → ConsultationNote
}
const consultStore = globalThis.__mvConsultations;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const {
    appointmentId, patientId, doctorId,
    chiefComplaint, diagnosis, notes, medicines,
    labOrders, followUpDate, status,
    vitals, icdCodes,
  } = req.body || {};

  if (!appointmentId) return res.status(400).json({ error: 'appointmentId is required' });

  const consultNote = {
    id: `CONSULT-${appointmentId}`,
    appointmentId,
    patientId: patientId || '',
    doctorId: doctorId || authUser.id,
    chiefComplaint: chiefComplaint || '',
    diagnosis: diagnosis || '',
    notes: notes || '',
    medicines: medicines || [],
    labOrders: labOrders || [],
    followUpDate: followUpDate || null,
    vitals: vitals || {},
    icdCodes: icdCodes || [],
    status: status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  consultStore.set(appointmentId, consultNote);

  // Persist into the appointment's consultationNote field (for prescriptions derivation)
  updateConsultationNote(appointmentId, consultNote);

  // Auto-complete appointment when consultation status is 'completed'
  if (status === 'completed') {
    updateAppointmentStatus(appointmentId, 'completed', {
      completedAt: new Date().toISOString(),
    });
  }

  return res.status(201).json({ success: true, data: consultNote, message: 'Consultation saved' });
}
