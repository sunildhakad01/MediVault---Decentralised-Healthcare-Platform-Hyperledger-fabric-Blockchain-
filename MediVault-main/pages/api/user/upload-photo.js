// POST /api/user/upload-photo — upload profile photo
// AUDIT FIX [Step 10]: Missing route — AdminProfile.jsx called this and got 404.
// In dev mode returns a stub URL since IPFS/Pinata is Express-backend-only.

import { verifyJWT } from '../../../lib/devAuthStore';

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  // Dev stub — return a placeholder avatar URL
  const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName || 'User')}&background=0891b2&color=fff&size=256`;

  return res.status(200).json({
    success: true,
    data: { url: placeholderUrl },
    message: 'Photo URL set (dev stub — real upload available via Express backend)',
  });
}
