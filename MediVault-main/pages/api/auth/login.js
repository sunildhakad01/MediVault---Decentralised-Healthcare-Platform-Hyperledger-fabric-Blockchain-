// POST /api/auth/login
// Authenticates a user by identifier + PIN.
// Returns { jwt, refreshToken, user }.

import { loginWithPin, issueTokens } from '../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { identifier, pin } = req.body || {};

  if (!identifier || !pin) {
    return res.status(400).json({ message: 'identifier and pin are required' });
  }

  try {
    const user = loginWithPin(String(identifier), String(pin));
    const { jwt, refreshToken } = issueTokens(user.userId, user.userType);
    return res.status(200).json({
      jwt,
      refreshToken,
      user: {
        userId:       user.userId,
        userType:     user.userType,
        contactValue: user.contactValue,
        // Include hospital so AuthContext sets mv_hospital_id for hospital_admin users
        ...(user.hospital ? { hospital: user.hospital } : {}),
      },
      requires2FA: false,
    });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}
