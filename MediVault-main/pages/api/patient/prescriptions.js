// GET /api/patient/prescriptions — list prescriptions for authenticated patient
// AUDIT FIX [Step 8]: Was a stub returning []. Now derives prescriptions from completed
// appointments that have a consultationNote with prescription data in devDataStore.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId, getAppointmentsByPatientId } from '../../../lib/devDataStore';

if (!globalThis.__mvPatientPrescriptions) {
  globalThis.__mvPatientPrescriptions = new Map(); // patientId → Prescription[]
}
const rxStore = globalThis.__mvPatientPrescriptions;

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  // Gather manually added prescriptions from the per-patient store
  const manualRx = rxStore.get(patientId) || [];

  // Derive prescriptions from completed appointments that have consultation notes
  const appts = getAppointmentsByPatientId(patientId);
  const derivedRx = appts
    .filter(a => a.consultationNote?.medicines?.length > 0)
    .map(a => ({
      id: `RX-${a.id}`,
      appointmentId: a.id,
      doctorId: a.doctorId,
      patientId,
      medicines: a.consultationNote.medicines,
      diagnosis: a.consultationNote.diagnosis || '',
      notes: a.consultationNote.notes || '',
      date: a.date,
      createdAt: a.consultationNote.createdAt || a.createdAt,
      fabricTxId: a.fabricTxId || null,
    }));

  const all = [...manualRx, ...derivedRx].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return res.status(200).json({ success: true, data: all });
}
