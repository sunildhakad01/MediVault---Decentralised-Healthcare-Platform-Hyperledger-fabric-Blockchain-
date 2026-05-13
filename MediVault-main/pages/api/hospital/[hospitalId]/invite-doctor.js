// POST /api/hospital/[hospitalId]/invite-doctor — send doctor invitation
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard invite doctor flow called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalInvites) {
  globalThis.__mvHospitalInvites = new Map();
}
const inviteStore = globalThis.__mvHospitalInvites;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const { fullName, email, phone, department, designation, consultationFee, message } = req.body || {};

  if (!fullName || !email || !phone || !department || !designation || !consultationFee) {
    return res.status(400).json({ error: 'fullName, email, phone, department, designation, and consultationFee are required' });
  }

  if (!inviteStore.has(hospitalId)) inviteStore.set(hospitalId, []);
  const invites = inviteStore.get(hospitalId);

  const invite = {
    id: `INV-${Date.now()}`,
    hospitalId,
    fullName,
    email,
    phone,
    department,
    designation,
    consultationFee,
    message: message || '',
    status: 'pending',
    token: Math.random().toString(36).slice(2),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  invites.unshift(invite);
  return res.status(201).json({ success: true, data: invite, message: 'Invitation sent successfully' });
}
