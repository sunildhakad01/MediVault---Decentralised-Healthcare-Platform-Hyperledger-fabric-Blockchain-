// GET /api/auth/verify
// Checks if the JWT in the Authorization header is valid.
// Returns { valid: true, user } or { valid: false }.

import { verifyJWT } from '../../../lib/devAuthStore';

export default function handler(req, res) {
  // Accept both GET (session restore) and POST (manual check)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  const user = verifyJWT(token);
  if (!user) {
    return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }

  return res.status(200).json({ valid: true, user });
}
