// GET /api/doctor/by-user/[userId]
// Returns the doctor profile for a given userId.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getDoctorByUserId } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { userId } = req.query;
  const doctor = getDoctorByUserId(userId);

  if (!doctor) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }

  return res.status(200).json({ success: true, data: doctor });
}
