// GET /api/doctor/search/available
// Returns list of available (approved) doctors.

import { verifyJWT } from '../../../../lib/devAuthStore';
import { getAllDoctors, getHospitalById } from '../../../../lib/devDataStore';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth optional — public listing
  const token = (req.headers.authorization || '').replace('Bearer ', '');

  const { specialization, name, city, limit = 50 } = req.query;
  let doctors = getAllDoctors({ limit: Number(limit) });

  if (specialization) {
    doctors = doctors.filter(d =>
      d.specialization?.toLowerCase().includes(specialization.toLowerCase())
    );
  }

  if (name) {
    const nameLower = name.toLowerCase();
    doctors = doctors.filter(d =>
      d.fullName?.toLowerCase().includes(nameLower) ||
      d.degree?.toLowerCase().includes(nameLower)
    );
  }

  if (city) {
    const cityLower = city.toLowerCase();
    doctors = doctors.filter(d =>
      d.clinicCity?.toLowerCase().includes(cityLower)
    );
  }

  // Shape data to match what DoctorsList / useFabricAPI expect
  const shaped = doctors.map(d => {
    // For hospital-registered doctors, look up hospital name/city when clinic fields are empty
    let clinicName = d.clinicName || '';
    let clinicCity = d.clinicCity || '';
    let hospitalName = d.hospitalName || '';
    let verifiedBy = d.isApproved ? 'Platform' : null;

    if (d.hospitalId) {
      const hospital = getHospitalById(d.hospitalId);
      if (hospital) {
        if (!clinicName) clinicName = hospital.name || '';
        if (!clinicCity) clinicCity = hospital.city || '';
        if (!hospitalName) hospitalName = hospital.name || '';
        verifiedBy = d.isApproved ? 'Platform' : null;
      }
    }

    const displayName = d.fullName || d.name || '';

    return {
      id: d.id,
      accountAddress: `0x${d.id.padEnd(40, '0')}`,
      IPFS_URL: null,
      isApproved: d.isApproved,
      appointmentCount: d.appointmentCount,
      successfulTreatmentCount: d.successfulTreatmentCount,
      fullName: displayName,
      name: displayName,
      specialization: d.specialization,
      degree: d.degree,
      experienceYears: d.experienceYears,
      experience: d.experienceYears,
      consultationFee: d.consultationFee,
      phone: d.phone,
      email: d.email,
      bio: d.bio,
      languagesSpoken: d.languagesSpoken,
      hospitalId: d.hospitalId,
      hospitalName,
      clinicName,
      clinicCity,
      clinicAddress: d.clinicAddress || '',
      profilePhoto: d.profilePhoto || null,
      verifiedBy,
    };
  });

  return res.status(200).json({ success: true, data: shaped });
}
