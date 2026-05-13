// GET  /api/hospital/staff/[hospitalId] — list hospital staff
// POST /api/hospital/staff/[hospitalId] — add new staff member
// AUDIT FIX [Step 7]: Missing route — HospitalDashboard staff section 404'd.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvHospitalStaff) {
  globalThis.__mvHospitalStaff = new Map();
}
const staffStore = globalThis.__mvHospitalStaff;

function getStaff(hospitalId) {
  if (!staffStore.has(hospitalId)) staffStore.set(hospitalId, []);
  return staffStore.get(hospitalId);
}

export default function handler(req, res) {
  const { hospitalId } = req.query;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: getStaff(hospitalId) });
  }

  if (req.method === 'POST') {
    const { fullName, role, phone, email, department, shiftStart, shiftEnd } = req.body || {};
    if (!fullName || !role) return res.status(400).json({ error: 'fullName and role are required' });

    const member = {
      id: `STAFF-${Date.now()}`,
      hospitalId,
      fullName,
      role,
      phone: phone || '',
      email: email || '',
      department: department || '',
      shiftStart: shiftStart || '09:00',
      shiftEnd: shiftEnd || '17:00',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    getStaff(hospitalId).push(member);
    return res.status(201).json({ success: true, data: member, message: 'Staff member added' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
