// GET  /api/patient/profile  — get own profile
// POST /api/patient/profile  — create/update own profile

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId, createPatient, updatePatient } from '../../../lib/devDataStore';

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const patient = getPatientByUserId(authUser.userId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }
    return res.status(200).json({ success: true, data: patient });
  }

  // ── POST — create or update ───────────────────────────────────────────────
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const existing = getPatientByUserId(authUser.userId);
    const data = { ...req.body, userId: authUser.userId };

    if (existing) {
      const updated = updatePatient(existing.id, data);
      return res.status(200).json({ success: true, data: updated });
    }

    const patient = createPatient(data);
    return res.status(201).json({ success: true, data: patient });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
