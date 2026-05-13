const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { submitFabric } = require('../services/fabricQueue.service');
const { notify } = require('../services/notification.service');
const logger = require('../utils/logger.util');

// POST /api/lab/orders
router.post('/orders', authenticate, async (req, res) => {
  try {
    const { patientId, appointmentId, tests, urgency, clinicalNotes, fastingRequired, hospitalId } = req.body;
    if (!patientId || !tests || !tests.length) return res.status(400).json({ success: false, error: 'patientId and tests are required' });

    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.userId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });

    const id = 'LAB-' + uuidv4().substring(0, 8).toUpperCase();
    const order = await prisma.labOrder.create({
      data: {
        id, patientId, appointmentId: appointmentId || null,
        doctorId: doctor.id, hospitalId: hospitalId || doctor.hospitalId || null,
        tests, urgency: urgency || 'routine',
        clinicalNotes: clinicalNotes || null, fastingRequired: !!fastingRequired,
      },
    });

    submitFabric({
      functionName: 'logLabOrder',
      args: [id, patientId, doctor.id, hospitalId || doctor.hospitalId || '', JSON.stringify(tests), urgency || 'routine', new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'doctor',
    }).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create lab order' });
  }
});

// POST /api/lab/reports
router.post('/reports', authenticate, async (req, res) => {
  try {
    const { labOrderId, patientId, ipfsCid, pinataUrl, reportDate, testName, hospitalId } = req.body;
    if (!patientId || !ipfsCid || !testName) return res.status(400).json({ success: false, error: 'patientId, ipfsCid, and testName are required' });

    const id = 'RPT-' + uuidv4().substring(0, 8).toUpperCase();
    const report = await prisma.labReport.create({
      data: {
        id, labOrderId: labOrderId || null, patientId,
        uploadedBy: req.user.userId, hospitalId: hospitalId || null,
        ipfsCid, pinataUrl: pinataUrl || null,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        testName,
      },
    });

    if (labOrderId) {
      await prisma.labOrder.update({ where: { id: labOrderId }, data: { status: 'report_uploaded' } });
    }

    const fabricResult = await submitFabric({
      functionName: 'recordLabReport',
      args: [id, patientId, req.user.userId, hospitalId || '', ipfsCid, testName, new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'lab',
    });
    if (fabricResult?.txId) {
      await prisma.labReport.update({ where: { id }, data: { fabricTxId: fabricResult.txId } });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      notify({
        userId: patient.userId, userType: 'patient', type: 'report',
        title: 'Lab Report Available',
        message: `Your ${testName} report is now available. Report ID: ${id}`,
        sendSmsFlag: true, phone: patient.phone,
        emailSubject: 'Lab Report Available – MediVault',
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to upload lab report' });
  }
});

// GET /api/lab/orders/patient/:patientId — must be before /orders/:id
router.get('/orders/patient/:patientId', authenticate, async (req, res) => {
  try {
    const orders = await prisma.labOrder.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch lab orders' });
  }
});

// GET /api/lab/orders
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { hospitalId, status } = req.query;
    const where = {};
    if (hospitalId) where.hospitalId = hospitalId;
    if (status) where.status = status;
    const orders = await prisma.labOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// PUT /api/lab/orders/:id/status
router.put('/orders/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ordered', 'sample_collected', 'processing', 'completed', 'report_uploaded'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    await prisma.labOrder.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// GET /api/lab/reports/patient/:patientId — must be before /reports/:id
router.get('/reports/patient/:patientId', authenticate, async (req, res) => {
  try {
    const reports = await prisma.labReport.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch lab reports' });
  }
});

// GET /api/lab/reports/:id/verify
router.get('/reports/:id/verify', authenticate, async (req, res) => {
  try {
    const report = await prisma.labReport.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    const gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    res.json({
      success: true,
      data: {
        reportId: report.id, ipfsCid: report.ipfsCid, fabricTxId: report.fabricTxId,
        reportDate: report.reportDate, testName: report.testName,
        verificationUrl: `${gateway}/ipfs/${report.ipfsCid}`,
        pinataUrl: report.pinataUrl, onChain: !!report.fabricTxId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to verify report' });
  }
});

// GET /api/lab/reports/:id
router.get('/reports/:id', authenticate, async (req, res) => {
  try {
    const report = await prisma.labReport.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

module.exports = router;
