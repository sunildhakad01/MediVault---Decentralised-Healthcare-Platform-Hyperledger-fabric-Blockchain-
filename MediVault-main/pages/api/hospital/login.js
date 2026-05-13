// POST /api/hospital/login
// Authenticates a hospital admin by email + PIN.

import { loginWithPin, issueTokens } from '../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, pin } = req.body || {};

  if (!email || !pin) {
    return res.status(400).json({ message: 'Email and PIN are required' });
  }

  try {
    const user = loginWithPin(String(email), String(pin));
    if (user.userType !== 'hospital_admin' && user.userType !== 'hospital') {
      return res.status(403).json({ message: 'This login is for hospital administrators only' });
    }
    const { jwt, refreshToken } = issueTokens(user.userId, user.userType);
    return res.status(200).json({
      jwt,
      refreshToken,
      user: {
        userId:       user.userId,
        userType:     user.userType,
        contactValue: user.contactValue,
        name:         user.name,
        hospital:     user.hospital,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}
