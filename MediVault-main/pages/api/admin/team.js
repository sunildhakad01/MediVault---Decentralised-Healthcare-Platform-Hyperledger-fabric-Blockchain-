// GET    /api/admin/team           — list admin team members
// POST   /api/admin/team           — add team member
// PUT    /api/admin/team/[id]      — update role (handled in [id].js)
// DELETE /api/admin/team/[id]      — remove member (handled in [id].js)
// AUDIT FIX [Step 10]: Missing route — AdminTeam.jsx called these and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvAdminTeam) {
  globalThis.__mvAdminTeam = new Map(); // memberId → TeamMember
}
const teamStore = globalThis.__mvAdminTeam;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: [...teamStore.values()] });
  }

  if (req.method === 'POST') {
    const { fullName, email, role, phone } = req.body || {};
    if (!fullName || !email || !role) return res.status(400).json({ error: 'fullName, email, and role are required' });

    const member = {
      id: `ADMIN-${Date.now()}`,
      userId: `ADMIN-${Date.now()}`,
      fullName, email, role, phone: phone || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    teamStore.set(member.id, member);
    return res.status(201).json({ success: true, data: member, message: 'Team member added' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
