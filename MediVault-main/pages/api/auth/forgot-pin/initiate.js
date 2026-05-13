// POST /api/auth/forgot-pin/initiate
// Sends a 6-digit OTP to the user's registered contact (printed to terminal).
// Returns { sessionId }.

import { initiateForgotPin } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { identifier } = req.body || {};

  if (!identifier) {
    return res.status(400).json({ message: 'identifier is required' });
  }

  try {
    const { sessionId } = initiateForgotPin(String(identifier));
    return res.status(200).json({ sessionId, expiresIn: 600 });
  } catch (err) {
    // Return 200 even when user not found to prevent account enumeration
    console.warn('[forgot-pin/initiate]', err.message);
    return res.status(200).json({
      sessionId: 'noop',
      expiresIn: 600,
      message: 'If an account exists, an OTP has been sent.',
    });
  }
}
