// GET /api/hospitals — public list of all approved hospitals and clinics

import { getAllHospitals } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const all = getAllHospitals();
  // Show all registered hospitals (not rejected) so patients can see the platform's hospitals
  const visible = all.filter(h => h.status !== 'rejected');

  const data = visible.map(h => ({
    id: h.id,
    name: h.name,
    hospitalType: h.hospitalType || '',
    city: h.city || '',
    state: h.state || '',
    phone: h.phone || '',
    addressLine1: h.addressLine1 || '',
    isApproved: h.isApproved || false,
    status: h.status || 'pending',
  }));

  return res.status(200).json({ success: true, data });
}
