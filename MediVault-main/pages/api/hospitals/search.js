// GET /api/hospitals/search?q=<query>
// Public endpoint — returns approved hospitals matching name or registration number.

import { getAllHospitals } from '../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.status(200).json({ success: true, data: [] });

  const all = getAllHospitals();
  // Show all hospitals registered on MediVault (not rejected)
  const available = all.filter(h => h.status !== 'rejected');

  const results = available
    .filter(h =>
      h.name.toLowerCase().includes(q) ||
      (h.registrationNumber || '').toLowerCase().includes(q)
    )
    .slice(0, 10)
    .map(h => ({
      id: h.id,
      name: h.name,
      registrationNumber: h.registrationNumber || '',
      city: h.city || '',
      state: h.state || '',
      hospitalType: h.hospitalType || '',
    }));

  return res.status(200).json({ success: true, data: results });
}
