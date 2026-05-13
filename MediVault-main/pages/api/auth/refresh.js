// POST /api/auth/refresh
// Issues a new JWT using a valid refresh token.
// Returns { jwt }.

import { refreshAccessToken } from '../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken is required' });
  }

  try {
    const { jwt } = refreshAccessToken(String(refreshToken));
    return res.status(200).json({ jwt });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}
