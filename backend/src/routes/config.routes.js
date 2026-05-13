const router = require('express').Router();
const prisma  = require('../config/prisma');
const logger = require('../utils/logger.util');

// Seed defaults on startup
(async () => {
  try {
    const count = await prisma.specialization.count();
    if (count === 0) {
      const defaults = [
        'General Medicine', 'Internal Medicine', 'Cardiology', 'Neurology', 'Orthopaedics',
        'Gynaecology & Obstetrics', 'Paediatrics', 'Ophthalmology', 'ENT', 'Dermatology',
        'Psychiatry', 'Oncology', 'Urology', 'Nephrology', 'Gastroenterology', 'Pulmonology',
        'Endocrinology', 'Rheumatology', 'Haematology', 'Radiology', 'Pathology',
        'Anaesthesiology', 'Emergency Medicine', 'Dental / BDS', 'Ayurveda / BAMS', 'Homoeopathy / BHMS',
      ];
      await prisma.specialization.createMany({ data: defaults.map(name => ({ name })), skipDuplicates: true });
      logger.info('Seeded default specializations');
    }
    const slotConfig = await prisma.systemConfig.findUnique({ where: { key: 'default_slot_duration' } });
    if (!slotConfig) {
      await prisma.systemConfig.createMany({ data: [{ key: 'default_slot_duration', value: '30', updatedBy: 'system' }, { key: 'platform_fee_percent', value: '5', updatedBy: 'system' }, { key: 'gst_percent', value: '18', updatedBy: 'system' }], skipDuplicates: true });
    }
  } catch (e) { logger.error('Config seed: ' + e.message); }
})();

// ── Specializations ───────────────────────────────────────────────────────────
router.get('/specializations', async (req, res) => {
  try {
    const list = await prisma.specialization.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: list });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch' }); }
});

router.post('/specializations', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name required' });
    const existing = await prisma.specialization.findFirst({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ success: false, error: 'Already exists' });
    const item = await prisma.specialization.create({ data: { name: name.trim() } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create' }); }
});

router.put('/specializations/:id', async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    const item = await prisma.specialization.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update' }); }
});

router.delete('/specializations/:id', async (req, res) => {
  try {
    await prisma.specialization.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Deactivated' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to deactivate' }); }
});

// ── Departments ───────────────────────────────────────────────────────────────
router.get('/departments', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const where = { isActive: true };
    if (hospitalId) where.OR = [{ hospitalId }, { hospitalId: null }];
    const list = await prisma.configDepartment.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: list });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch' }); }
});

router.post('/departments', async (req, res) => {
  try {
    const { name, hospitalId } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name required' });
    const dept = await prisma.configDepartment.create({ data: { name: name.trim(), hospitalId: hospitalId || null } });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create' }); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await prisma.configDepartment.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// ── Insurance Providers ───────────────────────────────────────────────────────
router.get('/insurance-providers', async (req, res) => {
  try {
    const list = await prisma.insuranceProvider.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: list });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch' }); }
});

router.post('/insurance-providers', async (req, res) => {
  try {
    const { name, contactEmail } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name required' });
    const item = await prisma.insuranceProvider.create({ data: { name: name.trim(), contactEmail } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create' }); }
});

router.delete('/insurance-providers/:id', async (req, res) => {
  try {
    await prisma.insuranceProvider.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed' }); }
});

// ── System Config ─────────────────────────────────────────────────────────────
router.get('/system', async (req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    const obj = {};
    configs.forEach(c => { obj[c.key] = c.value; });
    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch' }); }
});

router.put('/system', async (req, res) => {
  try {
    const { key, value, updatedBy } = req.body;
    if (!key || value === undefined) return res.status(400).json({ success: false, error: 'key and value required' });
    await prisma.systemConfig.upsert({ where: { key }, create: { key, value: String(value), updatedBy: updatedBy || 'admin' }, update: { value: String(value), updatedBy: updatedBy || 'admin' } });
    res.json({ success: true, message: 'Config updated' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update' }); }
});

module.exports = router;
