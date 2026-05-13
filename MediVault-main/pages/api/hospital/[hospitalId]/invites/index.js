// GET /api/hospital/[hospitalId]/invites — list sent doctor invitations
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard invite list called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalInvites) {
  globalThis.__mvHospitalInvites = new Map();
}
const inviteStore = globalThis.__mvHospitalInvites;

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const invites = inviteStore.get(hospitalId) || [];

  return res.status(200).json({ success: true, data: invites });
}
