// POST /api/hospital/register
// Registers a new hospital and creates the admin user account.

import { createHospitalAdminUser, verifyJWT } from '../../../lib/devAuthStore';
import { createHospital } from '../../../lib/devDataStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name, hospitalType, registrationNumber, licenseNumber, gstin,
    yearEstablished, numberOfBeds, website, specialisations,
    email, phone, altPhone, emergencyPhone,
    addressLine1, addressLine2, city, state, pincode, landmark, googleMapsLink,
    workingHours, emergencyAvailable, documents,
    adminName, adminEmail, adminPhone, adminPin, pinLength,
  } = req.body || {};

  // Basic required fields
  if (!name || !email || !registrationNumber || !adminEmail || !adminPin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Create hospital record
    const hospital = await createHospital({
      name, hospitalType, registrationNumber, licenseNumber, gstin,
      yearEstablished, numberOfBeds, website, specialisations,
      email, phone, altPhone, emergencyPhone,
      addressLine1, addressLine2, city, state, pincode, landmark, googleMapsLink,
      workingHours, emergencyAvailable, documents,
      adminName, adminEmail, adminPhone,
    });

    // 2. Create hospital admin user account (PIN-based)
    const { userId, jwt, refreshToken } = await createHospitalAdminUser(
      adminEmail, adminPin, adminName, hospital.id, pinLength || 6
    );

    // Update hospital with admin user ID
    hospital.adminUserId = userId;

    return res.status(201).json({
      success: true,
      data: {
        id: hospital.id,
        name: hospital.name,
        status: hospital.status,
        adminUserId: userId,
      },
      message: 'Hospital registration submitted for verification',
    });
  } catch (err) {
    const isDuplicate = err.message.includes('already exists');
    return res.status(isDuplicate ? 409 : 500).json({ error: err.message });
  }
}
