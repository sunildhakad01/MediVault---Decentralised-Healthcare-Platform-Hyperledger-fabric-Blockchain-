// POST /api/patient/register
// Creates or updates a full patient profile after OTP verification.
// Called by PatientRegistration.jsx step 3.

import { verifyJWT } from '../../../lib/devAuthStore';
import { createPatient, getPatientByUserId, updatePatient } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const {
    userId, fullName, phone, email, dob, gender, bloodGroup,
    address, city, state, pincode, aadhaarLast4, emergencyContact,
  } = req.body || {};

  if (!fullName || !dob || !gender) {
    return res.status(400).json({ error: 'fullName, dob, and gender are required' });
  }

  // Use authenticated userId (or fallback to body userId for flexibility)
  const resolvedUserId = authUser.userId || userId;

  // Check if patient profile already exists for this user
  const existing = getPatientByUserId(resolvedUserId);
  if (existing) {
    const updated = updatePatient(existing.id, {
      fullName, phone, email, dob, gender, bloodGroup,
      address, city, state, pincode, aadhaarLast4, emergencyContact,
    });
    // uniquePatientId alias for display in toast
    return res.status(200).json({
      success: true,
      data: { ...updated, uniquePatientId: updated.id },
    });
  }

  // Create new patient profile
  const patient = createPatient({
    userId: resolvedUserId,
    fullName, phone, email, dob, gender, bloodGroup,
    address, city, state, pincode, aadhaarLast4, emergencyContact,
  });

  return res.status(201).json({
    success: true,
    data: { ...patient, uniquePatientId: patient.id },
  });
}
