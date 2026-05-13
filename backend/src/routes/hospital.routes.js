const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const prisma  = require('../config/prisma');
const { authenticate }   = require('../middlewares/auth.middleware');
const { submitFabric }   = require('../services/fabricQueue.service');
const { notify, sendSMS, sendEmail, createNotification } = require('../services/notification.service');
const { uploadMedicalDocument } = require('../services/fileUpload.service');
const logger = require('../utils/logger.util');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/hospital/document-upload
router.post('/document-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
    const { buffer, originalname, mimetype, size } = req.file;
    const { url, cid } = await uploadMedicalDocument(buffer, originalname, mimetype, { docType: req.body.docType || 'hospital_document' });
    res.json({ success: true, url, cid, filename: originalname, size });
  } catch (err) {
    logger.error('Document upload failed: ' + err.message);
    res.status(500).json({ success: false, error: err.message || 'Upload failed' });
  }
});

// POST /api/hospital/register
router.post('/register', async (req, res) => {
  try {
    const {
      name, hospitalType, addressLine1, addressLine2, city, state, pincode,
      phone, altPhone, emergencyPhone, email, registrationNumber, licenseNumber, gstin, website,
      specialisations, workingHours, emergencyAvailable, documents,
      yearEstablished, numberOfBeds, landmark, googleMapsLink,
      adminName, adminEmail, adminPhone, adminPin, adminPassword,
    } = req.body;

    const adminCredential = adminPin || adminPassword;
    if (!name || !hospitalType || !addressLine1 || !city || !state || !pincode || !phone || !email || !registrationNumber)
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    if (!adminName || !adminEmail || !adminPhone || !adminCredential)
      return res.status(400).json({ success: false, error: 'Admin credentials are required' });
    if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ success: false, error: 'Invalid pincode' });
    if (!/^\+91[2-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: 'Invalid hospital phone (+91XXXXXXXXXX)' });
    if (adminCredential.length < 4) return res.status(400).json({ success: false, error: 'PIN must be at least 4 digits' });

    const [existingRegNo, existingHospEmail, existingAdminEmail, existingAdminPhone] = await Promise.all([
      prisma.hospital.findFirst({ where: { registrationNumber } }),
      prisma.hospital.findFirst({ where: { email } }),
      prisma.user.findFirst({ where: { email: adminEmail } }),
      prisma.user.findFirst({ where: { mobile: adminPhone } }),
    ]);
    if (existingRegNo)    return res.status(409).json({ success: false, error: 'Hospital with this registration number already exists' });
    if (existingHospEmail) return res.status(409).json({ success: false, error: 'Hospital with this email already exists' });
    if (existingAdminEmail) return res.status(409).json({ success: false, error: 'An account with this admin email already exists' });
    if (existingAdminPhone) return res.status(409).json({ success: false, error: 'An account with this admin phone already exists' });

    const hospital = await prisma.hospital.create({
      data: {
        name, hospitalType, addressLine1, addressLine2, city, state, pincode,
        phone, altPhone, emergencyPhone, email, website,
        registrationNumber, licenseNumber, gstin,
        yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
        numberOfBeds: numberOfBeds ? parseInt(numberOfBeds) : null,
        landmark, googleMapsLink,
        workingHours: workingHours || {},
        emergencyAvailable: !!emergencyAvailable,
        specialisations: Array.isArray(specialisations) ? specialisations : specialisations ? String(specialisations).split(',').map(s => s.trim()).filter(Boolean) : [],
        documents: documents || [],
        status: 'pending', submittedAt: new Date(),
        adminName, adminEmail, adminPhone,
      },
    });

    const salt   = await bcrypt.genSalt(12);
    const pinHash = await bcrypt.hash(adminCredential, salt);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail, mobile: adminPhone,
        pinHash, pinSalt: '', pinLength: String(adminCredential.length),
        userType: 'hospital_admin', role: 'hospital_admin',
        hospital: hospital.id,
        firstName: adminName.split(' ')[0] || adminName,
        lastName:  adminName.split(' ').slice(1).join(' ') || '',
        isActive: true, isMobileVerified: true,
      },
    });

    await prisma.hospital.update({ where: { id: hospital.id }, data: { adminUserId: adminUser.userId } });

    // Async notifications (non-blocking)
    Promise.allSettled([
      sendSMS(phone, `Your hospital ${name} registration has been submitted on MediVault. Ref ID: ${hospital.id}.`),
      sendEmail(adminEmail, 'Hospital Registration Submitted – MediVault', `<p>Dear ${adminName},</p><p>Your hospital <strong>${name}</strong> (Ref: ${hospital.id}) has been submitted and is pending verification. Expected: 2–3 working days.</p>`),
      prisma.user.findMany({ where: { userType: 'admin' } }).then(admins =>
        Promise.all(admins.map(a => createNotification({ userId: a.userId, userType: 'admin', type: 'verification', title: 'New Hospital Registration', message: `${name} submitted registration. Ref: ${hospital.id}`, metadata: { hospitalId: hospital.id } })))
      ),
    ]).catch(e => logger.error('Post-registration notifications failed: ' + e.message));

    res.status(201).json({ success: true, data: { id: hospital.id, name: hospital.name, status: hospital.status }, message: 'Hospital registered. Awaiting admin verification.' });
  } catch (err) {
    logger.error('Hospital registration failed: ' + err.message);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// GET /api/hospital/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, status: true, rejectionReason: true, suspensionReason: true, verifiedAt: true, submittedAt: true, adminEmail: true } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch status' });
  }
});

// PUT /api/hospital/:id/resubmit
router.put('/:id/resubmit', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
    if (hospital.status !== 'rejected') return res.status(400).json({ success: false, error: 'Only rejected hospitals can resubmit' });

    const allowed = ['name', 'hospitalType', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'phone', 'altPhone', 'emergencyPhone', 'email', 'website', 'licenseNumber', 'gstin', 'yearEstablished', 'numberOfBeds', 'landmark', 'googleMapsLink', 'workingHours', 'emergencyAvailable', 'specialisations', 'documents'];
    const data = { status: 'pending', rejectionReason: null, submittedAt: new Date() };
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }

    const updated = await prisma.hospital.update({ where: { id: req.params.id }, data });

    prisma.user.findMany({ where: { userType: 'admin' } }).then(admins =>
      Promise.all(admins.map(a => createNotification({ userId: a.userId, userType: 'admin', type: 'verification', title: 'Hospital Resubmitted', message: `${hospital.name} resubmitted their application. Ref: ${hospital.id}`, metadata: { hospitalId: hospital.id } })))
    ).catch(() => {});

    res.json({ success: true, data: { id: updated.id, status: 'pending' }, message: 'Application resubmitted.' });
  } catch (err) {
    logger.error('Hospital resubmit failed: ' + err.message);
    res.status(500).json({ success: false, error: 'Resubmission failed.' });
  }
});

// GET /api/hospital/:id
router.get('/:id', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospital' });
  }
});

// PUT /api/hospital/:id
router.put('/:id', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
    const allowed = ['name', 'logoUrl', 'addressLine2', 'website', 'specialisations', 'workingHours', 'emergencyAvailable', 'gstin'];
    const data = {};
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }
    const updated = await prisma.hospital.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// GET /api/hospital/:id/doctors
router.get('/:id/doctors', async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 50 } = req.query;
    const where = { hospitalId: req.params.id };
    if (status) where.status = status;
    if (department) where.department = department;
    if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { specialization: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }];
    const [total, rows] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) }),
    ]);
    res.json({ success: true, data: rows, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
});

// PUT /api/hospital/:id/doctors/:doctorId/verify
router.put('/:id/doctors/:doctorId/verify', async (req, res) => {
  try {
    const { id: hospitalId, doctorId } = req.params;
    const { action, reason } = req.body;
    const doctor   = await prisma.doctor.findFirst({ where: { id: doctorId, hospitalId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found for this hospital' });
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.status !== 'approved') return res.status(403).json({ success: false, error: 'Hospital must be approved to verify doctors' });

    if (action !== 'approve' && action !== 'reject') return res.status(400).json({ success: false, error: 'Invalid action' });
    if (action === 'reject' && !reason) return res.status(400).json({ success: false, error: 'Reason required for rejection' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { status: newStatus, verifiedBy: 'hospital', verifiedById: hospitalId, verifiedAt: new Date(), ...(reason && { rejectionReason: reason }) },
    });

    submitFabric({ functionName: 'updateDoctorStatus', args: [doctorId, hospitalId, newStatus, hospitalId, new Date().toISOString()], initiatedById: hospitalId, initiatedByRole: 'hospital' }).catch(() => {});
    notify({ userId: doctor.userId, userType: 'doctor', type: 'verification', title: `Hospital Verification: ${newStatus}`, message: `${hospital.name} has ${action}d your affiliation. ${reason ? 'Reason: ' + reason : ''}`, sendEmailFlag: true, email: doctor.email, emailSubject: `Doctor Affiliation ${newStatus}` }).catch(() => {});

    res.json({ success: true, data: updated, message: `Doctor ${action}d` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// GET /api/hospital/:id/appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const { status, date } = req.query;
    const where = { hospitalId: req.params.id };
    if (status) where.status = status;
    if (date) where.appointmentDate = date;
    const appointments = await prisma.appointment.findMany({ where, orderBy: [{ appointmentDate: 'desc' }, { slotStart: 'asc' }], take: 100 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

// POST /api/hospital/:id/doctors/register
router.post('/:id/doctors/register', async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital   = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.status !== 'approved') return res.status(403).json({ success: false, error: 'Hospital must be approved to register doctors' });

    const { fullName, email, phone, gender, dateOfBirth, medicalCouncilRegNo, medicalCouncil, degree, specialization, experienceYears, consultationFee, languagesSpoken, bio, department, designation, joiningDate, documents } = req.body;
    if (!fullName || !email || !phone || !medicalCouncilRegNo || !medicalCouncil || !degree || !specialization || !consultationFee || !department)
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    if (!/^\+91[2-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: 'Invalid phone (+91XXXXXXXXXX)' });

    const [eDoc, pDoc, eUser, pUser, regNo] = await Promise.all([
      prisma.doctor.findFirst({ where: { email } }),
      prisma.doctor.findFirst({ where: { phone } }),
      prisma.user.findFirst({ where: { email } }),
      prisma.user.findFirst({ where: { mobile: phone } }),
      prisma.doctor.findFirst({ where: { medicalCouncilRegNo, medicalCouncil } }),
    ]);
    if (eDoc)  return res.status(409).json({ success: false, error: 'Doctor with this email exists. Use Invite Doctor.' });
    if (pDoc)  return res.status(409).json({ success: false, error: 'Doctor with this phone exists. Use Invite Doctor.' });
    if (eUser) return res.status(409).json({ success: false, error: 'Email already registered.' });
    if (pUser) return res.status(409).json({ success: false, error: 'Phone already registered.' });
    if (regNo) return res.status(409).json({ success: false, error: 'Council registration number already registered.' });

    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = await bcrypt.hash(tempPin, 10);
    const tempPinExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email, mobile: phone, pinHash, pinSalt: '', pinLength: '6',
        userType: 'doctor', role: 'hospital_doctor', hospital: hospitalId,
        firstName: fullName.split(' ')[0], lastName: fullName.split(' ').slice(1).join(' ') || '',
        isActive: true,
        metadata: { tempPinExpiresAt: tempPinExpiresAt.toISOString(), firstLoginCompleted: false },
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.userId, fullName, email, phone,
        gender: gender || null, dateOfBirth: dateOfBirth || null,
        medicalCouncilRegNo, medicalCouncil, degree, specialization,
        experienceYears: parseInt(experienceYears) || 0,
        consultationFee: parseFloat(consultationFee),
        doctorType: 'hospital', hospitalId, department: department || null,
        designation: designation || 'Consultant', joiningDate: joiningDate || null,
        bio: bio || null, languagesSpoken: languagesSpoken || [],
        documents: documents || [], status: 'approved',
        verifiedBy: 'hospital', verifiedById: hospitalId, verifiedAt: new Date(),
        accountCreatedBy: 'hospital_direct',
      },
    });

    notify({ userId: user.userId, userType: 'doctor', type: 'registration', title: 'Doctor Account Created', message: `Your account has been created at ${hospital.name}`, sendSmsFlag: true, phone, sendEmailFlag: true, email, emailSubject: `Your doctor account at ${hospital.name} — MediVault`, emailBody: `<p>Dear Dr. ${fullName},</p><p><strong>${hospital.name}</strong> created your MediVault account.<br/><strong>Temp PIN:</strong> ${tempPin} (expires in 48 hours)</p>` }).catch(() => {});
    submitFabric({ channel: 'hospital-doctor', functionName: 'registerAndApproveDoctor', args: [doctor.id, hospitalId, 'hospital_direct', new Date().toISOString()], initiatedById: hospitalId, initiatedByRole: 'hospital' }).catch(() => {});

    res.status(201).json({ success: true, data: { doctorId: doctor.id, fullName, email, phone }, message: `Dr. ${fullName} registered. Credentials sent.` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Doctor registration failed' });
  }
});

// POST /api/hospital/:id/invite-doctor
router.post('/:id/invite-doctor', async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital   = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.status !== 'approved') return res.status(403).json({ success: false, error: 'Hospital must be approved to invite doctors' });

    const { fullName, email, phone, department, designation, consultationFee, message } = req.body;
    if (!fullName || !email || !phone || !department || !designation || !consultationFee) return res.status(400).json({ success: false, error: 'fullName, email, phone, department, designation and consultationFee are required' });
    if (!/^\+91[2-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: 'Invalid phone (+91XXXXXXXXXX)' });

    const existingDoc = await prisma.doctor.findFirst({ where: { email, hospitalId } });
    if (existingDoc) return res.status(409).json({ success: false, error: 'This doctor is already in your hospital.' });
    const anotherHosp = await prisma.doctor.findFirst({ where: { email, hospitalId: { not: hospitalId } } });
    if (anotherHosp) return res.status(409).json({ success: false, error: 'This doctor is registered with another hospital.' });

    await prisma.doctorInvite.updateMany({ where: { hospitalId, email, status: 'pending' }, data: { status: 'cancelled' } });

    const invite = await prisma.doctorInvite.create({
      data: { hospitalId, fullName, email, phone, department, designation, consultationFee: parseFloat(consultationFee), message: message || null, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/hospital/join/${invite.token}`;
    notify({ userId: null, userType: 'doctor', type: 'invite', title: `Invitation from ${hospital.name}`, message: `You've been invited to join ${hospital.name}`, sendSmsFlag: true, phone, sendEmailFlag: true, email, emailSubject: `Invitation to join ${hospital.name} — MediVault`, emailBody: `<p>Dear Dr. ${fullName},</p><p><strong>${hospital.name}</strong> invited you as ${designation} in ${department}.</p><p><a href="${inviteLink}">Accept Invitation</a> (valid 48 hours)</p>` }).catch(() => {});

    res.status(201).json({ success: true, data: { inviteId: invite.id, expiresAt: invite.expiresAt }, message: `Invitation sent to Dr. ${fullName}` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to send invitation' });
  }
});

// GET /api/hospital/:id/invites
router.get('/:id/invites', async (req, res) => {
  try {
    await prisma.doctorInvite.updateMany({ where: { hospitalId: req.params.id, status: 'pending', expiresAt: { lt: new Date() } }, data: { status: 'expired' } });
    const invites = await prisma.doctorInvite.findMany({ where: { hospitalId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: invites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invites' });
  }
});

// DELETE /api/hospital/:id/invites/:inviteId
router.delete('/:id/invites/:inviteId', async (req, res) => {
  try {
    const invite = await prisma.doctorInvite.findFirst({ where: { id: req.params.inviteId, hospitalId: req.params.id } });
    if (!invite) return res.status(404).json({ success: false, error: 'Invite not found' });
    await prisma.doctorInvite.update({ where: { id: invite.id }, data: { status: 'cancelled' } });
    res.json({ success: true, message: 'Invite cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel invite' });
  }
});

// GET /api/hospital/:id/departments
router.get('/:id/departments', async (req, res) => {
  try {
    const depts = await prisma.hospitalDepartment.findMany({ where: { hospitalId: req.params.id, isActive: true }, orderBy: { name: 'asc' } });
    const withCounts = await Promise.all(depts.map(async d => {
      const count = await prisma.doctor.count({ where: { hospitalId: req.params.id, department: d.name, status: 'approved' } });
      return { ...d, doctorCount: count };
    }));
    res.json({ success: true, data: withCounts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

// POST /api/hospital/:id/departments
router.post('/:id/departments', async (req, res) => {
  try {
    const { name, description, headDoctorId, dailyCapacity, defaultSlotMinutes, workingHours } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Department name is required' });
    const existing = await prisma.hospitalDepartment.findFirst({ where: { hospitalId: req.params.id, name } });
    if (existing) return res.status(409).json({ success: false, error: 'A department with this name already exists' });
    const dept = await prisma.hospitalDepartment.create({ data: { hospitalId: req.params.id, name, description, headDoctorId, dailyCapacity: dailyCapacity || 20, defaultSlotMinutes: defaultSlotMinutes || 20, workingHours: workingHours || {} } });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create department' });
  }
});

// PUT /api/hospital/:id/departments/:deptId
router.put('/:id/departments/:deptId', async (req, res) => {
  try {
    const dept = await prisma.hospitalDepartment.findFirst({ where: { id: req.params.deptId, hospitalId: req.params.id } });
    if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });
    const allowed = ['name', 'description', 'headDoctorId', 'dailyCapacity', 'defaultSlotMinutes', 'workingHours'];
    const data = {};
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }
    const updated = await prisma.hospitalDepartment.update({ where: { id: dept.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update department' });
  }
});

// DELETE /api/hospital/:id/departments/:deptId
router.delete('/:id/departments/:deptId', async (req, res) => {
  try {
    const dept = await prisma.hospitalDepartment.findFirst({ where: { id: req.params.deptId, hospitalId: req.params.id } });
    if (!dept) return res.status(404).json({ success: false, error: 'Department not found' });
    const assignedCount = await prisma.doctor.count({ where: { hospitalId: req.params.id, department: dept.name, status: 'approved' } });
    if (assignedCount > 0 && req.query.force !== 'true')
      return res.status(409).json({ success: false, error: `Cannot delete department with ${assignedCount} assigned doctor(s).` });
    await prisma.hospitalDepartment.update({ where: { id: dept.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Department removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete department' });
  }
});

// GET /api/hospital/:id/doctors/:doctorId
router.get('/:id/doctors/:doctorId', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findFirst({ where: { id: req.params.doctorId, hospitalId: req.params.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found for this hospital' });
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const [totalAppts, monthAppts] = await Promise.all([
      prisma.appointment.count({ where: { doctorId: doctor.id } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, createdAt: { gte: startOfMonth } } }),
    ]);
    res.json({ success: true, data: { ...doctor, stats: { totalAppointments: totalAppts, appointmentsThisMonth: monthAppts } } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctor' });
  }
});

// PUT /api/hospital/:id/doctors/:doctorId/hospital-settings
router.put('/:id/doctors/:doctorId/hospital-settings', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findFirst({ where: { id: req.params.doctorId, hospitalId: req.params.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found for this hospital' });
    const { department, designation, consultationFee } = req.body;
    const data = {};
    if (department     !== undefined) data.department     = department;
    if (designation    !== undefined) data.designation    = designation;
    if (consultationFee !== undefined) data.consultationFee = parseFloat(consultationFee);
    const updated = await prisma.doctor.update({ where: { id: doctor.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update doctor settings' });
  }
});

module.exports = router;
