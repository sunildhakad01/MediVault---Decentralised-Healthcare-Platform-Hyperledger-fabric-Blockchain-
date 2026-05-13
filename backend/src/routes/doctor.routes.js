const router = require('express').Router();
const prisma  = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { submitFabric }  = require('../services/fabricQueue.service');
const logger = require('../utils/logger.util');

// POST /api/doctor/register
router.post('/register', async (req, res) => {
  try {
    const {
      userId, fullName, email, phone, medicalCouncilRegNo, medicalCouncil, degree,
      specialization, experienceYears, consultationFee, doctorType,
      hospitalId, clinicName, clinicAddress, clinicCity, clinicState, clinicPincode, clinicPhone,
      serviceAreas, availableForHomeVisits, languagesSpoken, documents,
    } = req.body;

    if (!userId || !fullName || !email || !phone || !medicalCouncilRegNo || !medicalCouncil || !degree || !specialization || !consultationFee || !doctorType)
      return res.status(400).json({ success: false, error: 'Missing required fields' });

    if (!/^\+91[2-9]\d{9}$/.test(phone))
      return res.status(400).json({ success: false, error: 'Invalid phone number' });

    const existing = await prisma.doctor.findFirst({ where: { userId } });
    if (existing) return res.status(409).json({ success: false, error: 'Doctor profile already exists for this user' });

    const doctor = await prisma.doctor.create({
      data: {
        userId, fullName, email, phone, medicalCouncilRegNo, medicalCouncil, degree,
        specialization,
        experienceYears: parseInt(experienceYears) || 0,
        consultationFee: parseFloat(consultationFee),
        doctorType,
        hospitalId: doctorType === 'hospital' ? hospitalId : null,
        clinicName, clinicAddress, clinicCity, clinicState, clinicPincode, clinicPhone,
        serviceAreas: serviceAreas || [],
        availableForHomeVisits: !!availableForHomeVisits,
        languagesSpoken: languagesSpoken || [],
        documents: documents || [],
        status: doctorType === 'hospital' ? 'pending_hospital' : 'pending_admin',
      },
    });

    res.status(201).json({ success: true, data: { id: doctor.id, status: doctor.status }, message: 'Doctor registered successfully' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// GET /api/doctor/search/available
router.get('/search/available', async (req, res) => {
  try {
    const { specialization, name, city, page = 1, limit = 20 } = req.query;
    const where = { status: 'approved' };
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (name) where.fullName = { contains: name, mode: 'insensitive' };

    const doctors = await prisma.doctor.findMany({
      where,
      include: { hospital: { select: { id: true, name: true, city: true, state: true, status: true } } },
      orderBy: { fullName: 'asc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// GET /api/doctor/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user   = await prisma.user.findFirst({ where: { userId: req.user.userId }, select: { userId: true, email: true, metadata: true } });
    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.userId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    res.json({ success: true, data: { ...doctor, metadata: user?.metadata } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// GET /api/doctor/by-user/:userId
router.get('/by-user/:userId', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findFirst({ where: { userId: req.params.userId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctor' });
  }
});

// GET /api/doctor/:id
router.get('/:id', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctor' });
  }
});

// PUT /api/doctor/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    if (doctor.userId !== req.user.userId) return res.status(403).json({ success: false, error: 'Forbidden' });

    const allowed = ['fullName', 'phone', 'email', 'profilePhotoUrl', 'bio', 'consultationFee', 'experienceYears', 'languagesSpoken', 'digitalSignatureUrl', 'clinicName', 'clinicAddress', 'clinicCity', 'clinicState', 'clinicPincode', 'clinicPhone'];
    const data = {};
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }
    const updated = await prisma.doctor.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// GET /api/doctor/:id/appointments
router.get('/:id/appointments', authenticate, async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = { doctorId: req.params.id };
    if (date) where.appointmentDate = date;
    if (status) where.status = status;
    const appointments = await prisma.appointment.findMany({ where, orderBy: [{ appointmentDate: 'asc' }, { slotStart: 'asc' }] });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

// PUT /api/doctor/appointments/:appointmentId/status
router.put('/appointments/:appointmentId/status', authenticate, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.appointmentId } });
    if (!appt) return res.status(404).json({ success: false, error: 'Appointment not found' });

    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status, ...(notes && { notes }) } });

    submitFabric({
      channel: 'appointments', functionName: 'logAppointmentEvent',
      args: [appt.id, appt.patientId, appt.doctorId, appt.hospitalId || '', status, req.user.userId, new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'doctor',
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Status update failed' });
  }
});

// POST /api/doctor/complete-first-login
router.post('/complete-first-login', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({ where: { userId: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const meta = { ...(user.metadata || {}), firstLoginCompleted: true, tempPinExpiresAt: null };
    await prisma.user.update({ where: { userId: req.user.userId }, data: { metadata: meta } });
    res.json({ success: true, message: 'First login completed' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to mark first login complete' });
  }
});

module.exports = router;
