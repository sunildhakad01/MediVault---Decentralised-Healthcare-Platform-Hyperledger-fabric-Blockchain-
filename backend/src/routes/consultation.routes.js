const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const prisma  = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { submitFabric }  = require('../services/fabricQueue.service');
const logger = require('../utils/logger.util');

// POST /api/consultations
router.post('/', authenticate, async (req, res) => {
  try {
    const { appointmentId, patientId, chiefComplaint, examinationFindings, diagnosis, treatmentPlan, followUpDate, referral } = req.body;
    if (!appointmentId || !patientId) return res.status(400).json({ success: false, error: 'appointmentId and patientId required' });

    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.userId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const note = await prisma.consultationNote.create({
      data: { appointmentId, patientId, doctorId: doctor.id, chiefComplaint, examinationFindings, diagnosis, treatmentPlan, followUpDate, referral },
    });

    const fabricResult = await submitFabric({
      functionName: 'LogAction',
      args: [uuidv4(), doctor.id, 'UPDATE', appointmentId, 'Consultation', JSON.stringify({ diagnosis }), new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'doctor',
    });
    if (fabricResult.txId) {
      await prisma.consultationNote.update({ where: { id: note.id }, data: { fabricTxId: fabricResult.txId } });
    }

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to save consultation notes' });
  }
});

// GET /api/consultations/appointment/:appointmentId
router.get('/appointment/:appointmentId', authenticate, async (req, res) => {
  try {
    const note = await prisma.consultationNote.findFirst({ where: { appointmentId: req.params.appointmentId } });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch consultation notes' });
  }
});

// POST /api/consultations/log-access
router.post('/log-access', authenticate, async (req, res) => {
  try {
    const { patientId, recordId, recordType } = req.body;
    await submitFabric({
      functionName: 'LogAction',
      args: [uuidv4(), req.user.userId, 'ACCESS', recordId || patientId, recordType || 'PatientRecord', '{}', new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: req.user.userType,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to log access' });
  }
});

module.exports = router;
