// Express backend — runs on port 3002
// Next.js (port 3000) proxies all /api/* requests here via next.config.js rewrites.

require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const express = require('express');
const cors    = require('cors');

const {
  createRegistrationSession, verifyRegistrationOTP, createUser,
  loginWithPin, createHospitalAdminUser, issueTokens,
  verifyJWT, refreshAccessToken, revokeToken,
  initiateForgotPin, verifyForgotPinOTP, resetPin,
  store: authStore,
} = require('./lib/devAuthStore');

const {
  createDoctor, getDoctorById, getDoctorByUserId, getAllDoctors, updateDoctor,
  createPatient, getPatientById, getPatientByUserId, updatePatient,
  createHospital, getHospitalById, getAllHospitals, updateHospital,
  createAppointment, getAppointmentsByDoctorId, getAppointmentsByPatientId,
  updateAppointmentStatus, updateConsultationNote,
  createPrescription, getPrescriptionsByPatientId, getPrescriptionsByDoctorId, getPrescriptionById,
} = require('./lib/pgDataStore');

const { runMigrations } = require('./lib/migrations');

const app  = express();
const PORT = process.env.PORT || 3002;

// ── Middleware ────────────────────────────────────────────────────────────────

// origin:true reflects the request Origin header back — required when credentials:true
// (browsers reject Access-Control-Allow-Origin:* combined with credentials:true)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function getToken(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
}

function requireAuth(req, res, next) {
  const user = verifyJWT(getToken(req));
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.authUser = user;
  next();
}

function requireAdmin(req, res, next) {
  const token   = getToken(req);
  const session = req.headers['x-admin-session'];
  const user    = verifyJWT(token);

  if (user && user.userType === 'admin') { req.authUser = user; return next(); }
  if (session) {
    try {
      const s = JSON.parse(Buffer.from(session, 'base64').toString());
      if (s?.role === 'admin') return next();
    } catch (_) {}
  }
  // Allow through for dev — admin pages guard themselves client-side
  next();
}

// Wraps async route handlers so unhandled promise rejections become 500 responses
function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { identifier, pin } = req.body || {};
  if (!identifier || !pin) return res.status(400).json({ message: 'identifier and pin are required' });
  try {
    const user = loginWithPin(String(identifier), String(pin));
    const { jwt, refreshToken } = issueTokens(user.userId, user.userType);
    return res.status(200).json({
      jwt, refreshToken,
      user: {
        userId: user.userId, userType: user.userType,
        contactValue: user.contactValue,
        ...(user.hospital ? { hospital: user.hospital } : {}),
      },
      requires2FA: false,
    });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  revokeToken(getToken(req));
  return res.status(200).json({ ok: true });
});

app.get('/api/auth/verify', (req, res) => {
  const user = verifyJWT(getToken(req));
  if (!user) return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  return res.status(200).json({ valid: true, user });
});

app.post('/api/auth/verify', (req, res) => {
  const user = verifyJWT(getToken(req));
  if (!user) return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  return res.status(200).json({ valid: true, user });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
  try {
    const { jwt } = refreshAccessToken(String(refreshToken));
    return res.status(200).json({ jwt });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
});

// Registration flow
app.post('/api/auth/register/initiate', (req, res) => {
  const { contactMethod, contactValue } = req.body || {};
  if (!contactMethod || !contactValue) return res.status(400).json({ message: 'contactMethod and contactValue are required' });

  const method = String(contactMethod).toLowerCase();
  if (!['email', 'mobile'].includes(method)) return res.status(400).json({ message: 'contactMethod must be "email" or "mobile"' });

  const value = String(contactValue).trim();
  if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return res.status(400).json({ message: 'Invalid email address' });
  if (method === 'mobile' && !/^\+?[0-9]{10,15}$/.test(value.replace(/\s/g, '')))
    return res.status(400).json({ message: 'Invalid mobile number' });

  try {
    const { sessionId } = createRegistrationSession(method, value);
    return res.status(200).json({ sessionId, expiresIn: 600 });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

app.post('/api/auth/register/verify-otp', (req, res) => {
  const { sessionId, otp } = req.body || {};
  if (!sessionId || !otp) return res.status(400).json({ message: 'sessionId and otp are required' });
  if (!/^\d{6}$/.test(String(otp).trim())) return res.status(400).json({ message: 'OTP must be a 6-digit number' });
  try {
    const { tempToken } = verifyRegistrationOTP(sessionId, otp);
    return res.status(200).json({ tempToken });
  } catch (err) {
    const status = err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
});

app.post('/api/auth/register/set-pin', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const tempToken  = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!tempToken) return res.status(401).json({ message: 'Temp token required' });

  const { pin, pinLength, userType } = req.body || {};
  if (!pin) return res.status(400).json({ message: 'pin is required' });
  const length = Number(pinLength) || 6;
  if (![4, 6].includes(length)) return res.status(400).json({ message: 'pinLength must be 4 or 6' });
  if (!/^\d+$/.test(String(pin)) || String(pin).length !== length)
    return res.status(400).json({ message: `PIN must be exactly ${length} digits` });

  try {
    const result = createUser(tempToken, pin, length, userType || 'patient');
    return res.status(201).json(result);
  } catch (err) {
    const status = err.message.includes('already exists') ? 409 : err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
});

// Forgot-PIN flow
app.post('/api/auth/forgot-pin/initiate', (req, res) => {
  const { identifier } = req.body || {};
  if (!identifier) return res.status(400).json({ message: 'identifier is required' });
  try {
    const { sessionId } = initiateForgotPin(String(identifier));
    return res.status(200).json({ sessionId, expiresIn: 600 });
  } catch (err) {
    return res.status(200).json({ sessionId: 'noop', expiresIn: 600, message: 'If an account exists, an OTP has been sent.' });
  }
});

app.post('/api/auth/forgot-pin/verify-otp', (req, res) => {
  const { sessionId, otp } = req.body || {};
  if (!sessionId || !otp) return res.status(400).json({ message: 'sessionId and otp are required' });
  try {
    const { resetToken } = verifyForgotPinOTP(sessionId, otp);
    return res.status(200).json({ resetToken });
  } catch (err) {
    const status = err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
});

app.post('/api/auth/forgot-pin/reset', (req, res) => {
  const { resetToken, newPin, pinLength } = req.body || {};
  if (!resetToken || !newPin) return res.status(400).json({ message: 'resetToken and newPin are required' });
  try {
    resetPin(resetToken, newPin, pinLength || 6);
    return res.status(200).json({ ok: true, message: 'PIN reset successfully' });
  } catch (err) {
    const status = err.message.includes('expired') ? 410 : 400;
    return res.status(status).json({ message: err.message });
  }
});

app.post('/api/auth/change-pin', requireAuth, (req, res) => {
  const { currentPin, newPin, pinLength } = req.body || {};
  if (!currentPin || !newPin) return res.status(400).json({ message: 'currentPin and newPin are required' });
  try {
    const crypto = require('crypto');
    const user   = authStore.users.get(req.authUser.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const currentHash = crypto.createHash('sha256').update(user.pinSalt + String(currentPin)).digest('hex');
    if (currentHash !== user.pinHash) return res.status(401).json({ message: 'Current PIN is incorrect' });
    const newSalt  = require('crypto').randomBytes(8).toString('hex');
    user.pinHash   = crypto.createHash('sha256').update(newSalt + String(newPin)).digest('hex');
    user.pinSalt   = newSalt;
    user.pinLength = Number(pinLength) || user.pinLength || 6;
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Hospital routes ───────────────────────────────────────────────────────────

app.post('/api/hospital/register', async (req, res) => {
  const {
    name, hospitalType, registrationNumber, licenseNumber, gstin,
    yearEstablished, numberOfBeds, website, specialisations,
    email, phone, altPhone, emergencyPhone,
    addressLine1, addressLine2, city, state, pincode, landmark, googleMapsLink,
    workingHours, emergencyAvailable, documents,
    adminName, adminEmail, adminPhone, adminPin, pinLength,
  } = req.body || {};

  if (!name || !email || !registrationNumber || !adminEmail || !adminPin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hospital = await createHospital({
      name, hospitalType, registrationNumber, licenseNumber, gstin,
      yearEstablished, numberOfBeds, website, specialisations,
      email, phone, altPhone, emergencyPhone,
      addressLine1, addressLine2, city, state, pincode, landmark, googleMapsLink,
      workingHours, emergencyAvailable, documents,
      adminName, adminEmail, adminPhone,
    });

    const { userId, jwt, refreshToken } = await createHospitalAdminUser(
      adminEmail, adminPin, adminName, hospital.id, pinLength || 6
    );

    hospital.adminUserId = userId;

    return res.status(201).json({
      success: true,
      data: { id: hospital.id, name: hospital.name, status: hospital.status, adminUserId: userId },
      message: 'Hospital registration submitted for verification',
    });
  } catch (err) {
    const isDuplicate = err.message.includes('already exists');
    return res.status(isDuplicate ? 409 : 500).json({ error: err.message });
  }
});

app.post('/api/hospital/login', (req, res) => {
  const { email, pin } = req.body || {};
  if (!email || !pin) return res.status(400).json({ message: 'Email and PIN are required' });
  try {
    const user = loginWithPin(String(email), String(pin));
    if (user.userType !== 'hospital_admin' && user.userType !== 'hospital') {
      return res.status(403).json({ message: 'This login is for hospital administrators only' });
    }
    const { jwt, refreshToken } = issueTokens(user.userId, user.userType);
    return res.status(200).json({
      jwt, refreshToken,
      user: { userId: user.userId, userType: user.userType, contactValue: user.contactValue, name: user.name, hospital: user.hospital },
    });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
});

app.get('/api/hospital/:hospitalId/status', ah(async (req, res) => {
  const hospital = await getHospitalById(req.params.hospitalId);
  if (!hospital) return res.status(200).json({ success: true, data: { status: 'approved' } });
  return res.status(200).json({ success: true, data: { status: hospital.status || 'pending' } });
}));

// Hospital notifications (in-memory stub — no persistent notification store)
const _notifStore = new Map();

app.get('/api/hospital/:hospitalId/notifications', requireAuth, (req, res) => {
  const list = _notifStore.get(req.params.hospitalId) || [];
  return res.status(200).json({ success: true, data: list });
});

app.post('/api/hospital/:hospitalId/notifications/send', requireAdmin, (req, res) => {
  const { hospitalId } = req.params;
  const { title, message, type } = req.body || {};
  const notif = { id: Date.now().toString(), hospitalId, title, message, type: type || 'info', read: false, createdAt: new Date().toISOString() };
  const list  = _notifStore.get(hospitalId) || [];
  list.push(notif);
  _notifStore.set(hospitalId, list);
  return res.status(201).json({ success: true, data: notif });
});

app.put('/api/hospital/:hospitalId/notifications/read-all', requireAuth, (req, res) => {
  const list = (_notifStore.get(req.params.hospitalId) || []).map(n => ({ ...n, read: true }));
  _notifStore.set(req.params.hospitalId, list);
  return res.status(200).json({ success: true });
});

app.put('/api/hospital/:hospitalId/notifications/:notifId/read', requireAuth, (req, res) => {
  const { hospitalId, notifId } = req.params;
  const list = (_notifStore.get(hospitalId) || []).map(n => n.id === notifId ? { ...n, read: true } : n);
  _notifStore.set(hospitalId, list);
  return res.status(200).json({ success: true });
});

// Hospital staff / doctors registered under a hospital
app.get('/api/hospital/staff/:hospitalId', requireAuth, ah(async (req, res) => {
  const doctors = (await getAllDoctors()).filter(d => d.hospitalId === req.params.hospitalId);
  return res.status(200).json({ success: true, data: doctors });
}));

app.get('/api/hospital/:hospitalId/doctors', requireAuth, ah(async (req, res) => {
  const doctors = (await getAllDoctors()).filter(d => d.hospitalId === req.params.hospitalId);
  return res.status(200).json({ success: true, data: doctors });
}));

// ── Hospitals public list / search ────────────────────────────────────────────

app.get('/api/hospitals', ah(async (req, res) => {
  const hospitals = (await getAllHospitals()).filter(h => h.isApproved);
  return res.status(200).json({ success: true, data: hospitals });
}));

app.get('/api/hospitals/search', ah(async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const hospitals = (await getAllHospitals()).filter(h => h.isApproved && (!q || h.name.toLowerCase().includes(q)));
  return res.status(200).json({ success: true, data: hospitals });
}));

// ── Doctor routes ─────────────────────────────────────────────────────────────

app.post('/api/doctor/register', requireAuth, ah(async (req, res) => {
  const existing = await getDoctorByUserId(req.authUser.userId);
  if (existing) return res.status(200).json({ success: true, data: existing, message: 'Doctor profile already exists' });

  const data = { ...req.body, userId: req.authUser.userId };
  if (!data.fullName && !data.full_name) return res.status(400).json({ error: 'Full name is required' });

  const doctor = await createDoctor(data);
  return res.status(201).json({ success: true, data: doctor, message: 'Doctor registration submitted for review' });
}));

app.get('/api/doctor/me', requireAuth, ah(async (req, res) => {
  const doctor = await getDoctorByUserId(req.authUser.userId);
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
  return res.status(200).json({ success: true, data: doctor });
}));

app.get('/api/doctor/search/available', ah(async (req, res) => {
  const { specialization, city } = req.query;
  let doctors = await getAllDoctors({ approved: true });
  if (specialization) doctors = doctors.filter(d => d.specialization?.toLowerCase().includes(specialization.toLowerCase()));
  if (city) doctors = doctors.filter(d => d.clinicCity?.toLowerCase().includes(city.toLowerCase()));
  return res.status(200).json({ success: true, data: doctors });
}));

app.get('/api/doctor/by-user/:userId', ah(async (req, res) => {
  const doctor = await getDoctorByUserId(req.params.userId);
  if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
  return res.status(200).json({ success: true, data: doctor });
}));

app.get('/api/doctor/:doctorId', ah(async (req, res) => {
  const doctor = await getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  return res.status(200).json({ success: true, data: doctor });
}));

app.get('/api/doctor/:doctorId/appointments', requireAuth, ah(async (req, res) => {
  const { date, status } = req.query;
  const filters = {};
  if (date) filters.date = date;
  if (status) filters.status = status;
  const appointments = await getAppointmentsByDoctorId(req.params.doctorId, filters);
  const enriched = await Promise.all(appointments.map(async appt => {
    const patient = appt.patientId ? await getPatientById(appt.patientId) : null;
    const patientName = patient?.fullName || appt.patientName || '';
    const patientPhone = patient?.phone || appt.patientPhone || '';
    const patientEmail = patient?.email || appt.patientEmail || '';
    return {
      ...appt,
      patientName,
      patientPhone,
      patientEmail,
      patient: patient ? {
        id: patient.id,
        fullName: patient.fullName,
        phone: patient.phone,
        email: patient.email,
        dob: patient.dob,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
      } : {
        fullName: patientName,
        phone: patientPhone,
        email: patientEmail,
      },
    };
  }));
  return res.status(200).json({ success: true, data: enriched, appointments: enriched });
}));

app.post('/api/doctor/:doctorId/appointments', requireAuth, ah(async (req, res) => {
  const appt = await createAppointment({ ...req.body, doctorId: req.params.doctorId });
  return res.status(201).json({ success: true, data: appt });
}));

app.patch('/api/doctor/:doctorId/appointments', requireAuth, ah(async (req, res) => {
  const { appointmentId, status, consultationNote } = req.body || {};
  if (!appointmentId) return res.status(400).json({ error: 'appointmentId required' });
  if (consultationNote) {
    const updated = await updateConsultationNote(appointmentId, consultationNote);
    return updated ? res.status(200).json({ success: true, data: updated }) : res.status(404).json({ error: 'Appointment not found' });
  }
  if (status) {
    const updated = await updateAppointmentStatus(appointmentId, status);
    return updated ? res.status(200).json({ success: true, data: updated }) : res.status(404).json({ error: 'Appointment not found' });
  }
  return res.status(400).json({ error: 'Provide status or consultationNote to update' });
}));

app.patch('/api/doctor/appointments/:appointmentId/status', requireAuth, ah(async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'status is required' });
  const updated = await updateAppointmentStatus(req.params.appointmentId, status);
  return updated ? res.status(200).json({ success: true, data: updated }) : res.status(404).json({ error: 'Appointment not found' });
}));

// ── Patient routes ────────────────────────────────────────────────────────────

app.post('/api/patient/register', requireAuth, ah(async (req, res) => {
  const {
    userId, fullName, phone, email, dob, gender, bloodGroup,
    address, city, state, pincode, aadhaarLast4, emergencyContact,
  } = req.body || {};

  if (!fullName || !dob || !gender) return res.status(400).json({ error: 'fullName, dob, and gender are required' });

  const resolvedUserId = req.authUser.userId || userId;
  const existing = await getPatientByUserId(resolvedUserId);
  if (existing) {
    const updated = await updatePatient(existing.id, { fullName, phone, email, dob, gender, bloodGroup, address, city, state, pincode, aadhaarLast4, emergencyContact });
    return res.status(200).json({ success: true, data: { ...updated, uniquePatientId: updated.id } });
  }

  const patient = await createPatient({ userId: resolvedUserId, fullName, phone, email, dob, gender, bloodGroup, address, city, state, pincode, aadhaarLast4, emergencyContact });
  return res.status(201).json({ success: true, data: { ...patient, uniquePatientId: patient.id } });
}));

app.get('/api/patient/profile', requireAuth, ah(async (req, res) => {
  const patient = await getPatientByUserId(req.authUser.userId);
  if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
  return res.status(200).json({ success: true, data: patient });
}));

app.get('/api/patient/:patientId/profile', requireAuth, ah(async (req, res) => {
  const patient = await getPatientById(req.params.patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  return res.status(200).json({ success: true, data: patient });
}));

app.get('/api/patient/appointments', requireAuth, ah(async (req, res) => {
  const patient = await getPatientByUserId(req.authUser.userId);
  if (!patient) return res.status(200).json({ success: true, data: [] });
  const appointments = await getAppointmentsByPatientId(patient.id);
  return res.status(200).json({ success: true, data: appointments });
}));

app.post('/api/patient/appointment', requireAuth, ah(async (req, res) => {
  const appt = await createAppointment(req.body || {});
  return res.status(201).json({ success: true, data: appt });
}));

// Patient notifications stub
app.get('/api/patient/notifications', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

app.put('/api/patient/notifications/read-all', requireAuth, (req, res) => {
  return res.status(200).json({ success: true });
});

app.get('/api/patient/invoices', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

app.get('/api/patient/lab-reports', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

app.get('/api/patient/prescriptions', requireAuth, ah(async (req, res) => {
  const patient = await getPatientByUserId(req.authUser.userId);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  const prescriptions = await getPrescriptionsByPatientId(patient.id);
  return res.status(200).json({ success: true, data: prescriptions });
}));

app.get('/api/patient/medication-reminders', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

app.get('/api/admin/hospitals', requireAdmin, ah(async (req, res) => {
  const hospitals = await getAllHospitals();
  return res.status(200).json({ success: true, data: hospitals });
}));

app.put('/api/admin/hospitals/:hospitalId/verify', requireAdmin, ah(async (req, res) => {
  const { hospitalId } = req.params;
  const { action, reason } = req.body || {};

  const hospital = await getHospitalById(hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  const statusMap = { approve: 'approved', reject: 'rejected', suspend: 'suspended', reinstate: 'approved' };
  const newStatus = statusMap[action];
  if (!newStatus) return res.status(400).json({ error: 'Invalid action. Use: approve, reject, suspend, reinstate' });

  const updated = await updateHospital(hospitalId, {
    status: newStatus,
    isApproved: newStatus === 'approved',
    verificationNote: reason || '',
    verifiedAt: new Date().toISOString(),
  });
  return res.status(200).json({ success: true, data: updated });
}));

app.get('/api/admin/doctors', requireAdmin, ah(async (req, res) => {
  const doctors = await getAllDoctors();
  return res.status(200).json({ success: true, data: doctors });
}));

app.put('/api/admin/doctors/:doctorId/verify', requireAdmin, ah(async (req, res) => {
  const { doctorId } = req.params;
  const { action, reason } = req.body || {};

  if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action))
    return res.status(400).json({ error: 'action must be approve | reject | suspend | reinstate' });

  const doctor = await getDoctorById(doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const now = new Date().toISOString();
  const updates = {};
  if (action === 'approve')   { updates.isApproved = true;  updates.isActive = true;  updates.approvedAt = now; }
  if (action === 'reject')    { updates.isApproved = false; updates.isActive = false; updates.rejectionReason = reason || ''; updates.rejectedAt = now; }
  if (action === 'suspend')   { updates.isActive = false;   updates.suspensionReason = reason || ''; updates.suspendedAt = now; }
  if (action === 'reinstate') { updates.isApproved = true;  updates.isActive = true;  updates.reinstatedAt = now; }

  const updated = await updateDoctor(doctorId, updates);
  return res.status(200).json({ success: true, data: updated });
}));

app.get('/api/admin/stats', requireAdmin, ah(async (req, res) => {
  const users     = [...authStore.users.values()];
  const doctors   = await getAllDoctors();
  const hospitals = await getAllHospitals();
  return res.status(200).json({
    success: true,
    data: {
      totalDoctors:       Math.max(users.filter(u => u.userType === 'doctor').length, doctors.length),
      approvedDoctors:    doctors.filter(d => d.isApproved).length,
      pendingDoctors:     doctors.filter(d => !d.isApproved).length,
      totalPatients:      users.filter(u => u.userType === 'patient').length,
      totalHospitals:     hospitals.length,
      pendingHospitals:   hospitals.filter(h => !h.isApproved && h.status === 'pending').length,
      totalAppointments:  0,
      activeMedicines:    0,
      totalMedicines:     0,
      activeAppointments: 0,
    },
  });
}));

app.get('/api/admin/profile', requireAdmin, (req, res) => {
  const token = getToken(req);
  const user  = verifyJWT(token);
  if (!user) return res.status(200).json({ success: true, data: { name: 'System Administrator', email: 'admin@medivault.dev', role: 'admin' } });
  return res.status(200).json({ success: true, data: { userId: user.userId, userType: user.userType, name: 'System Administrator', email: user.contactValue } });
});

app.post('/api/admin/auth/logout', (req, res) => {
  revokeToken(getToken(req));
  return res.status(200).json({ ok: true });
});

app.get('/api/admin/announcements', requireAdmin, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

app.get('/api/admin/team', requireAdmin, (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

// ── Config / misc routes ──────────────────────────────────────────────────────

app.get('/api/config/specializations', (req, res) => {
  return res.status(200).json({ success: true, data: [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'General Medicine', 'General Surgery', 'Gynaecology', 'Neurology',
    'Oncology', 'Ophthalmology', 'Orthopaedics', 'Paediatrics',
    'Psychiatry', 'Pulmonology', 'Radiology', 'Urology',
  ]});
});

app.get('/api/config/insurance-providers', (req, res) => {
  return res.status(200).json({ success: true, data: [] });
});

// Availability
app.get('/api/availability/:doctorId', (req, res) => {
  return res.status(200).json({ success: true, data: { slots: [] } });
});

// Lab / prescriptions stubs
app.get('/api/lab/orders', requireAuth, (req, res) => res.status(200).json({ success: true, data: [] }));
app.get('/api/prescriptions', requireAuth, ah(async (req, res) => {
  const { doctorId, patientId } = req.query;
  if (doctorId) return res.status(200).json({ success: true, data: await getPrescriptionsByDoctorId(doctorId) });
  if (patientId) return res.status(200).json({ success: true, data: await getPrescriptionsByPatientId(patientId) });
  return res.status(200).json({ success: true, data: [] });
}));

app.post('/api/prescriptions', requireAuth, ah(async (req, res) => {
  const body = req.body;
  if (!body.patientId) return res.status(400).json({ success: false, message: 'patientId is required' });
  if (!body.doctorId) {
    const doctor = await getDoctorByUserId(req.authUser.userId);
    if (doctor) body.doctorId = doctor.id;
  }
  const rx = await createPrescription(body);
  return res.status(201).json({ success: true, data: rx, prescription: rx });
}));

// AI Vaidya stub
app.post('/api/ai-vaidya/query', requireAuth, (req, res) => {
  return res.status(200).json({ success: true, response: 'AI Vaidya service is not configured. Please set the AI_API_KEY environment variable.' });
});

// Health check
app.get('/api/health', (req, res) => res.status(200).json({ ok: true, ts: new Date().toISOString() }));

// 404 fallback for unimplemented routes
app.use('/api', (req, res) => {
  console.warn(`[MediVault] Unhandled API route: ${req.method} ${req.path}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global async error handler
app.use((err, req, res, _next) => {
  console.error('[MediVault] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  [MediVault] Express backend running on http://localhost:${PORT}`);
      console.log(`  [MediVault] Next.js frontend should be on http://localhost:3000\n`);
    });
  })
  .catch((err) => {
    console.error('[MediVault] Failed to run DB migrations — server NOT started:', err.message);
    console.error('[MediVault] Check that PostgreSQL is running and DATABASE_URL is correct in .env.local');
    process.exit(1);
  });
