// GET /api/doctor/[doctorId]
// Returns a doctor's profile by doctorId.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getDoctorById } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId } = req.query;
  const doctor = getDoctorById(doctorId);

  if (!doctor) {
    return res.status(404).json({ success: false, error: 'Doctor not found' });
  }

  // Shape to match what DoctorAppointments expects
  return res.status(200).json({
    success: true,
    data: {
      ...doctor,
      name: doctor.fullName,
      experience: doctor.experienceYears,
      qualification: doctor.degree,
      consultationFee: doctor.consultationFee,
      hospitalAffiliation: doctor.clinicName || doctor.hospitalId,
      availableHours: '9:00 AM – 5:00 PM',
    },
  });
}
