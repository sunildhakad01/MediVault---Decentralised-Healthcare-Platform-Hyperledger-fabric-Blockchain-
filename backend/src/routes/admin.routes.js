const router = require('express').Router();
const prisma  = require('../config/prisma');
const { authenticate }  = require('../middlewares/auth.middleware');
const { submitFabric }  = require('../services/fabricQueue.service');
const { notify }        = require('../services/notification.service');
const logger = require('../utils/logger.util');

const adminAuth = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') return next();
  const sessionHeader = req.headers['x-admin-session'];
  if (sessionHeader) {
    try {
      const session = JSON.parse(Buffer.from(sessionHeader, 'base64').toString());
      if (session && session.role === 'admin') { req.adminSession = session; return next(); }
    } catch (_) {}
  }
  return res.status(403).json({ success: false, error: 'Admin access required' });
};

const logAudit = async (adminId, action, targetType, targetId, metadata, ip) => {
  try { await prisma.adminAuditLog.create({ data: { adminId, action, targetType, targetId, metadata, ipAddress: ip } }); }
  catch (e) { logger.error('Audit log failed: ' + e.message); }
};

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalDoctors, approvedDoctors, pendingDoctors, totalPatients, totalHospitals, pendingHospitals, totalAppointments] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { status: 'approved' } }),
      prisma.doctor.count({ where: { status: { in: ['pending_admin', 'pending_hospital'] } } }),
      prisma.patient.count(),
      prisma.hospital.count(),
      prisma.hospital.count({ where: { status: 'pending' } }),
      prisma.appointment.count(),
    ]);
    res.json({ success: true, data: { totalDoctors, approvedDoctors, pendingDoctors, totalPatients, totalHospitals, pendingHospitals, totalAppointments, activeMedicines: 0, totalMedicines: 0, activeAppointments: 0 } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/admin/auth/login
router.post('/auth/login', authenticate, (req, res) => {
  if (!req.user || req.user.userType !== 'admin')
    return res.status(403).json({ success: false, error: 'Not an admin account' });
  res.json({ success: true, data: { userId: req.user.userId, email: req.user.email, userType: req.user.userType, role: req.user.role || 'super_admin' } });
});

router.post('/auth/logout', authenticate, async (req, res) => {
  try {
    if (req.user?.userId) await prisma.user.update({ where: { userId: req.user.userId }, data: { registeredDevices: [] } });
  } catch (_) {}
  res.json({ success: true });
});

// GET /api/admin/profile
router.get('/profile', authenticate, adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({ where: { userId: req.user.userId }, select: { userId: true, email: true, mobile: true, firstName: true, lastName: true, role: true, lastLoginAt: true, metadata: true } });
    if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticate, adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, mobile, photoUrl } = req.body;
    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName  !== undefined) data.lastName  = lastName;
    if (mobile    !== undefined) data.mobile    = mobile;
    if (photoUrl  !== undefined) {
      const user = await prisma.user.findFirst({ where: { userId: req.user.userId } });
      data.metadata = { ...(user?.metadata || {}), photoUrl };
    }
    await prisma.user.update({ where: { userId: req.user.userId }, data });
    await logAudit(req.user.userId, 'profile_updated', 'admin', req.user.userId, { fields_changed: Object.keys(data) }, req.ip);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

router.put('/profile/password', authenticate, adminAuth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) return res.status(400).json({ success: false, error: 'currentPin and newPin required' });
    const { hashPin, comparePin } = require('../utils/hash.util');
    const user = await prisma.user.findFirst({ where: { userId: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });
    const valid = await comparePin(currentPin, user.pinHash);
    if (!valid) return res.status(400).json({ success: false, error: 'Current PIN is incorrect' });
    await prisma.user.update({ where: { userId: req.user.userId }, data: { pinHash: await hashPin(newPin) } });
    await logAudit(req.user.userId, 'password_changed', 'admin', req.user.userId, {}, req.ip);
    res.json({ success: true, message: 'PIN updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update PIN' });
  }
});

// GET /api/admin/team
router.get('/team', authenticate, adminAuth, async (req, res) => {
  try {
    const admins = await prisma.user.findMany({ where: { userType: 'admin' }, select: { userId: true, email: true, mobile: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true }, orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch team' });
  }
});

router.post('/team', authenticate, adminAuth, async (req, res) => {
  try {
    if (req.user.role && req.user.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Only super_admin can create sub-admins' });
    const { firstName, lastName, email, mobile, role } = req.body;
    if (!firstName || !email || !mobile || !role) return res.status(400).json({ success: false, error: 'firstName, email, mobile, and role are required' });
    const validRoles = ['super_admin', 'ops_admin', 'billing_admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' });
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });
    const { hashPin } = require('../utils/hash.util');
    const tempPin = Math.random().toString().slice(2, 8);
    const user = await prisma.user.create({ data: { email, mobile, firstName, lastName, pinHash: await hashPin(tempPin), pinSalt: '', pinLength: '6', userType: 'admin', role, isActive: true, isEmailVerified: true } });
    notify({ userId: user.userId, userType: 'admin', type: 'account', title: 'MediVault Admin Account Created', message: `Your admin account has been created. Temporary PIN: ${tempPin}. Please change it immediately.`, sendEmailFlag: true, email, emailSubject: 'MediVault Admin Account — Welcome' }).catch(() => {});
    await logAudit(req.user.userId, 'sub_admin_created', 'admin', user.userId, { role, email }, req.ip);
    res.json({ success: true, message: 'Sub-admin created.', data: { userId: user.userId, email, role } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create sub-admin' });
  }
});

router.put('/team/:id', authenticate, adminAuth, async (req, res) => {
  try {
    if (req.user.role && req.user.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Only super_admin can update sub-admins' });
    const data = {};
    if (req.body.role !== undefined)     data.role = req.body.role;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    await prisma.user.updateMany({ where: { userId: req.params.id, userType: 'admin' }, data });
    await logAudit(req.user.userId, 'sub_admin_updated', 'admin', req.params.id, data, req.ip);
    res.json({ success: true, message: 'Sub-admin updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update sub-admin' });
  }
});

router.delete('/team/:id', authenticate, adminAuth, async (req, res) => {
  try {
    if (req.user.role && req.user.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Only super_admin can deactivate sub-admins' });
    if (req.params.id === req.user.userId) return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    await prisma.user.updateMany({ where: { userId: req.params.id, userType: 'admin' }, data: { isActive: false } });
    await logAudit(req.user.userId, 'sub_admin_deactivated', 'admin', req.params.id, {}, req.ip);
    res.json({ success: true, message: 'Sub-admin deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate sub-admin' });
  }
});

// GET /api/admin/hospitals
router.get('/hospitals', authenticate, adminAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { registrationNumber: { contains: search, mode: 'insensitive' } }];
    const hospitals = await prisma.hospital.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) });
    res.json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospitals' });
  }
});

router.post('/hospitals', authenticate, adminAuth, async (req, res) => {
  try {
    const { name, hospitalType, addressLine1, addressLine2, city, state, pincode, phone, email, registrationNumber, licenseNumber, gstin, specialisations, workingHours, emergencyAvailable, documents } = req.body;
    if (!name || !hospitalType || !addressLine1 || !city || !state || !pincode || !phone || !email || !registrationNumber)
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    const existing = await prisma.hospital.findFirst({ where: { registrationNumber } });
    if (existing) return res.status(409).json({ success: false, error: 'Hospital with this registration number already exists' });
    const hospital = await prisma.hospital.create({ data: { name, hospitalType, addressLine1, addressLine2, city, state, pincode, phone, email, registrationNumber, licenseNumber, gstin, specialisations: specialisations || [], workingHours: workingHours || {}, emergencyAvailable: !!emergencyAvailable, documents: documents || [], status: 'pending' } });
    res.json({ success: true, data: hospital, message: 'Hospital registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to register hospital' });
  }
});

router.get('/hospitals/:id', authenticate, adminAuth, async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.id } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch hospital' });
  }
});

router.put('/hospitals/:id/verify', authenticate, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body.action || (req.body.status === 'approved' ? 'approve' : req.body.status === 'rejected' ? 'reject' : req.body.status === 'suspended' ? 'suspend' : req.body.status);
    const { reason } = req.body;
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });

    const adminId = req.user?.userId || req.adminSession?.email || 'admin';
    let newStatus;
    const data = { verifiedByAdminId: adminId, verifiedAt: new Date() };

    if (action === 'approve') { newStatus = 'approved'; }
    else if (action === 'reject') { if (!reason) return res.status(400).json({ success: false, error: 'Rejection reason required' }); newStatus = 'rejected'; data.rejectionReason = reason; }
    else if (action === 'suspend') { if (!reason) return res.status(400).json({ success: false, error: 'Suspension reason required' }); newStatus = 'suspended'; data.suspensionReason = reason; }
    else if (action === 'reinstate') { newStatus = 'approved'; data.suspensionReason = null; }
    else return res.status(400).json({ success: false, error: 'Invalid action' });

    data.status = newStatus;
    await prisma.hospital.update({ where: { id }, data });

    submitFabric({ functionName: 'updateHospitalStatus', args: [id, newStatus, adminId, new Date().toISOString(), reason || ''], initiatedById: adminId, initiatedByRole: 'admin' }).catch(() => {});
    await logAudit(adminId, `hospital_${action}`, 'hospital', id, { newStatus, reason, hospitalName: hospital.name }, req.ip);

    if (action === 'suspend') {
      await prisma.doctor.updateMany({ where: { hospitalId: id, status: 'approved' }, data: { isActive: false } });
      const upcoming = await prisma.appointment.findMany({ where: { hospitalId: id, status: { in: ['scheduled', 'confirmed'] }, appointmentDate: { gt: new Date().toISOString().slice(0, 10) } }, take: 200 });
      const notified = new Set();
      for (const appt of upcoming) {
        if (appt.patientId && !notified.has(appt.patientId)) {
          notified.add(appt.patientId);
          notify({ userId: appt.patientId, userType: 'patient', type: 'appointment', title: 'Hospital Suspended', message: `${hospital.name} has been suspended. Your upcoming appointment(s) may be affected.` }).catch(() => {});
        }
      }
    }
    if (action === 'reinstate') {
      await prisma.doctor.updateMany({ where: { hospitalId: id, status: 'approved' }, data: { isActive: true } });
    }

    notify({ userId: id, userType: 'hospital', type: 'verification', title: `Hospital ${action}`, message: action === 'approve' ? 'Your hospital has been approved.' : `Status updated to ${newStatus}. ${reason ? 'Reason: ' + reason : ''}`, sendEmailFlag: true, email: hospital.email, emailSubject: `MediVault — Hospital ${newStatus}` }).catch(() => {});

    res.json({ success: true, message: `Hospital ${action}d`, data: { id: hospital.id, status: newStatus } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Action failed' });
  }
});

// GET /api/admin/doctors
router.get('/doctors', authenticate, adminAuth, async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type)   where.doctorType = type;
    if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { medicalCouncilRegNo: { contains: search, mode: 'insensitive' } }];
    const doctors = await prisma.doctor.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) });
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
});

router.put('/doctors/:id/verify', authenticate, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body.action || (req.body.status === 'approved' ? 'approve' : req.body.status === 'rejected' ? 'reject' : req.body.status === 'suspended' ? 'suspend' : req.body.status);
    const { reason } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const adminId = req.user?.userId || req.adminSession?.email || 'admin';
    let newStatus;
    const data = { verifiedBy: 'admin', verifiedById: adminId, verifiedAt: new Date() };

    if (action === 'approve') { newStatus = 'approved'; data.isActive = true; }
    else if (action === 'reject') { if (!reason) return res.status(400).json({ success: false, error: 'Reason required' }); newStatus = 'rejected'; data.rejectionReason = reason; data.isActive = false; }
    else if (action === 'suspend' || action === 'force_suspend') { if (!reason) return res.status(400).json({ success: false, error: 'Reason required' }); newStatus = 'suspended'; data.suspensionReason = reason; data.forceSuspendedByAdmin = true; data.isActive = false; }
    else return res.status(400).json({ success: false, error: 'Invalid action' });

    data.status = newStatus;
    const updated = await prisma.doctor.update({ where: { id }, data });

    submitFabric({ functionName: 'updateDoctorStatus', args: [id, newStatus, 'admin', adminId, new Date().toISOString(), reason || ''], initiatedById: adminId, initiatedByRole: 'admin' }).catch(() => {});
    await logAudit(adminId, `doctor_${action}`, 'doctor', id, { newStatus, reason, doctorName: doctor.fullName }, req.ip);

    if ((action === 'suspend' || action === 'force_suspend') && doctor.hospitalId) {
      notify({ userId: doctor.hospitalId, userType: 'hospital', type: 'alert', title: 'Doctor Suspended by Admin', message: `Dr. ${doctor.fullName} has been suspended by platform administration. Reason: ${reason}.` }).catch(() => {});
    }
    notify({ userId: doctor.userId, userType: 'doctor', type: 'verification', title: `Doctor Verification: ${newStatus}`, message: newStatus === 'approved' ? 'Your registration has been approved.' : `Profile status updated to ${newStatus}. ${reason ? 'Reason: ' + reason : ''}`, sendEmailFlag: true, email: doctor.email, emailSubject: `MediVault — Doctor ${newStatus}` }).catch(() => {});

    res.json({ success: true, message: `Doctor ${action}d`, data: { id: updated.id, status: newStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Action failed' });
  }
});

// GET /api/admin/patients
router.get('/patients', authenticate, adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (search) where.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { uniquePatientId: { contains: search, mode: 'insensitive' } }];
    const patients = await prisma.patient.findMany({ where, select: { id: true, uniquePatientId: true, fullName: true, gender: true, city: true, state: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) });
    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
});

router.get('/patients/:id', authenticate, adminAuth, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id }, select: { id: true, uniquePatientId: true, fullName: true, gender: true, dob: true, bloodGroup: true, city: true, state: true, isActive: true, createdAt: true, updatedAt: true } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch patient' });
  }
});

router.put('/patients/:id/status', authenticate, adminAuth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const isActive = status === 'active';
    const patient  = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    await prisma.patient.update({ where: { id: req.params.id }, data: { isActive } });
    if (patient.userId) {
      await prisma.user.update({ where: { userId: patient.userId }, data: { isActive, ...(!isActive && { registeredDevices: [] }) } });
      if (!isActive) notify({ userId: patient.userId, userType: 'patient', type: 'account', title: 'Account Deactivated', message: 'Your MediVault account has been deactivated. Contact support@medivault.com.', sendSmsFlag: true, phone: patient.phone }).catch(() => {});
    }
    const adminId = req.user?.userId || 'admin';
    await logAudit(adminId, 'patient_status_change', 'patient', req.params.id, { status, reason }, req.ip);
    res.json({ success: true, data: { id: patient.id, isActive } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update patient status' });
  }
});

router.put('/patients/:id/flag', authenticate, adminAuth, async (req, res) => {
  try {
    const { flagReason } = req.body;
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    await prisma.patient.update({ where: { id: req.params.id }, data: { isActive: false } });
    await logAudit(req.user?.userId || 'admin', 'patient_flagged', 'patient', req.params.id, { flagReason }, req.ip);
    res.json({ success: true, message: 'Patient flagged for review' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to flag patient' });
  }
});

// GET /api/admin/revenue
router.get('/revenue', authenticate, adminAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateWhere = { status: 'paid' };
    if (from || to) {
      dateWhere.paidAt = {};
      if (from) dateWhere.paidAt.gte = new Date(from);
      if (to)   dateWhere.paidAt.lte = new Date(to);
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allPaid, todayPaid, weekPaid, monthPaid, failedPayments, byHospital, byDoctor] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: dateWhere }).then(r => r._sum.totalAmount || 0),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: todayStart } } }).then(r => r._sum.totalAmount || 0),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: weekStart } } }).then(r => r._sum.totalAmount || 0),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: monthStart } } }).then(r => r._sum.totalAmount || 0),
      prisma.invoice.findMany({ where: { status: 'cancelled' }, take: 50, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.groupBy({ by: ['hospitalId'], _sum: { totalAmount: true }, _count: { id: true }, where: { ...dateWhere, hospitalId: { not: null } }, orderBy: { _sum: { totalAmount: 'desc' } }, take: 20 }),
      prisma.invoice.groupBy({ by: ['doctorId'], _sum: { totalAmount: true }, _count: { id: true }, where: dateWhere, orderBy: { _sum: { totalAmount: 'desc' } }, take: 20 }),
    ]);

    res.json({ success: true, data: { totalRevenue: parseFloat(allPaid).toFixed(2), revenueToday: parseFloat(todayPaid).toFixed(2), revenueWeek: parseFloat(weekPaid).toFixed(2), revenueMonth: parseFloat(monthPaid).toFixed(2), revenueByHospital: byHospital.map(r => ({ hospitalId: r.hospitalId, totalRevenue: r._sum.totalAmount, count: r._count.id })), revenueByDoctor: byDoctor.map(r => ({ doctorId: r.doctorId, totalRevenue: r._sum.totalAmount, count: r._count.id })), failedPayments: failedPayments.map(inv => ({ invoiceId: inv.id, patientId: inv.patientId, amount: inv.totalAmount, date: inv.createdAt, retryCount: inv.retryCount || 0 })) } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue data' });
  }
});

router.post('/billing/failed-payments/:id/retry', authenticate, adminAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (invoice.status !== 'cancelled') return res.status(400).json({ success: false, error: 'Invoice is not in failed state' });
    if (invoice.retryCount >= 3) return res.status(400).json({ success: false, error: 'Maximum retry attempts reached' });
    const updated = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'sent', retryCount: { increment: 1 } } });
    await logAudit(req.user?.userId || 'admin', 'payment_retry', 'invoice', req.params.id, { retryCount: updated.retryCount }, req.ip);
    res.json({ success: true, message: 'Payment retry initiated', data: { retryCount: updated.retryCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retry payment' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, adminAuth, async (req, res) => {
  try {
    const { adminId, action, targetType, from, to, page = 1, limit = 50 } = req.query;
    const where = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (targetType) where.targetType = targetType;
    if (from || to) { where.createdAt = {}; if (from) where.createdAt.gte = new Date(from); if (to) where.createdAt.lte = new Date(to); }
    const [total, rows] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page) - 1) * parseInt(limit) }),
    ]);
    res.json({ success: true, data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
