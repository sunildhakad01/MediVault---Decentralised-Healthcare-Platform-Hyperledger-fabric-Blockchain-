// GET  /api/patient/[patientId]/profile
// POST /api/patient/[patientId]/profile — save patient profile

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getPatientById, createPatient, updatePatient, getPatientByUserId } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { patientId } = req.query;

  if (req.method === 'GET') {
    const patient = getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    return res.status(200).json({ success: true, data: patient });
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let patient = getPatientById(patientId);
    if (!patient) {
      patient = getPatientByUserId(authUser.userId);
    }
    if (patient) {
      const updated = updatePatient(patient.id, req.body);
      return res.status(200).json({ success: true, data: updated });
    }
    const created = createPatient({ ...req.body, userId: authUser.userId });
    return res.status(201).json({ success: true, data: created });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
