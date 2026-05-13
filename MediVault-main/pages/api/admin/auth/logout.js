// POST /api/admin/auth/logout
// AUDIT FIX [Step 5]: Missing Next.js API route — AdminDashboard logout threw on 404.
// Revokes the JWT from devAuthStore (stateless logout — client clears localStorage).

import { revokeToken } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token) revokeToken(token);

  return res.status(200).json({ success: true, message: 'Logged out' });
}
