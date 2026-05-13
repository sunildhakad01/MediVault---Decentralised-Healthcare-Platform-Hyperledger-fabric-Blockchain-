// GET /api/contracts/patient/[patientId]
// Returns patient data from devDataStore (mock blockchain).

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getPatientById } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { patientId } = req.query;
  const patient = getPatientById(patientId);
  if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

  return res.status(200).json({ success: true, data: patient });
}
