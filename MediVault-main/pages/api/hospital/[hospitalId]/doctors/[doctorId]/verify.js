// PUT /api/hospital/[hospitalId]/doctors/[doctorId]/verify — approve or reject doctor affiliation
// AUDIT FIX [Step 10]: Missing route — HospitalDashboard approve/reject doctor called this and got 404.

import { verifyJWT } from '../../../../../../lib/devAuthStore';
import { getDoctorById, updateDoctor } from '../../../../../../lib/devDataStore';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, doctorId } = req.query;
  const { action, reason } = req.body || {};

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be "approve" or "reject"' });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor || doctor.hospitalId !== hospitalId) {
    return res.status(404).json({ error: 'Doctor not found in this hospital' });
  }

  const updates = action === 'approve'
    ? { isApproved: true }
    : { isApproved: false };

  const updated = await updateDoctor(doctorId, updates);
  return res.status(200).json({ success: true, data: updated });
}
