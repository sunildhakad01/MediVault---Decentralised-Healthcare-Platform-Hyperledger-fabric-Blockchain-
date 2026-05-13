// POST /api/auth/forgot-pin/verify-otp
// Validates the forgot-pin OTP.
// Returns { resetToken }.

import { verifyForgotPinOTP } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sessionId, otp } = req.body || {};

  if (!sessionId || !otp) {
    return res.status(400).json({ message: 'sessionId and otp are required' });
  }

  if (!/^\d{6}$/.test(String(otp).trim())) {
    return res.status(400).json({ message: 'OTP must be a 6-digit number' });
  }

  try {
    const { resetToken } = verifyForgotPinOTP(sessionId, otp);
    return res.status(200).json({ resetToken });
  } catch (err) {
    const status = err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
}
