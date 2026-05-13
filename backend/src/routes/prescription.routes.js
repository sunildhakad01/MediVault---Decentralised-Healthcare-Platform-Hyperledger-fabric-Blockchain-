const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { submitFabric } = require('../services/fabricQueue.service');
const { notify } = require('../services/notification.service');
const { generatePrescriptionPDF } = require('../services/pdf.service');
const logger = require('../utils/logger.util');
const crypto = require('crypto');

// POST /api/prescriptions
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, appointmentId, medicines, specialInstructions, followUpDate } = req.body;
    if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, error: 'patientId and at least one medicine are required' });
    }

    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.userId } });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    if (doctor.status !== 'approved') return res.status(403).json({ success: false, error: 'Doctor must be approved to issue prescriptions' });

    const id = 'RX-' + uuidv4().substring(0, 8).toUpperCase();
    const medicineHash = crypto.createHash('sha256').update(JSON.stringify(medicines)).digest('hex');

    const prescription = await prisma.prescription.create({
      data: {
        id, appointmentId: appointmentId || null, patientId,
        doctorId: doctor.id, hospitalId: doctor.hospitalId || null,
        medicines, specialInstructions: specialInstructions || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
    });

    const fabricResult = await submitFabric({
      functionName: 'createPrescription',
      args: [id, patientId, doctor.id, doctor.hospitalId || doctor.clinicName || '', medicineHash, new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'doctor',
    });
    if (fabricResult?.txId) {
      await prisma.prescription.update({ where: { id }, data: { fabricTxId: fabricResult.txId } });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      notify({
        userId: patient.userId, userType: 'patient', type: 'prescription',
        title: 'New Prescription',
        message: `Dr. ${doctor.fullName} has issued a prescription with ${medicines.length} medicine(s). Prescription ID: ${id}`,
        sendSmsFlag: true, phone: patient.phone,
        emailSubject: 'New Prescription from MediVault',
        emailBody: `<p>Dear Patient,</p><p>Dr. <strong>${doctor.fullName}</strong> has issued you a prescription (ID: <strong>${id}</strong>) with ${medicines.length} medicine(s).</p>`,
        sendEmailFlag: !!patient.email, email: patient.email,
        metadata: { prescriptionId: id, doctorId: doctor.id, doctorName: doctor.fullName },
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: prescription, message: 'Prescription created' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create prescription' });
  }
});

// GET /api/prescriptions/doctor/:doctorId — must be before /:id
router.get('/doctor/:doctorId', authenticate, async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: req.params.doctorId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: prescriptions });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch prescriptions' });
  }
});

// GET /api/prescriptions/:id/pdf
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found' });

    const [requestorDoctor, requestorPatient] = await Promise.all([
      prisma.doctor.findFirst({ where: { userId: req.user.userId } }),
      prisma.patient.findFirst({ where: { userId: req.user.userId } }),
    ]);

    const isOwnerDoctor  = requestorDoctor  && requestorDoctor.id  === prescription.doctorId;
    const isOwnerPatient = requestorPatient && requestorPatient.id === prescription.patientId;
    if (!isOwnerDoctor && !isOwnerPatient && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [doctor, patient] = await Promise.all([
      prescription.doctorId  ? prisma.doctor.findUnique({ where: { id: prescription.doctorId } })  : null,
      prescription.patientId ? prisma.patient.findUnique({ where: { id: prescription.patientId } }) : null,
    ]);

    const pdfBuffer = await generatePrescriptionPDF({
      prescription,
      doctorName:           doctor ? doctor.fullName             : '—',
      doctorRegNo:          doctor ? doctor.medicalCouncilRegNo  : '—',
      doctorSpecialization: doctor ? doctor.specialization       : '—',
      patientName:          patient ? patient.fullName           : null,
      signatureDataUrl:     doctor ? doctor.digitalSignatureUrl  : null,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Prescription-${req.params.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    logger.error('PDF generation failed:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
});

// GET /api/prescriptions/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found' });

    const doctor = prescription.doctorId
      ? await prisma.doctor.findUnique({ where: { id: prescription.doctorId }, select: { fullName: true } })
      : null;

    res.json({ success: true, data: { ...prescription, doctorName: doctor?.fullName || null } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch prescription' });
  }
});

module.exports = router;
