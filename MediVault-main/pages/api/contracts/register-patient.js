// POST /api/contracts/register-patient
// Mock blockchain patient registration — stores in devDataStore.

import { verifyJWT } from '../../../lib/devAuthStore';
import { createPatient, getPatientByUserId } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const existing = getPatientByUserId(authUser.userId);
  if (existing) {
    return res.status(200).json({ success: true, data: existing });
  }

  const data = { ...req.body, userId: authUser.userId };
  const patient = createPatient(data);
  return res.status(201).json({ success: true, data: patient });
}
