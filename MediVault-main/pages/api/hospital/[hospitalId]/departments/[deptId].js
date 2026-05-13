// PUT    /api/hospital/[hospitalId]/departments/[deptId] — update department
// DELETE /api/hospital/[hospitalId]/departments/[deptId] — remove department
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard department edit/delete called these and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalDepartments) {
  globalThis.__mvHospitalDepartments = new Map();
}
const deptStore = globalThis.__mvHospitalDepartments;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, deptId } = req.query;
  const depts = deptStore.get(hospitalId) || [];
  const idx = depts.findIndex(d => d.id === deptId);
  if (idx === -1) return res.status(404).json({ error: 'Department not found' });

  if (req.method === 'PUT') {
    const updates = req.body || {};
    Object.assign(depts[idx], updates, { updatedAt: new Date().toISOString() });
    return res.status(200).json({ success: true, data: depts[idx] });
  }

  if (req.method === 'DELETE') {
    const [removed] = depts.splice(idx, 1);
    return res.status(200).json({ success: true, data: removed, message: 'Department removed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
