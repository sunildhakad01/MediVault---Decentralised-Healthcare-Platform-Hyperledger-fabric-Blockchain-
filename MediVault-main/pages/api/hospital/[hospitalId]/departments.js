// GET  /api/hospital/[hospitalId]/departments — list departments
// POST /api/hospital/[hospitalId]/departments — create department
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard departments section called these and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalDepartments) {
  globalThis.__mvHospitalDepartments = new Map();
}
const deptStore = globalThis.__mvHospitalDepartments;

function getDepts(hospitalId) {
  if (!deptStore.has(hospitalId)) deptStore.set(hospitalId, []);
  return deptStore.get(hospitalId);
}

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: getDepts(hospitalId) });
  }

  if (req.method === 'POST') {
    const { name, description, headDoctorId, dailyCapacity, defaultSlotMinutes } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Department name is required' });

    const dept = {
      id: `DEPT-${Date.now()}`,
      hospitalId,
      name: name.trim(),
      description: description || '',
      headDoctorId: headDoctorId || null,
      dailyCapacity: dailyCapacity || 20,
      defaultSlotMinutes: defaultSlotMinutes || 20,
      createdAt: new Date().toISOString(),
    };

    getDepts(hospitalId).push(dept);
    return res.status(201).json({ success: true, data: dept, message: 'Department created' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
