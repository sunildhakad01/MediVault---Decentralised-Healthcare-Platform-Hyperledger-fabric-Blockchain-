// GET  /api/hospital/[hospitalId]/doctors          — list doctors affiliated with hospital
// POST /api/hospital/[hospitalId]/doctors/register — register a new doctor under hospital
// AUDIT FIX [Step 10]: Missing route — HospitalDashboard doctor management section 404'd.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getAllDoctors, createDoctor } from '../../../../lib/devDataStore';

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId, search, status } = req.query;

  if (req.method === 'GET') {
    let doctors = (await getAllDoctors()).filter(d => d.hospitalId === hospitalId);

    if (search) {
      const q = search.toLowerCase();
      doctors = doctors.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.medicalCouncilRegNo.toLowerCase().includes(q)
      );
    }
    if (status) {
      doctors = doctors.filter(d => d.status === status);
    }

    return res.status(200).json({ success: true, data: doctors });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
