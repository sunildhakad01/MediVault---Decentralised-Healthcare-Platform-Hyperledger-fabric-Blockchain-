// GET /api/lab/reports/patient/[patientId] — list lab reports for a patient
// AUDIT FIX [Step 10]: Missing route — PatientLabReports.jsx called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvPatientLabReports) {
  globalThis.__mvPatientLabReports = new Map(); // patientId → LabReport[]
}
const labStore = globalThis.__mvPatientLabReports;

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { patientId } = req.query;
  const reports = (labStore.get(patientId) || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return res.status(200).json({ success: true, data: reports });
}
