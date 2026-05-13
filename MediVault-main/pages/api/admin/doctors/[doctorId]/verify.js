// PUT /api/admin/doctors/[doctorId]/verify — approve or reject a doctor (admin-level)
// AUDIT FIX [Step 10]: Missing route — AdminDoctorsManagement.jsx called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';
import { getAllDoctors } from '../../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId } = req.query;
  const { action, reason } = req.body || {};

  if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve | reject | suspend | reinstate' });
  }

  const doctor = getAllDoctors().find(d => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const now = new Date().toISOString();
  if (action === 'approve') {
    doctor.status = 'approved'; doctor.isApproved = true; doctor.approvedAt = now;
  } else if (action === 'reject') {
    doctor.status = 'rejected'; doctor.isApproved = false; doctor.rejectionReason = reason || ''; doctor.rejectedAt = now;
  } else if (action === 'suspend') {
    doctor.status = 'force_suspended'; doctor.suspensionReason = reason || ''; doctor.suspendedAt = now;
  } else if (action === 'reinstate') {
    doctor.status = 'approved'; doctor.isApproved = true; doctor.reinstatedAt = now;
  }

  return res.status(200).json({ success: true, data: doctor });
}
