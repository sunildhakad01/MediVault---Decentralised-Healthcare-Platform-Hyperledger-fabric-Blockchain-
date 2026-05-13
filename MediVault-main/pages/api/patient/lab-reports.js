// GET /api/patient/lab-reports — list lab reports for authenticated patient
// AUDIT FIX [Step 8]: Was a stub returning []. Now backed by per-patient in-memory store.
// Lab reports are added via /lab/reports routes; this is the patient-facing read endpoint.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../lib/devDataStore';

if (!globalThis.__mvPatientLabReports) {
  globalThis.__mvPatientLabReports = new Map(); // patientId → LabReport[]
}
const labStore = globalThis.__mvPatientLabReports;

export { labStore as __patientLabReportStore };

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  const reports = (labStore.get(patientId) || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return res.status(200).json({ success: true, data: reports });
}
