// PUT /api/admin/profile/password — change admin password
// AUDIT FIX [Step 10]: Missing route — AdminProfile.jsx called this and got 404.

import { verifyJWT, loginWithPassword } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

  // Verify current password
  const valid = loginWithPassword(authUser.email, currentPassword);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  // Update in devAuthStore
  if (globalThis.__mvDevStore?.users) {
    const user = [...globalThis.__mvDevStore.users.values()].find(u => u.id === authUser.id);
    if (user) {
      const { createHash } = require('crypto');
      const salt = user.passwordSalt || user.id;
      user.passwordHash = createHash('sha256').update(newPassword + salt).digest('hex');
    }
  }

  return res.status(200).json({ success: true, message: 'Password updated' });
}
