// POST /api/hospital/[hospitalId]/doctors/register — register a new doctor under a hospital
// AUDIT FIX [Step 10]: Missing route — HospitalDashboard register doctor form called this and got 404.

import { verifyJWT, createUser, issueTokens } from '../../../../../lib/devAuthStore';
import { createDoctor } from '../../../../../lib/devDataStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { hospitalId } = req.query;
  const {
    fullName, email, phone, gender, dateOfBirth, joiningDate,
    medicalCouncilRegNo, medicalCouncil, degree, specialization,
    experienceYears, consultationFee, languagesSpoken, bio,
    department, designation,
  } = req.body || {};

  if (!fullName || !email || !medicalCouncilRegNo || !specialization) {
    return res.status(400).json({ error: 'fullName, email, medicalCouncilRegNo, and specialization are required' });
  }

  // Create devAuthStore user account for the doctor
  const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
  let userAccount;
  try {
    userAccount = createUser({ fullName, email, phone: phone || '', role: 'doctor', pin: tempPin });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to create user account' });
  }

  // Create doctor profile in devDataStore
  const doctor = createDoctor({
    userId: userAccount.id,
    fullName, email, phone: phone || '', gender: gender || 'Male',
    dateOfBirth: dateOfBirth || '', joiningDate: joiningDate || '',
    medicalCouncilRegNo, medicalCouncil: medicalCouncil || '',
    degree: degree || 'MBBS', specialization,
    experienceYears: experienceYears || 0,
    consultationFee: consultationFee || 0,
    languagesSpoken: languagesSpoken || [],
    bio: bio || '', hospitalId,
    department: department || '', designation: designation || 'Consultant',
    status: 'approved',   // Hospital-registered doctors are pre-approved
    isApproved: true,
    source: 'hospital_direct',
  });

  return res.status(201).json({
    success: true,
    data: { doctor, userId: userAccount.id, tempPin },
    message: 'Doctor registered. Share the temp PIN with them to set their own PIN.',
  });
}
