// GET /api/admin/doctors — list all doctors (admin view)
// AUDIT FIX [Step 10]: Missing route — AdminDoctorsManagement.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getAllDoctors } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { status, search, type } = req.query;
  let doctors = getAllDoctors();

  if (status) doctors = doctors.filter(d => d.status === status || (status === 'pending' && (d.status === 'pending_hospital' || d.status === 'pending_admin')));
  if (search) {
    const q = search.toLowerCase();
    doctors = doctors.filter(d => d.fullName.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
  }
  // type=individual means independent (no hospitalId)
  if (type === 'individual') doctors = doctors.filter(d => !d.hospitalId);

  return res.status(200).json({ success: true, data: doctors, total: doctors.length });
}
