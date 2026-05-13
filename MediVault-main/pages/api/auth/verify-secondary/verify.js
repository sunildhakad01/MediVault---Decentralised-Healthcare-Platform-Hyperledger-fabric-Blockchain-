// POST /api/auth/verify-secondary/verify
// Verifies OTP for secondary contact.

import { verifyRegistrationOTP } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sessionId, otp } = req.body || {};
  if (!sessionId || !otp) {
    return res.status(400).json({ message: 'sessionId and otp are required' });
  }

  try {
    const result = verifyRegistrationOTP(sessionId, otp);
    return res.status(200).json({ verified: true, tempToken: result.tempToken });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
