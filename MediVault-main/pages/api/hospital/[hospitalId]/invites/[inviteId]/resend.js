// POST /api/hospital/[hospitalId]/invites/[inviteId]/resend — resend doctor invitation
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard resend invite called this and got 404.

import { verifyJWT } from '../../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalInvites) {
  globalThis.__mvHospitalInvites = new Map();
}
const inviteStore = globalThis.__mvHospitalInvites;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, inviteId } = req.query;
  const invites = inviteStore.get(hospitalId) || [];
  const invite = invites.find(i => i.id === inviteId);
  if (!invite) return res.status(404).json({ error: 'Invite not found' });

  invite.status = 'pending';
  invite.resentAt = new Date().toISOString();
  invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return res.status(200).json({ success: true, data: invite, message: 'Invite resent' });
}
