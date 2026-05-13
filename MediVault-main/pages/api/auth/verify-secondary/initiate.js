// POST /api/auth/verify-secondary/initiate
// Sends an OTP to a secondary contact (used during patient profile registration).

import { createRegistrationSession } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { contactValue } = req.body || {};
  if (!contactValue) {
    return res.status(400).json({ message: 'contactValue is required' });
  }

  const contactMethod = contactValue.includes('@') ? 'email' : 'phone';

  try {
    const { sessionId } = createRegistrationSession(contactMethod, contactValue);
    return res.status(200).json({ sessionId, expiresIn: 600 });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
