// POST /api/auth/register/initiate
// Generates a 6-digit OTP and prints it to the server terminal.
// Returns { sessionId, expiresIn } to the client.

import { createRegistrationSession } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { contactMethod, contactValue } = req.body || {};

  if (!contactMethod || !contactValue) {
    return res.status(400).json({ message: 'contactMethod and contactValue are required' });
  }

  const method = String(contactMethod).toLowerCase();
  if (!['email', 'mobile'].includes(method)) {
    return res.status(400).json({ message: 'contactMethod must be "email" or "mobile"' });
  }

  const value = String(contactValue).trim();
  if (!value) {
    return res.status(400).json({ message: 'contactValue cannot be empty' });
  }

  // Basic email validation
  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  // Basic mobile validation (accepts +91XXXXXXXXXX or 10-digit numbers)
  if (method === 'mobile' && !/^\+?[0-9]{10,15}$/.test(value.replace(/\s/g, ''))) {
    return res.status(400).json({ message: 'Invalid mobile number' });
  }

  try {
    const { sessionId } = createRegistrationSession(method, value);
    return res.status(200).json({ sessionId, expiresIn: 600 });
  } catch (err) {
    console.error('[register/initiate]', err.message);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
}
