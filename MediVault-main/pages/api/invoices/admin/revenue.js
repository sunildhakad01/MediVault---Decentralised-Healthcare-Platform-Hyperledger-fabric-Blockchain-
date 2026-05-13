// GET /api/invoices/admin/revenue — aggregate revenue metrics (admin analytics)
// AUDIT FIX [Step 10]: Missing route — AdminAnalytics.jsx and AdminRevenue.jsx called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getAllHospitals, getAllDoctors } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  // In dev mode there's no real billing data — return a realistic-looking stub with zero values
  const hospitals = getAllHospitals();
  const doctors = getAllDoctors();

  const hospitalRevenue = hospitals.map(h => ({
    hospitalId: h.id,
    hospitalName: h.name,
    totalRevenue: 0,
    invoiceCount: 0,
    paidCount: 0,
    pendingCount: 0,
  }));

  const doctorRevenue = doctors.map(d => ({
    doctorId: d.id,
    doctorName: d.fullName,
    totalRevenue: 0,
    consultationCount: 0,
  }));

  return res.status(200).json({
    success: true,
    data: {
      totalRevenue: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      hospitalBreakdown: hospitalRevenue,
      doctorBreakdown: doctorRevenue,
      monthlyTrend: [],
    },
  });
}
