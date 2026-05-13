// PUT /api/hospital/staff/[hospitalId]/[staffId] — toggle staff active status
// AUDIT FIX [Step 7]: Missing route for staff status toggle.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalStaff) {
  globalThis.__mvHospitalStaff = new Map();
}
const staffStore = globalThis.__mvHospitalStaff;

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, staffId } = req.query;
  const staff = (staffStore.get(hospitalId) || []).find(s => s.id === staffId);
  if (!staff) return res.status(404).json({ error: 'Staff member not found' });

  const updates = req.body || {};
  Object.assign(staff, updates);

  return res.status(200).json({ success: true, data: staff });
}
