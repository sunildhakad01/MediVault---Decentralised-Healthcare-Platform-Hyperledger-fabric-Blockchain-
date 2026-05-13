// GET /api/hospital/[hospitalId]       — get hospital profile
// PUT /api/hospital/[hospitalId]       — update hospital profile

import { getHospitalById, updateHospital } from '../../../../lib/devDataStore';
import { verifyJWT } from '../../../../lib/devAuthStore';

export default async function handler(req, res) {
  const { hospitalId } = req.query;

  if (req.method === 'GET') {
    const hospital = await getHospitalById(hospitalId);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    return res.status(200).json({ success: true, data: hospital });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const authUser = verifyJWT(token);
    if (!authUser) return res.status(401).json({ error: 'Authentication required' });

    const allowed = [
      'name', 'hospitalType', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode',
      'phone', 'altPhone', 'emergencyPhone', 'email', 'website', 'gstin',
      'emergencyAvailable', 'yearEstablished', 'numberOfBeds', 'landmark',
      'googleMapsLink', 'specialisations', 'workingHours', 'logoUrl', 'adminName',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await updateHospital(hospitalId, updates);
    if (!updated) return res.status(404).json({ error: 'Hospital not found' });
    return res.status(200).json({ success: true, data: updated, message: 'Profile updated' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
