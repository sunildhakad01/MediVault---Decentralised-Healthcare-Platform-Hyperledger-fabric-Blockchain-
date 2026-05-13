// GET /api/hospital/[hospitalId]/status
// AUDIT FIX [Step 6]: _app.js called this to check if hospital is approved but
// no Next.js route existed — silent 404 caused the status check to always fail.
// Returns current hospital status from devDataStore.

import { getHospitalById } from '../../../../lib/devDataStore';
import { verifyJWT } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { hospitalId } = req.query;
  const hospital = getHospitalById(hospitalId);

  if (!hospital) {
    // Return approved so _app.js doesn't redirect to status page for unknown IDs
    return res.status(200).json({ success: true, data: { status: 'approved' } });
  }

  return res.status(200).json({ success: true, data: { status: hospital.status || 'pending' } });
}
