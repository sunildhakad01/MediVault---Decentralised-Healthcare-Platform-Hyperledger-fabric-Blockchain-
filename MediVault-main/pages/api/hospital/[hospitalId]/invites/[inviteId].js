// DELETE /api/hospital/[hospitalId]/invites/[inviteId] — cancel an invite
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard cancel invite called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalInvites) {
  globalThis.__mvHospitalInvites = new Map();
}
const inviteStore = globalThis.__mvHospitalInvites;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, inviteId } = req.query;
  const invites = inviteStore.get(hospitalId) || [];
  const invite = invites.find(i => i.id === inviteId);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });

  if (req.method === 'DELETE') {
    invite.status = 'cancelled';
    invite.cancelledAt = new Date().toISOString();
    return res.status(200).json({ success: true, data: invite, message: 'Invite cancelled' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
