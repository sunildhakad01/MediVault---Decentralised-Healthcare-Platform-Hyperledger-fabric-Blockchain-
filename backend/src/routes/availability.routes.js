const router = require('express').Router();
const prisma  = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger.util');

// GET /api/availability/:doctorId
router.get('/:doctorId', async (req, res) => {
  try {
    const [schedule, leaves] = await Promise.all([
      prisma.doctorAvailability.findMany({ where: { doctorId: req.params.doctorId }, orderBy: { dayOfWeek: 'asc' } }),
      prisma.doctorLeave.findMany({ where: { doctorId: req.params.doctorId }, orderBy: { leaveDate: 'asc' } }),
    ]);
    res.json({ success: true, data: { schedule, leaves } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch availability' });
  }
});

// PUT /api/availability/:doctorId
router.put('/:doctorId', authenticate, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { schedule } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    if (doctor.userId !== req.user.userId) return res.status(403).json({ success: false, error: 'Forbidden' });

    await prisma.doctorAvailability.deleteMany({ where: { doctorId } });
    if (schedule?.length) {
      await prisma.doctorAvailability.createMany({
        data: schedule.map(s => ({
          doctorId, dayOfWeek: s.dayOfWeek, isActive: s.isActive !== false,
          startTime: s.startTime, endTime: s.endTime,
          slotDurationMinutes: s.slotDurationMinutes || 30,
          maxPatients: s.maxPatients || 20,
        })),
      });
    }
    const updated = await prisma.doctorAvailability.findMany({ where: { doctorId }, orderBy: { dayOfWeek: 'asc' } });
    res.json({ success: true, data: updated, message: 'Schedule saved' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to save schedule' });
  }
});

// POST /api/availability/:doctorId/leave
router.post('/:doctorId/leave', authenticate, async (req, res) => {
  try {
    const { leaveDate, reason } = req.body;
    if (!leaveDate) return res.status(400).json({ success: false, error: 'leaveDate is required' });
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.doctorId } });
    if (!doctor || doctor.userId !== req.user.userId) return res.status(403).json({ success: false, error: 'Forbidden' });
    const leave = await prisma.doctorLeave.create({ data: { doctorId: req.params.doctorId, leaveDate, reason } });
    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add leave' });
  }
});

// DELETE /api/availability/:doctorId/leave/:leaveId
router.delete('/:doctorId/leave/:leaveId', authenticate, async (req, res) => {
  try {
    await prisma.doctorLeave.deleteMany({ where: { id: req.params.leaveId, doctorId: req.params.doctorId } });
    res.json({ success: true, message: 'Leave removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove leave' });
  }
});

// GET /api/availability/:doctorId/slots?date=YYYY-MM-DD
router.get('/:doctorId/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'date query param required' });
    const dayOfWeek = new Date(date).getDay();
    const onLeave = await prisma.doctorLeave.findFirst({ where: { doctorId: req.params.doctorId, leaveDate: date } });
    if (onLeave) return res.json({ success: true, data: [], message: 'Doctor on leave' });
    const daySchedule = await prisma.doctorAvailability.findFirst({ where: { doctorId: req.params.doctorId, dayOfWeek, isActive: true } });
    if (!daySchedule) return res.json({ success: true, data: [], message: 'Not available' });
    const slots = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end  = endH * 60 + endM;
    const dur  = daySchedule.slotDurationMinutes;
    while (current + dur <= end) {
      const h = Math.floor(current / 60); const m = current % 60;
      const slotStart = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const slotEnd   = `${String(Math.floor((current+dur)/60)).padStart(2,'0')}:${String((current+dur)%60).padStart(2,'0')}`;
      slots.push({ slotStart, slotEnd });
      current += dur;
    }
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch slots' });
  }
});

module.exports = router;
