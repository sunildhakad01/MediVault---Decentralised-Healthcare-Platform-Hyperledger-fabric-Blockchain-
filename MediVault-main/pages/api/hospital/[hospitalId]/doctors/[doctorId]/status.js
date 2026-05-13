// PUT /api/hospital/[hospitalId]/doctors/[doctorId]/status — activate or deactivate a doctor
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard toggle doctor status called this and got 404.

import { verifyJWT } from '../../../../../../lib/devAuthStore';
import { getDoctorById, updateDoctor } from '../../../../../../lib/devDataStore';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, doctorId } = req.query;
  const { isActive } = req.body || {};

  const doctor = await getDoctorById(doctorId);
  if (!doctor || doctor.hospitalId !== hospitalId) {
    return res.status(404).json({ error: 'Doctor not found in this hospital' });
  }

  const updated = await updateDoctor(doctorId, { isApproved: !!isActive });
  return res.status(200).json({ success: true, data: updated });
}
