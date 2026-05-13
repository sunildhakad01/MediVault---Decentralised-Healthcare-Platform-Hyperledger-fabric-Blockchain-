// PUT /api/auth/change-pin — change PIN or password for authenticated user
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard settings section called this and got 404.

import { verifyJWT, loginWithPassword, loginWithPin } from '../../../lib/devAuthStore';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { currentPin, newPin, currentPassword, newPassword } = req.body || {};

  // Support both PIN change (patients/doctors) and password change (hospital admins)
  if (newPassword) {
    // Hospital admin password change
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // Verify current password
    const loginResult = loginWithPassword(authUser.email, currentPassword);
    if (!loginResult) return res.status(401).json({ error: 'Current password is incorrect' });

    // Update password — find user in store and update
    if (globalThis.__mvDevStore?.users) {
      const user = [...globalThis.__mvDevStore.users.values()].find(u => u.id === authUser.id);
      if (user) {
        // Store new password hash (simple SHA-256 style via the store pattern)
        const { createHash } = await import('crypto');
        const salt = user.passwordSalt || user.id;
        user.passwordHash = createHash('sha256').update(newPassword + salt).digest('hex');
      }
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  }

  if (newPin) {
    // Patient/Doctor PIN change
    if (!currentPin || !newPin) return res.status(400).json({ error: 'currentPin and newPin are required' });
    if (!/^\d{4,6}$/.test(newPin)) return res.status(400).json({ error: 'PIN must be 4–6 digits' });

    // Verify current PIN
    const loginResult = loginWithPin(authUser.email, currentPin);
    if (!loginResult) return res.status(401).json({ error: 'Current PIN is incorrect' });

    // Update PIN
    if (globalThis.__mvDevStore?.users) {
      const user = [...globalThis.__mvDevStore.users.values()].find(u => u.id === authUser.id);
      if (user) {
        const { createHash } = await import('crypto');
        const salt = user.pinSalt || user.id;
        user.pinHash = createHash('sha256').update(newPin + salt).digest('hex');
      }
    }

    return res.status(200).json({ success: true, message: 'PIN updated successfully' });
  }

  return res.status(400).json({ error: 'newPin or newPassword is required' });
}
