// PUT    /api/admin/team/[id] — update team member role
// DELETE /api/admin/team/[id] — remove team member
// AUDIT FIX [Step 10]: Missing route — AdminTeam.jsx called these and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvAdminTeam) {
  globalThis.__mvAdminTeam = new Map();
}
const teamStore = globalThis.__mvAdminTeam;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { id } = req.query;
  const member = teamStore.get(id);
  if (!member) return res.status(404).json({ error: 'Team member not found' });

  if (req.method === 'PUT') {
    Object.assign(member, req.body, { updatedAt: new Date().toISOString() });
    return res.status(200).json({ success: true, data: member });
  }

  if (req.method === 'DELETE') {
    teamStore.delete(id);
    return res.status(200).json({ success: true, message: 'Team member removed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
