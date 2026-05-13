const router = require('express').Router();
const bcrypt  = require('bcryptjs');
const prisma  = require('../config/prisma');
const { notify } = require('../services/notification.service');
const logger = require('../utils/logger.util');

const STAFF_ROLES = ['receptionist', 'nurse', 'lab_technician', 'billing_staff'];

// GET /api/hospital/staff/:hospitalId
router.get('/:hospitalId', async (req, res) => {
  try {
    const { role, active } = req.query;
    const where = { hospitalId: req.params.hospitalId };
    if (role) where.role = role;
    if (active !== undefined) where.isActive = active === 'true';
    const staff = await prisma.hospitalStaff.findMany({ where, orderBy: { fullName: 'asc' } });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

// POST /api/hospital/staff/:hospitalId
router.post('/:hospitalId', async (req, res) => {
  try {
    const { fullName, role, phone, email, department, shiftStart, shiftEnd, workingDays } = req.body;
    if (!fullName || !role || !phone || !email) return res.status(400).json({ success: false, error: 'fullName, role, phone and email are required' });
    if (!STAFF_ROLES.includes(role)) return res.status(400).json({ success: false, error: `Role must be one of: ${STAFF_ROLES.join(', ')}` });
    if (!/^\+91[2-9]\d{9}$/.test(phone)) return res.status(400).json({ success: false, error: 'Invalid phone number (+91XXXXXXXXXX)' });

    const [emailExists, phoneExists] = await Promise.all([
      prisma.user.findFirst({ where: { email } }),
      prisma.user.findFirst({ where: { mobile: phone } }),
    ]);
    if (emailExists) return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    if (phoneExists) return res.status(409).json({ success: false, error: 'An account with this phone already exists.' });

    const hospital = await prisma.hospital.findUnique({ where: { id: req.params.hospitalId }, select: { name: true } });
    const tempPin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = await bcrypt.hash(tempPin, 10);

    const user = await prisma.user.create({
      data: {
        email, mobile: phone, pinHash, pinSalt: '', pinLength: '6',
        userType: 'staff', role, hospital: req.params.hospitalId,
        firstName: fullName.split(' ')[0], lastName: fullName.split(' ').slice(1).join(' ') || '',
        isActive: true,
        metadata: { tempPinExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), firstLoginCompleted: false },
      },
    });

    const staff = await prisma.hospitalStaff.create({
      data: { hospitalId: req.params.hospitalId, userId: user.userId, fullName, role, phone, email, department, shiftStart, shiftEnd, workingDays: workingDays || [] },
    });

    notify({ userId: user.userId, userType: 'staff', type: 'registration', title: 'Staff Account Created', message: `Your staff account has been created at ${hospital?.name}`, sendSmsFlag: true, phone, sendEmailFlag: true, email, emailSubject: `Your staff account at ${hospital?.name} — MediVault`, emailBody: `<p>Dear ${fullName},</p><p><strong>${hospital?.name}</strong> created your MediVault staff account as ${role.replace('_', ' ')}.<br/><strong>Temp PIN:</strong> ${tempPin} (expires 48 hours)</p>` }).catch(() => {});

    res.status(201).json({ success: true, data: staff, message: `${fullName} added. Credentials sent.` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create staff member' });
  }
});

// PUT /api/hospital/staff/:hospitalId/:staffId
router.put('/:hospitalId/:staffId', async (req, res) => {
  try {
    const staff = await prisma.hospitalStaff.findFirst({ where: { id: req.params.staffId, hospitalId: req.params.hospitalId } });
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });
    const allowed = ['fullName', 'role', 'phone', 'email', 'department', 'shiftStart', 'shiftEnd', 'isActive'];
    const data = {};
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }
    const updated = await prisma.hospitalStaff.update({ where: { id: staff.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update staff member' });
  }
});

// DELETE /api/hospital/staff/:hospitalId/:staffId
router.delete('/:hospitalId/:staffId', async (req, res) => {
  try {
    const staff = await prisma.hospitalStaff.findFirst({ where: { id: req.params.staffId, hospitalId: req.params.hospitalId } });
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });
    await prisma.hospitalStaff.update({ where: { id: staff.id }, data: { isActive: false } });
    if (staff.userId) await prisma.user.update({ where: { userId: staff.userId }, data: { isActive: false } });
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate staff member' });
  }
});

module.exports = router;
