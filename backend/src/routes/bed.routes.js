const router = require('express').Router();
const prisma  = require('../config/prisma');
const logger = require('../utils/logger.util');

// GET /api/beds/:hospitalId/wards
router.get('/:hospitalId/wards', async (req, res) => {
  try {
    const wards = await prisma.ward.findMany({ where: { hospitalId: req.params.hospitalId }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: wards });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch wards' }); }
});

// POST /api/beds/:hospitalId/wards
router.post('/:hospitalId/wards', async (req, res) => {
  try {
    const { name, type, totalBeds } = req.body;
    if (!name || !type || !totalBeds) return res.status(400).json({ success: false, error: 'name, type, totalBeds required' });
    const ward = await prisma.ward.create({ data: { hospitalId: req.params.hospitalId, name, type, totalBeds: parseInt(totalBeds) } });
    const beds = Array.from({ length: parseInt(totalBeds) }, (_, i) => ({
      wardId: ward.id, hospitalId: req.params.hospitalId,
      bedNumber: `${name.substring(0,3).toUpperCase()}-${String(i+1).padStart(3,'0')}`,
    }));
    await prisma.bed.createMany({ data: beds });
    res.status(201).json({ success: true, data: ward });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create ward' });
  }
});

// GET /api/beds/:hospitalId/beds
router.get('/:hospitalId/beds', async (req, res) => {
  try {
    const { wardId, status } = req.query;
    const where = { hospitalId: req.params.hospitalId };
    if (wardId) where.wardId = wardId;
    if (status) where.status = status;
    const beds = await prisma.bed.findMany({ where, orderBy: { bedNumber: 'asc' } });
    res.json({ success: true, data: beds });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch beds' }); }
});

// PUT /api/beds/:hospitalId/beds/:bedId/admit
router.put('/:hospitalId/beds/:bedId/admit', async (req, res) => {
  try {
    const { patientId, admittingDoctorId } = req.body;
    if (!patientId) return res.status(400).json({ success: false, error: 'patientId required' });
    const bed = await prisma.bed.findFirst({ where: { id: req.params.bedId, hospitalId: req.params.hospitalId } });
    if (!bed) return res.status(404).json({ success: false, error: 'Bed not found' });
    if (bed.status !== 'available') return res.status(409).json({ success: false, error: 'Bed is not available' });
    const updated = await prisma.bed.update({ where: { id: bed.id }, data: { status: 'occupied', patientId, admittedAt: new Date(), admittingDoctorId, dischargedAt: null } });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: 'Admission failed' }); }
});

// PUT /api/beds/:hospitalId/beds/:bedId/discharge
router.put('/:hospitalId/beds/:bedId/discharge', async (req, res) => {
  try {
    const bed = await prisma.bed.findFirst({ where: { id: req.params.bedId, hospitalId: req.params.hospitalId } });
    if (!bed) return res.status(404).json({ success: false, error: 'Bed not found' });
    const updated = await prisma.bed.update({ where: { id: bed.id }, data: { status: 'available', patientId: null, dischargedAt: new Date(), dischargeNotes: req.body.dischargeNotes || null } });
    res.json({ success: true, data: updated, message: 'Patient discharged' });
  } catch (err) { res.status(500).json({ success: false, error: 'Discharge failed' }); }
});

// PUT /api/beds/:hospitalId/beds/:bedId/status
router.put('/:hospitalId/beds/:bedId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available','occupied','maintenance','reserved'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const bed = await prisma.bed.findFirst({ where: { id: req.params.bedId, hospitalId: req.params.hospitalId } });
    if (!bed) return res.status(404).json({ success: false, error: 'Bed not found' });
    const updated = await prisma.bed.update({ where: { id: bed.id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: 'Status update failed' }); }
});

module.exports = router;
