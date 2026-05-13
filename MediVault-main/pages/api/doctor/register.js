// POST /api/doctor/register
// Registers a new doctor profile.

import { verifyJWT } from '../../../lib/devAuthStore';
import { createDoctor, getDoctorByUserId } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  // Prevent duplicate registration
  const existing = getDoctorByUserId(authUser.userId);
  if (existing) {
    return res.status(200).json({
      success: true,
      data: existing,
      message: 'Doctor profile already exists',
    });
  }

  const data = { ...req.body, userId: authUser.userId };

  if (!data.fullName && !data.full_name) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  try {
    const doctor = createDoctor(data);
    return res.status(201).json({
      success: true,
      data: doctor,
      message: 'Doctor registration submitted for review',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
