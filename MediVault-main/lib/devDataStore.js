// lib/devDataStore.js — JSON-file-backed store
// Data loads from data/store.json on startup and saves on every write.
// Survives server restarts. HMR-safe via globalThis.

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'store.json');

function randomId(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ── Load from file → Map ───────────────────────────────────────────────────────

function _loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw  = fs.readFileSync(DATA_FILE, 'utf8');
      const json = JSON.parse(raw);
      console.log('[MediVault] Loaded store from data/store.json');
      return {
        doctors:       new Map(Object.entries(json.doctors       || {})),
        patients:      new Map(Object.entries(json.patients      || {})),
        hospitals:     new Map(Object.entries(json.hospitals     || {})),
        appointments:  new Map(Object.entries(json.appointments  || {})),
        prescriptions: new Map(Object.entries(json.prescriptions || {})),
        sequences:     new Map(Object.entries(json.sequences     || {})),
      };
    }
  } catch (e) {
    console.error('[MediVault] Failed to load store.json:', e.message);
  }
  return {
    doctors:       new Map(),
    patients:      new Map(),
    hospitals:     new Map(),
    appointments:  new Map(),
    prescriptions: new Map(),
    sequences:     new Map(),
  };
}

// ── Save to file ───────────────────────────────────────────────────────────────

function _saveToFile() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const json = {
      doctors:       Object.fromEntries(store.doctors),
      patients:      Object.fromEntries(store.patients),
      hospitals:     Object.fromEntries(store.hospitals),
      appointments:  Object.fromEntries(store.appointments),
      prescriptions: Object.fromEntries(store.prescriptions),
      sequences:     Object.fromEntries(store.sequences),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), 'utf8');
  } catch (e) {
    console.error('[MediVault] Failed to save store.json:', e.message);
  }
}

// ── Init store — load from file first time, reuse globalThis on HMR ───────────

if (!globalThis.__mvStore) {
  globalThis.__mvStore = _loadFromFile();
}
const store = globalThis.__mvStore;

function nextId(name) {
  const n = (store.sequences.get(name) || 0) + 1;
  store.sequences.set(name, n);
  return n;
}

// ── Doctors ───────────────────────────────────────────────────────────────────

function createDoctor(data) {
  const id = `DOC${String(nextId('doctor')).padStart(4, '0')}`;
  const doc = {
    id,
    userId:               data.userId || null,
    fullName:             data.fullName || data.full_name || '',
    email:                data.email || '',
    phone:                data.phone || '',
    specialization:       data.specialization || '',
    degree:               data.degree || '',
    medicalCouncilRegNo:  data.medicalCouncilRegNo || data.medical_council_registration_number || '',
    medicalCouncil:       data.medicalCouncil || data.medical_council || '',
    experienceYears:      Number(data.experienceYears || 0),
    consultationFee:      Number(data.consultationFee || 0),
    languagesSpoken:      data.languagesSpoken || [],
    bio:                  data.bio || '',
    hospitalId:           data.hospitalId || null,
    hospitalName:         data.hospitalName || '',
    clinicName:           data.clinicName || '',
    clinicAddress:        data.clinicAddress || '',
    clinicCity:           data.clinicCity || '',
    clinicState:          data.clinicState || '',
    isApproved:           !!(data.isApproved),
    isActive:             data.isActive !== false,
    appointmentCount:     0,
    successfulTreatmentCount: 0,
    source:               data.source || 'self',
    createdAt:            new Date().toISOString(),
  };
  store.doctors.set(id, doc);
  _saveToFile();
  console.log(`[MediVault] Doctor created: ${id} — ${doc.fullName}`);
  return _formatDoctor(doc);
}

function getDoctorById(id) {
  const doc = store.doctors.get(id);
  return doc ? _formatDoctor(doc) : null;
}

function getDoctorByUserId(userId) {
  for (const doc of store.doctors.values()) {
    if (doc.userId === userId) return _formatDoctor(doc);
  }
  return null;
}

function getAllDoctors({ approved, limit = 200 } = {}) {
  let list = [...store.doctors.values()];
  if (approved !== undefined) list = list.filter(d => d.isApproved === approved);
  return list.slice(0, limit).map(_formatDoctor);
}

function updateDoctor(id, updates) {
  const doc = store.doctors.get(id);
  if (!doc) return null;
  Object.assign(doc, _cleanUpdates(updates));
  _saveToFile();
  return _formatDoctor(doc);
}

function _formatDoctor(doc) {
  let status = 'pending_hospital';
  if (doc.isApproved && doc.isActive)    status = 'approved';
  else if (doc.isApproved && !doc.isActive) status = 'inactive';
  else if (!doc.isApproved && doc.isActive === false) status = 'rejected';
  return { ...doc, status };
}

// ── Patients ──────────────────────────────────────────────────────────────────

function createPatient(data) {
  const id = `PAT${String(nextId('patient')).padStart(4, '0')}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  const pat = {
    id,
    userId:           data.userId || null,
    fullName:         data.fullName || data.full_name || '',
    email:            data.email || '',
    phone:            data.phone || data.mobile || '',
    dob:              data.dob || '',
    gender:           data.gender || '',
    bloodGroup:       data.bloodGroup || data.blood_group || '',
    address:          data.address || '',
    city:             data.city || '',
    state:            data.state || '',
    pincode:          data.pincode || '',
    aadhaarLast4:     data.aadhaarLast4 || '',
    emergencyContact: data.emergencyContact || {},
    isActive:         true,
    createdAt:        new Date().toISOString(),
  };
  store.patients.set(id, pat);
  _saveToFile();
  console.log(`[MediVault] Patient created: ${id} — ${pat.fullName}`);
  return { ...pat };
}

function getPatientById(id) {
  const p = store.patients.get(id);
  return p ? { ...p } : null;
}

function getPatientByUserId(userId) {
  for (const p of store.patients.values()) {
    if (p.userId === userId) return { ...p };
  }
  return null;
}

function updatePatient(id, updates) {
  const p = store.patients.get(id);
  if (!p) return null;
  Object.assign(p, _cleanUpdates(updates));
  _saveToFile();
  return { ...p };
}

// ── Hospitals ─────────────────────────────────────────────────────────────────

function createHospital(data) {
  const id = `HOSP${String(nextId('hospital')).padStart(4, '0')}`;
  const h = {
    id,
    name:               data.name || '',
    hospitalType:       data.hospitalType || '',
    registrationNumber: data.registrationNumber || '',
    email:              data.email || '',
    phone:              data.phone || '',
    addressLine1:       data.addressLine1 || '',
    addressLine2:       data.addressLine2 || '',
    city:               data.city || '',
    state:              data.state || '',
    pincode:            data.pincode || '',
    adminUserId:        data.adminUserId || null,
    adminName:          data.adminName || '',
    adminEmail:         data.adminEmail || '',
    documents:          data.documents || [],
    status:             'pending',
    isApproved:         false,
    submittedAt:        new Date().toISOString(),
    createdAt:          new Date().toISOString(),
  };
  store.hospitals.set(id, h);
  _saveToFile();
  console.log(`[MediVault] Hospital created: ${id} — ${h.name}`);
  return _formatHospital(h);
}

function getHospitalById(id) {
  const h = store.hospitals.get(id);
  return h ? _formatHospital(h) : null;
}

function getAllHospitals() {
  return [...store.hospitals.values()].map(_formatHospital);
}

function updateHospital(id, updates) {
  const h = store.hospitals.get(id);
  if (!h) return null;
  Object.assign(h, _cleanUpdates(updates));
  _saveToFile();
  return _formatHospital(h);
}

function _formatHospital(h) {
  return {
    ...h,
    address: {
      line1:   h.addressLine1 || '',
      line2:   h.addressLine2 || '',
      city:    h.city || '',
      state:   h.state || '',
      pincode: h.pincode || '',
    },
  };
}

// ── Appointments ──────────────────────────────────────────────────────────────

function createAppointment(data) {
  const id       = `APPT-${Date.now()}-${randomId(3)}`;
  const timeSlot = data.timeSlot || {};
  const appt = {
    id,
    doctorId:      data.doctorId || '',
    patientId:     data.patientId || '',
    patientName:   data.patientName || '',
    patientPhone:  data.patientPhone || '',
    patientEmail:  data.patientEmail || '',
    date:          data.date || data.appointmentDate || new Date().toISOString().slice(0, 10),
    timeSlotStart: data.from || timeSlot.start || '09:00',
    timeSlotEnd:   data.to   || timeSlot.end   || '09:30',
    tokenNumber:   nextId('appointment'),
    reason:        data.reason    || '',
    condition:     data.condition || '',
    message:       data.message   || '',
    status:        data.status    || 'scheduled',
    createdAt:     new Date().toISOString(),
  };
  store.appointments.set(id, appt);
  _saveToFile();
  return _formatAppointment(appt);
}

function getAppointmentsByDoctorId(doctorId, filters = {}) {
  let list = [...store.appointments.values()].filter(a => a.doctorId === doctorId);
  if (filters.date) list = list.filter(a => a.date === filters.date);
  if (filters.status) {
    const statuses = filters.status.split(',').map(s => s.trim());
    list = list.filter(a => statuses.includes(a.status));
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(_formatAppointment);
}

function getAppointmentsByPatientId(patientId) {
  return [...store.appointments.values()]
    .filter(a => a.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(_formatAppointment);
}

function updateAppointmentStatus(id, status, extra = {}) {
  const appt = store.appointments.get(id);
  if (!appt) return null;
  Object.assign(appt, { status, ...extra });
  _saveToFile();
  return _formatAppointment(appt);
}

function updateConsultationNote(id, note) {
  const appt = store.appointments.get(id);
  if (!appt) return null;
  appt.consultationNote = note;
  appt.fabricTxId = `FABRIC-${randomId(8)}`;
  _saveToFile();
  return _formatAppointment(appt);
}

function _formatAppointment(a) {
  return {
    ...a,
    _id:             a.id,
    appointmentDate: a.date,
    from:            a.timeSlotStart,
    to:              a.timeSlotEnd,
    timeSlot:        { start: a.timeSlotStart, end: a.timeSlotEnd },
  };
}

// ── Prescriptions ─────────────────────────────────────────────────────────────

function createPrescription(data) {
  const id = `RX-${Date.now()}-${randomId(3)}`;
  const rx = {
    id,
    patientId:           data.patientId || '',
    patientName:         data.patientName || '',
    patientAge:          data.patientAge || '',
    patientGender:       data.patientGender || '',
    patientBlood:        data.patientBlood || '',
    doctorId:            data.doctorId || '',
    appointmentId:       data.appointmentId || null,
    medicines:           data.medicines || [],
    diagnosis:           data.diagnosis || '',
    notes:               data.notes || data.specialInstructions || '',
    followUpDate:        data.followUpDate || null,
    createdAt:           new Date().toISOString(),
    date:                new Date().toISOString().slice(0, 10),
  };
  store.prescriptions.set(id, rx);
  _saveToFile();
  console.log(`[MediVault] Prescription created: ${id} for patient ${rx.patientId}`);
  return rx;
}

function getPrescriptionsByPatientId(patientId) {
  return [...store.prescriptions.values()]
    .filter(rx => rx.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getPrescriptionsByDoctorId(doctorId) {
  return [...store.prescriptions.values()]
    .filter(rx => rx.doctorId === doctorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getPrescriptionById(id) {
  return store.prescriptions.get(id) || null;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function _cleanUpdates(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

module.exports = {
  createDoctor, getDoctorById, getDoctorByUserId, getAllDoctors, updateDoctor,
  createPatient, getPatientById, getPatientByUserId, updatePatient,
  createHospital, getHospitalById, getAllHospitals, updateHospital,
  createAppointment, getAppointmentsByDoctorId, getAppointmentsByPatientId,
  updateAppointmentStatus, updateConsultationNote,
  createPrescription, getPrescriptionsByPatientId, getPrescriptionsByDoctorId, getPrescriptionById,
};
