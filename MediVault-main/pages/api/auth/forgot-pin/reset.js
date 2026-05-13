// POST /api/auth/forgot-pin/reset
// Resets the user's PIN using a valid reset token (Bearer).
// Returns { ok: true }.

import { resetPin } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const resetToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!resetToken) {
    return res.status(401).json({ message: 'Reset token required in Authorization header' });
  }

  const { newPin, pinLength } = req.body || {};

  if (!newPin) {
    return res.status(400).json({ message: 'newPin is required' });
  }

  const length = Number(pinLength) || 6;
  if (!/^\d+$/.test(String(newPin)) || String(newPin).length !== length) {
    return res.status(400).json({ message: `PIN must be exactly ${length} digits` });
  }

  try {
    resetPin(resetToken, newPin, length);
    return res.status(200).json({ ok: true, message: 'PIN reset successfully' });
  } catch (err) {
    const status = err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
}
