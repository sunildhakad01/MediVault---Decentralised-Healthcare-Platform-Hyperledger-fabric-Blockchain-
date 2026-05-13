// POST /api/prescriptions — create a prescription (doctor-side)
// AUDIT FIX [Step 10]: Missing route — DoctorPrescribeMedicine.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';
import { updateConsultationNote } from '../../../lib/devDataStore';

if (!globalThis.__mvPrescriptions) {
  globalThis.__mvPrescriptions = new Map(); // prescriptionId → Prescription
}
const rxStore = globalThis.__mvPrescriptions;

// Per-patient index for fast lookup
if (!globalThis.__mvPrescriptionsByPatient) {
  globalThis.__mvPrescriptionsByPatient = new Map(); // patientId → prescriptionId[]
}
const rxByPatient = globalThis.__mvPrescriptionsByPatient;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const {
    appointmentId, patientId, doctorId,
    diagnosis, medicines, notes, followUpDate,
    vitals, icdCodes,
  } = req.body || {};

  if (!patientId || !medicines?.length) {
    return res.status(400).json({ error: 'patientId and at least one medicine are required' });
  }

  const rxId = `RX-${Date.now()}`;
  const prescription = {
    id: rxId,
    appointmentId: appointmentId || null,
    patientId,
    doctorId: doctorId || authUser.id,
    diagnosis: diagnosis || '',
    medicines,
    notes: notes || '',
    followUpDate: followUpDate || null,
    vitals: vitals || {},
    icdCodes: icdCodes || [],
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };

  rxStore.set(rxId, prescription);

  if (!rxByPatient.has(patientId)) rxByPatient.set(patientId, []);
  rxByPatient.get(patientId).unshift(rxId);

  // Also persist into appointment's consultationNote if linked
  if (appointmentId) {
    updateConsultationNote(appointmentId, {
      medicines,
      diagnosis: diagnosis || '',
      notes: notes || '',
      createdAt: prescription.createdAt,
    });
  }

  // Make prescription visible in patient lab reports store (via __mvPatientPrescriptions)
  if (!globalThis.__mvPatientPrescriptions) globalThis.__mvPatientPrescriptions = new Map();
  if (!globalThis.__mvPatientPrescriptions.has(patientId)) globalThis.__mvPatientPrescriptions.set(patientId, []);
  globalThis.__mvPatientPrescriptions.get(patientId).unshift(prescription);

  return res.status(201).json({ success: true, data: prescription, message: 'Prescription created' });
}
