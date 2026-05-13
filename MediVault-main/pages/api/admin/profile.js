// GET /api/admin/profile    — get admin profile
// PUT /api/admin/profile    — update admin profile
// AUDIT FIX [Step 10]: Missing route — AdminProfile.jsx called these and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvAdminProfiles) {
  globalThis.__mvAdminProfiles = new Map(); // adminId → profile
}
const profileStore = globalThis.__mvAdminProfiles;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const adminId = authUser?.id || session;

  if (req.method === 'GET') {
    const profile = profileStore.get(adminId) || {
      id: adminId,
      fullName: authUser?.fullName || 'Admin',
      email: authUser?.email || '',
      role: 'super_admin',
      photoUrl: null,
    };
    return res.status(200).json({ success: true, data: profile });
  }

  if (req.method === 'PUT') {
    const existing = profileStore.get(adminId) || { id: adminId };
    const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
    profileStore.set(adminId, updated);
    return res.status(200).json({ success: true, data: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
