// POST /api/auth/logout
// Revokes the current JWT so it cannot be reused.

import { revokeToken } from '../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (token) revokeToken(token);

  return res.status(200).json({ ok: true });
}
