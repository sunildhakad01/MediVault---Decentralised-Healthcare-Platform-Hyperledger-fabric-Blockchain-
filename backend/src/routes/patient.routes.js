const router = require('express').Router();
const prisma  = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { submitFabric }  = require('../services/fabricQueue.service');
const { notify }        = require('../services/notification.service');
const logger = require('../utils/logger.util');

const generatePatientId = () => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PAT-${dateStr}-${rand}`;
};

// POST /api/patient/register
router.post('/register', async (req, res) => {
  try {
    const { userId, fullName, phone, dob, gender, bloodGroup, email, address, city, state, pincode, aadhaarLast4, emergencyContact } = req.body;
    if (!userId || !fullName || !phone)
      return res.status(400).json({ success: false, error: 'Missing required fields (userId, fullName, phone)' });
    if (!/^\+91[2-9]\d{9}$/.test(phone))
      return res.status(400).json({ success: false, error: 'Invalid phone number' });

    const existing = await prisma.patient.findFirst({ where: { userId } });
    if (existing) return res.status(409).json({ success: false, error: 'Patient profile already exists' });

    const patient = await prisma.patient.create({
      data: {
        userId, uniquePatientId: generatePatientId(), fullName, phone, dob, gender,
        bloodGroup, email, address, city, state, pincode,
        aadhaarLast4: aadhaarLast4 ? String(aadhaarLast4).slice(-4) : null,
        emergencyContact: emergencyContact || {},
      },
    });

    res.status(201).json({ success: true, data: { id: patient.id, uniquePatientId: patient.uniquePatientId }, message: 'Patient registered' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// GET /api/patient/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found' });
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/patient/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found' });
    const allowed = ['fullName', 'dob', 'gender', 'bloodGroup', 'alternatePhone', 'email', 'address', 'city', 'state', 'pincode', 'profilePhotoUrl', 'emergencyContact'];
    const data = {};
    for (const f of allowed) { if (req.body[f] !== undefined) data[f] = req.body[f]; }
    const updated = await prisma.patient.update({ where: { id: patient.id }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// GET /api/patient/appointments
router.get('/appointments', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: [{ appointmentDate: 'desc' }, { slotStart: 'desc' }],
    });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
});

// POST /api/patient/appointments
router.post('/appointments', authenticate, async (req, res) => {
  try {
    const { doctorId, hospitalId, appointmentDate, slotStart, slotEnd, reason } = req.body;
    if (!doctorId || !appointmentDate || !slotStart || !slotEnd)
      return res.status(400).json({ success: false, error: 'Missing required fields' });

    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found. Please complete profile first.' });

    const appointment = await prisma.appointment.create({
      data: { patientId: patient.id, doctorId, hospitalId, appointmentDate, slotStart, slotEnd, reason, status: 'scheduled' },
    });

    submitFabric({
      channel: 'appointments', functionName: 'logAppointmentEvent',
      args: [appointment.id, patient.id, doctorId, hospitalId || '', 'scheduled', req.user.userId, new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'patient',
    }).catch(() => {});

    notify({
      userId: req.user.userId, userType: 'patient', type: 'appointment',
      title: 'Appointment Booked',
      message: `Your appointment on ${appointmentDate} at ${slotStart} has been booked. ID: ${appointment.id}`,
      metadata: { appointmentId: appointment.id, doctorId, appointmentDate, slotStart },
    }).catch(() => {});

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Booking failed' });
  }
});

// PUT /api/patient/appointments/:id/cancel
router.put('/appointments/:id/cancel', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    const appt    = await prisma.appointment.findFirst({ where: { id: req.params.id, patientId: patient?.id } });
    if (!appt) return res.status(404).json({ success: false, error: 'Appointment not found' });

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'cancelled', cancelledBy: req.user.userId, cancellationReason: reason },
    });

    submitFabric({
      channel: 'appointments', functionName: 'logAppointmentEvent',
      args: [appt.id, appt.patientId, appt.doctorId, appt.hospitalId || '', 'cancelled', req.user.userId, new Date().toISOString()],
      initiatedById: req.user.userId, initiatedByRole: 'patient',
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Cancellation failed' });
  }
});

// GET /api/patient/prescriptions
router.get('/prescriptions', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    submitFabric({ channel: 'access-logs', functionName: 'logAccess', args: [patient.id, 'prescriptions', req.user.userId, 'patient', 'prescription_list', new Date().toISOString()], initiatedById: req.user.userId, initiatedByRole: 'patient' }).catch(() => {});

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });

    const doctorIds = [...new Set(prescriptions.map(p => p.doctorId).filter(Boolean))];
    const doctors   = doctorIds.length ? await prisma.doctor.findMany({ where: { id: { in: doctorIds } }, select: { id: true, fullName: true } }) : [];
    const doctorMap = Object.fromEntries(doctors.map(d => [d.id, d.fullName]));

    res.json({ success: true, data: prescriptions.map(p => ({ ...p, doctorName: doctorMap[p.doctorId] || null })) });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch prescriptions' });
  }
});

// GET /api/patient/lab-reports
router.get('/lab-reports', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    submitFabric({ channel: 'access-logs', functionName: 'logAccess', args: [patient.id, 'lab-reports', req.user.userId, 'patient', 'lab_report_list', new Date().toISOString()], initiatedById: req.user.userId, initiatedByRole: 'patient' }).catch(() => {});
    const reports = await prisma.labReport.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch lab reports' });
  }
});

// GET /api/patient/invoices
router.get('/invoices', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    const invoices = await prisma.invoice.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// GET /api/patient/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({ where: { userId: req.user.userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PUT /api/patient/notifications/read-all
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.userId, read: false }, data: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

// GET /api/patient/medication-reminders
router.get('/medication-reminders', authenticate, async (req, res) => {
  try {
    const reminders = await prisma.medicationReminder.findMany({ where: { patientUserId: req.user.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: reminders });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch medication reminders' });
  }
});

// POST /api/patient/medication-reminders
router.post('/medication-reminders', authenticate, async (req, res) => {
  try {
    const { prescriptionId, medicineName, frequency, reminderTimes, note } = req.body;
    if (!prescriptionId || !medicineName || !Array.isArray(reminderTimes) || reminderTimes.length === 0)
      return res.status(400).json({ success: false, error: 'prescriptionId, medicineName, and at least one reminderTime are required' });

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    for (const t of reminderTimes) {
      if (!timeRegex.test(t)) return res.status(400).json({ success: false, error: `Invalid time format: ${t}. Use HH:MM` });
    }

    const patient = await prisma.patient.findFirst({ where: { userId: req.user.userId } });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const prescription = await prisma.prescription.findFirst({ where: { id: prescriptionId, patientId: patient.id } });
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found for this patient' });

    const existing = await prisma.medicationReminder.findFirst({ where: { patientUserId: req.user.userId, prescriptionId, medicineName } });
    let reminder, created;
    if (existing) {
      reminder = await prisma.medicationReminder.update({ where: { id: existing.id }, data: { reminderTimes, frequency: frequency || existing.frequency, note: note !== undefined ? note : existing.note, active: true } });
      created = false;
    } else {
      reminder = await prisma.medicationReminder.create({ data: { patientUserId: req.user.userId, patientId: patient.id, prescriptionId, medicineName, frequency: frequency || 'OD', reminderTimes, note: note || null, active: true } });
      created = true;
    }

    res.status(created ? 201 : 200).json({ success: true, data: reminder, message: created ? 'Reminder created' : 'Reminder updated' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to save medication reminder' });
  }
});

// DELETE /api/patient/medication-reminders/:id
router.delete('/medication-reminders/:id', authenticate, async (req, res) => {
  try {
    const reminder = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, patientUserId: req.user.userId } });
    if (!reminder) return res.status(404).json({ success: false, error: 'Reminder not found' });
    await prisma.medicationReminder.update({ where: { id: reminder.id }, data: { active: false } });
    res.json({ success: true, message: 'Reminder deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete reminder' });
  }
});

// PUT /api/patient/medication-reminders/:id/toggle
router.put('/medication-reminders/:id/toggle', authenticate, async (req, res) => {
  try {
    const reminder = await prisma.medicationReminder.findFirst({ where: { id: req.params.id, patientUserId: req.user.userId } });
    if (!reminder) return res.status(404).json({ success: false, error: 'Reminder not found' });
    const updated = await prisma.medicationReminder.update({ where: { id: reminder.id }, data: { active: !reminder.active } });
    res.json({ success: true, data: updated, message: `Reminder ${updated.active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle reminder' });
  }
});

module.exports = router;
