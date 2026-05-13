// PUT /api/admin/hospitals/[hospitalId]/verify
// AUDIT FIX [Step 5]: Missing Next.js API route — admin verify/reject action 404'd.
// Updates hospital status in devDataStore.

import { getHospitalById } from '../../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { hospitalId } = req.query;
  const { action, reason } = req.body || {};

  const hospital = getHospitalById(hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  const statusMap = {
    approve:   'approved',
    reject:    'rejected',
    suspend:   'suspended',
    reinstate: 'approved',
  };

  const newStatus = statusMap[action];
  if (!newStatus) return res.status(400).json({ error: 'Invalid action. Use: approve, reject, suspend, reinstate' });

  hospital.status = newStatus;
  hospital.isApproved = newStatus === 'approved';
  if (reason) hospital.verificationNote = reason;
  hospital.verifiedAt = new Date().toISOString();

  return res.status(200).json({ success: true, data: hospital });
}
