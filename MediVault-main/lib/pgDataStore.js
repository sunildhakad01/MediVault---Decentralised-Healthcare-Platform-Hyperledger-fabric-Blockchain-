// lib/pgDataStore.js — PostgreSQL-backed store, drop-in replacement for devDataStore.js
// All exported function signatures are identical to devDataStore.js

const { query } = require('./db');

// ── Sequences ─────────────────────────────────────────────────────────────────

async function nextId(name) {
  const res = await query(
    `INSERT INTO sequences (name, value) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET value = sequences.value + 1
     RETURNING value`,
    [name]
  );
  return res.rows[0].value;
}

// ── Doctors ───────────────────────────────────────────────────────────────────

async function createDoctor(data) {
  const n = await nextId('doctor');
  const id = `DOC${String(n).padStart(4, '0')}`;
  await query(
    `INSERT INTO doctors (
      id, user_id, full_name, email, phone, specialization, degree,
      medical_council_reg_no, medical_council, experience_years, consultation_fee,
      languages_spoken, bio, hospital_id, hospital_name, clinic_name,
      clinic_address, clinic_city, clinic_state, is_approved, is_active,
      appointment_count, successful_treatment_count, source
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
    [
      id,
      data.userId || null,
      data.fullName || data.full_name || '',
      data.email || '',
      data.phone || '',
      data.specialization || '',
      data.degree || '',
      data.medicalCouncilRegNo || data.medical_council_registration_number || '',
      data.medicalCouncil || data.medical_council || '',
      Number(data.experienceYears || 0),
      Number(data.consultationFee || 0),
      JSON.stringify(data.languagesSpoken || []),
      data.bio || '',
      data.hospitalId || null,
      data.hospitalName || '',
      data.clinicName || '',
      data.clinicAddress || '',
      data.clinicCity || '',
      data.clinicState || '',
      !!(data.isApproved),
      data.isActive !== false,
      0,
      0,
      data.source || 'self',
    ]
  );
  console.log(`[MediVault] Doctor created: ${id} — ${data.fullName || ''}`);
  return getDoctorById(id);
}

async function getDoctorById(id) {
  const res = await query('SELECT * FROM doctors WHERE id = $1', [id]);
  return res.rows[0] ? _formatDoctor(res.rows[0]) : null;
}

async function getDoctorByUserId(userId) {
  const res = await query('SELECT * FROM doctors WHERE user_id = $1 LIMIT 1', [userId]);
  return res.rows[0] ? _formatDoctor(res.rows[0]) : null;
}

async function getAllDoctors({ approved, limit = 200 } = {}) {
  let sql = 'SELECT * FROM doctors';
  const params = [];
  if (approved !== undefined) {
    sql += ' WHERE is_approved = $1';
    params.push(approved);
  }
  sql += ` LIMIT ${Number(limit)}`;
  const res = await query(sql, params);
  return res.rows.map(_formatDoctor);
}

async function updateDoctor(id, updates) {
  const fields = _buildUpdateFields(updates, {
    fullName: 'full_name', email: 'email', phone: 'phone',
    specialization: 'specialization', degree: 'degree',
    medicalCouncilRegNo: 'medical_council_reg_no', medicalCouncil: 'medical_council',
    experienceYears: 'experience_years', consultationFee: 'consultation_fee',
    languagesSpoken: 'languages_spoken', bio: 'bio',
    hospitalId: 'hospital_id', hospitalName: 'hospital_name',
    clinicName: 'clinic_name', clinicAddress: 'clinic_address',
    clinicCity: 'clinic_city', clinicState: 'clinic_state',
    isApproved: 'is_approved', isActive: 'is_active',
    appointmentCount: 'appointment_count',
    successfulTreatmentCount: 'successful_treatment_count',
  });
  if (!fields.setClauses.length) return getDoctorById(id);
  const res = await query(
    `UPDATE doctors SET ${fields.setClauses.join(', ')} WHERE id = $${fields.params.length + 1} RETURNING *`,
    [...fields.params, id]
  );
  return res.rows[0] ? _formatDoctor(res.rows[0]) : null;
}

function _formatDoctor(row) {
  const doc = {
    id:                       row.id,
    userId:                   row.user_id,
    fullName:                 row.full_name,
    email:                    row.email,
    phone:                    row.phone,
    specialization:           row.specialization,
    degree:                   row.degree,
    medicalCouncilRegNo:      row.medical_council_reg_no,
    medicalCouncil:           row.medical_council,
    experienceYears:          row.experience_years,
    consultationFee:          Number(row.consultation_fee),
    languagesSpoken:          row.languages_spoken || [],
    bio:                      row.bio,
    hospitalId:               row.hospital_id,
    hospitalName:             row.hospital_name,
    clinicName:               row.clinic_name,
    clinicAddress:            row.clinic_address,
    clinicCity:               row.clinic_city,
    clinicState:              row.clinic_state,
    isApproved:               row.is_approved,
    isActive:                 row.is_active,
    appointmentCount:         row.appointment_count,
    successfulTreatmentCount: row.successful_treatment_count,
    source:                   row.source,
    createdAt:                row.created_at,
  };
  let status = 'pending_hospital';
  if (doc.isApproved && doc.isActive)           status = 'approved';
  else if (doc.isApproved && !doc.isActive)     status = 'inactive';
  else if (!doc.isApproved && doc.isActive === false) status = 'rejected';
  return { ...doc, status };
}

// ── Patients ──────────────────────────────────────────────────────────────────

async function createPatient(data) {
  const n = await nextId('patient');
  const id = `PAT${String(n).padStart(4, '0')}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  await query(
    `INSERT INTO patients (
      id, user_id, full_name, email, phone, dob, gender, blood_group,
      address, city, state, pincode, aadhaar_last4, emergency_contact
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      data.userId || null,
      data.fullName || data.full_name || '',
      data.email || '',
      data.phone || data.mobile || '',
      data.dob || '',
      data.gender || '',
      data.bloodGroup || data.blood_group || '',
      data.address || '',
      data.city || '',
      data.state || '',
      data.pincode || '',
      data.aadhaarLast4 || '',
      JSON.stringify(data.emergencyContact || {}),
    ]
  );
  console.log(`[MediVault] Patient created: ${id} — ${data.fullName || ''}`);
  return getPatientById(id);
}

async function getPatientById(id) {
  const res = await query('SELECT * FROM patients WHERE id = $1', [id]);
  return res.rows[0] ? _formatPatient(res.rows[0]) : null;
}

async function getPatientByUserId(userId) {
  const res = await query('SELECT * FROM patients WHERE user_id = $1 LIMIT 1', [userId]);
  return res.rows[0] ? _formatPatient(res.rows[0]) : null;
}

async function updatePatient(id, updates) {
  const fields = _buildUpdateFields(updates, {
    fullName: 'full_name', email: 'email', phone: 'phone', dob: 'dob',
    gender: 'gender', bloodGroup: 'blood_group', address: 'address',
    city: 'city', state: 'state', pincode: 'pincode',
    aadhaarLast4: 'aadhaar_last4', emergencyContact: 'emergency_contact',
    isActive: 'is_active',
  });
  if (!fields.setClauses.length) return getPatientById(id);
  const res = await query(
    `UPDATE patients SET ${fields.setClauses.join(', ')} WHERE id = $${fields.params.length + 1} RETURNING *`,
    [...fields.params, id]
  );
  return res.rows[0] ? _formatPatient(res.rows[0]) : null;
}

function _formatPatient(row) {
  return {
    id:               row.id,
    userId:           row.user_id,
    fullName:         row.full_name,
    email:            row.email,
    phone:            row.phone,
    dob:              row.dob,
    gender:           row.gender,
    bloodGroup:       row.blood_group,
    address:          row.address,
    city:             row.city,
    state:            row.state,
    pincode:          row.pincode,
    aadhaarLast4:     row.aadhaar_last4,
    emergencyContact: row.emergency_contact || {},
    isActive:         row.is_active,
    createdAt:        row.created_at,
  };
}

// ── Hospitals ─────────────────────────────────────────────────────────────────

async function createHospital(data) {
  const n = await nextId('hospital');
  const id = `HOSP${String(n).padStart(4, '0')}`;
  await query(
    `INSERT INTO hospitals (
      id, name, hospital_type, registration_number, email, phone,
      address_line1, address_line2, city, state, pincode,
      admin_user_id, admin_name, admin_email, documents
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      id,
      data.name || '',
      data.hospitalType || '',
      data.registrationNumber || '',
      data.email || '',
      data.phone || '',
      data.addressLine1 || '',
      data.addressLine2 || '',
      data.city || '',
      data.state || '',
      data.pincode || '',
      data.adminUserId || null,
      data.adminName || '',
      data.adminEmail || '',
      JSON.stringify(data.documents || []),
    ]
  );
  console.log(`[MediVault] Hospital created: ${id} — ${data.name || ''}`);
  return getHospitalById(id);
}

async function getHospitalById(id) {
  const res = await query('SELECT * FROM hospitals WHERE id = $1', [id]);
  return res.rows[0] ? _formatHospital(res.rows[0]) : null;
}

async function getAllHospitals() {
  const res = await query('SELECT * FROM hospitals ORDER BY created_at DESC');
  return res.rows.map(_formatHospital);
}

async function updateHospital(id, updates) {
  const fields = _buildUpdateFields(updates, {
    name: 'name', hospitalType: 'hospital_type', registrationNumber: 'registration_number',
    email: 'email', phone: 'phone', addressLine1: 'address_line1', addressLine2: 'address_line2',
    city: 'city', state: 'state', pincode: 'pincode',
    adminUserId: 'admin_user_id', adminName: 'admin_name', adminEmail: 'admin_email',
    documents: 'documents', status: 'status', isApproved: 'is_approved',
  });
  if (!fields.setClauses.length) return getHospitalById(id);
  const res = await query(
    `UPDATE hospitals SET ${fields.setClauses.join(', ')} WHERE id = $${fields.params.length + 1} RETURNING *`,
    [...fields.params, id]
  );
  return res.rows[0] ? _formatHospital(res.rows[0]) : null;
}

function _formatHospital(row) {
  return {
    id:                 row.id,
    name:               row.name,
    hospitalType:       row.hospital_type,
    registrationNumber: row.registration_number,
    email:              row.email,
    phone:              row.phone,
    addressLine1:       row.address_line1,
    addressLine2:       row.address_line2,
    city:               row.city,
    state:              row.state,
    pincode:            row.pincode,
    adminUserId:        row.admin_user_id,
    adminName:          row.admin_name,
    adminEmail:         row.admin_email,
    documents:          row.documents || [],
    status:             row.status,
    isApproved:         row.is_approved,
    submittedAt:        row.submitted_at,
    createdAt:          row.created_at,
    address: {
      line1:   row.address_line1 || '',
      line2:   row.address_line2 || '',
      city:    row.city || '',
      state:   row.state || '',
      pincode: row.pincode || '',
    },
  };
}

// ── Appointments ──────────────────────────────────────────────────────────────

async function createAppointment(data) {
  const n = await nextId('appointment');
  const id = `APPT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timeSlot = data.timeSlot || {};
  await query(
    `INSERT INTO appointments (
      id, doctor_id, patient_id, patient_name, patient_phone, patient_email,
      date, time_slot_start, time_slot_end, token_number,
      reason, condition, message, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      data.doctorId || '',
      data.patientId || '',
      data.patientName || '',
      data.patientPhone || '',
      data.patientEmail || '',
      data.date || data.appointmentDate || new Date().toISOString().slice(0, 10),
      data.from || timeSlot.start || '09:00',
      data.to || timeSlot.end || '09:30',
      n,
      data.reason || '',
      data.condition || '',
      data.message || '',
      data.status || 'scheduled',
    ]
  );
  return getAppointmentById(id);
}

async function getAppointmentById(id) {
  const res = await query('SELECT * FROM appointments WHERE id = $1', [id]);
  return res.rows[0] ? _formatAppointment(res.rows[0]) : null;
}

async function getAppointmentsByDoctorId(doctorId, filters = {}) {
  let sql = 'SELECT * FROM appointments WHERE doctor_id = $1';
  const params = [doctorId];
  if (filters.date) {
    sql += ` AND date = $${params.length + 1}`;
    params.push(filters.date);
  }
  if (filters.status) {
    const statuses = filters.status.split(',').map(s => s.trim());
    sql += ` AND status = ANY($${params.length + 1})`;
    params.push(statuses);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return res.rows.map(_formatAppointment);
}

async function getAppointmentsByPatientId(patientId) {
  const res = await query(
    'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY created_at DESC',
    [patientId]
  );
  return res.rows.map(_formatAppointment);
}

async function updateAppointmentStatus(id, status, extra = {}) {
  const fields = _buildUpdateFields({ status, ...extra }, {
    status: 'status', consultationNote: 'consultation_note', fabricTxId: 'fabric_tx_id',
  });
  if (!fields.setClauses.length) return getAppointmentById(id);
  const res = await query(
    `UPDATE appointments SET ${fields.setClauses.join(', ')} WHERE id = $${fields.params.length + 1} RETURNING *`,
    [...fields.params, id]
  );
  return res.rows[0] ? _formatAppointment(res.rows[0]) : null;
}

async function updateConsultationNote(id, note) {
  const fabricTxId = `FABRIC-${Math.random().toString(36).slice(2, 18)}`;
  const res = await query(
    'UPDATE appointments SET consultation_note = $1, fabric_tx_id = $2 WHERE id = $3 RETURNING *',
    [note, fabricTxId, id]
  );
  return res.rows[0] ? _formatAppointment(res.rows[0]) : null;
}

function _formatAppointment(row) {
  return {
    id:               row.id,
    _id:              row.id,
    doctorId:         row.doctor_id,
    patientId:        row.patient_id,
    patientName:      row.patient_name,
    patientPhone:     row.patient_phone,
    patientEmail:     row.patient_email,
    date:             row.date,
    appointmentDate:  row.date,
    timeSlotStart:    row.time_slot_start,
    timeSlotEnd:      row.time_slot_end,
    from:             row.time_slot_start,
    to:               row.time_slot_end,
    timeSlot:         { start: row.time_slot_start, end: row.time_slot_end },
    tokenNumber:      row.token_number,
    reason:           row.reason,
    condition:        row.condition,
    message:          row.message,
    status:           row.status,
    consultationNote: row.consultation_note,
    fabricTxId:       row.fabric_tx_id,
    createdAt:        row.created_at,
  };
}

// ── Prescriptions ─────────────────────────────────────────────────────────────

async function createPrescription(data) {
  const id = `RX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await query(
    `INSERT INTO prescriptions (
      id, patient_id, patient_name, patient_age, patient_gender, patient_blood,
      doctor_id, appointment_id, medicines, diagnosis, notes, follow_up_date, date
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      id,
      data.patientId || '',
      data.patientName || '',
      data.patientAge || '',
      data.patientGender || '',
      data.patientBlood || '',
      data.doctorId || '',
      data.appointmentId || null,
      JSON.stringify(data.medicines || []),
      data.diagnosis || '',
      data.notes || data.specialInstructions || '',
      data.followUpDate || null,
      new Date().toISOString().slice(0, 10),
    ]
  );
  console.log(`[MediVault] Prescription created: ${id} for patient ${data.patientId}`);
  return getPrescriptionById(id);
}

async function getPrescriptionsByPatientId(patientId) {
  const res = await query(
    'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC',
    [patientId]
  );
  return res.rows.map(_formatPrescription);
}

async function getPrescriptionsByDoctorId(doctorId) {
  const res = await query(
    'SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY created_at DESC',
    [doctorId]
  );
  return res.rows.map(_formatPrescription);
}

async function getPrescriptionById(id) {
  const res = await query('SELECT * FROM prescriptions WHERE id = $1', [id]);
  return res.rows[0] ? _formatPrescription(res.rows[0]) : null;
}

function _formatPrescription(row) {
  return {
    id:            row.id,
    patientId:     row.patient_id,
    patientName:   row.patient_name,
    patientAge:    row.patient_age,
    patientGender: row.patient_gender,
    patientBlood:  row.patient_blood,
    doctorId:      row.doctor_id,
    appointmentId: row.appointment_id,
    medicines:     row.medicines || [],
    diagnosis:     row.diagnosis,
    notes:         row.notes,
    followUpDate:  row.follow_up_date,
    date:          row.date,
    createdAt:     row.created_at,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function _buildUpdateFields(updates, fieldMap) {
  const setClauses = [];
  const params = [];
  for (const [jsKey, sqlCol] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      params.push(
        typeof updates[jsKey] === 'object' && updates[jsKey] !== null && !Array.isArray(updates[jsKey])
          ? JSON.stringify(updates[jsKey])
          : Array.isArray(updates[jsKey])
          ? JSON.stringify(updates[jsKey])
          : updates[jsKey]
      );
      setClauses.push(`${sqlCol} = $${params.length}`);
    }
  }
  return { setClauses, params };
}

module.exports = {
  createDoctor, getDoctorById, getDoctorByUserId, getAllDoctors, updateDoctor,
  createPatient, getPatientById, getPatientByUserId, updatePatient,
  createHospital, getHospitalById, getAllHospitals, updateHospital,
  createAppointment, getAppointmentsByDoctorId, getAppointmentsByPatientId,
  updateAppointmentStatus, updateConsultationNote,
  createPrescription, getPrescriptionsByPatientId, getPrescriptionsByDoctorId, getPrescriptionById,
};
