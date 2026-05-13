// POST /api/auth/verify-secondary/confirm
// Verifies OTP for secondary contact during patient profile registration.
// Alias of /verify — PatientRegistration.jsx calls this endpoint.

import { verifyRegistrationOTP } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sessionId, otp, contactValue } = req.body || {};
  if (!sessionId || !otp) {
    return res.status(400).json({ message: 'sessionId and otp are required' });
  }

  try {
    const result = verifyRegistrationOTP(sessionId, otp);
    return res.status(200).json({ verified: true, tempToken: result.tempToken, contactValue });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
