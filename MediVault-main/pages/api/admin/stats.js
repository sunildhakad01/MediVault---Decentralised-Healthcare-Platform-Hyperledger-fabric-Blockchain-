// GET /api/admin/stats
// AUDIT FIX [Step 5]: Missing Next.js API route — AdminDashboard called this but got 404.
// Returns live counts from devDataStore so the admin dashboard shows real registered data.

import { store } from '../../../lib/devAuthStore';
import { getAllDoctors, getAllHospitals } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Count users by type from devAuthStore
  const users = [...store.users.values()];
  const totalPatients  = users.filter(u => u.userType === 'patient').length;
  const totalDoctors   = users.filter(u => u.userType === 'doctor').length;
  const totalAdmins    = users.filter(u => u.userType === 'admin').length;

  const doctors   = getAllDoctors();
  const hospitals = getAllHospitals();

  return res.status(200).json({
    success: true,
    data: {
      totalDoctors:       Math.max(totalDoctors, doctors.length),
      approvedDoctors:    doctors.filter(d => d.isApproved).length,
      pendingDoctors:     doctors.filter(d => !d.isApproved).length,
      totalPatients,
      totalHospitals:     hospitals.length,
      pendingHospitals:   hospitals.filter(h => !h.isApproved && h.status === 'pending').length,
      totalAppointments:  0,
      activeMedicines:    0,
      totalMedicines:     0,
      activeAppointments: 0,
    },
  });
}
