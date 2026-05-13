// POST /api/auth/register/set-pin
// Accepts a temp token (Bearer) + PIN to finalise account creation.
// Returns { jwt, refreshToken, userId }.

import { createUser } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Temp token must be in the Authorization header
  const authHeader = req.headers.authorization || '';
  const tempToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!tempToken) {
    return res.status(401).json({ message: 'Temp token required' });
  }

  const { pin, pinLength, userType } = req.body || {};

  if (!pin) {
    return res.status(400).json({ message: 'pin is required' });
  }

  const length = Number(pinLength) || 6;
  if (![4, 6].includes(length)) {
    return res.status(400).json({ message: 'pinLength must be 4 or 6' });
  }

  if (!/^\d+$/.test(String(pin)) || String(pin).length !== length) {
    return res.status(400).json({ message: `PIN must be exactly ${length} digits` });
  }

  try {
    const result = createUser(tempToken, pin, length, userType || 'patient');
    return res.status(201).json(result);
  } catch (err) {
    const status = err.message.includes('already exists') ? 409
      : err.message.includes('expired') ? 410
      : 400;
    return res.status(status).json({ message: err.message });
  }
}
