const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const contractRoutes = require('./routes/contract.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const labReportRoutes = require('./routes/labReport.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const availabilityRoutes = require('./routes/availability.routes');
const consultationRoutes = require('./routes/consultation.routes');
const announcementRoutes = require('./routes/announcement.routes');
const staffRoutes = require('./routes/staff.routes');
const configRoutes = require('./routes/config.routes');
const bedRoutes = require('./routes/bed.routes');
const paymentRoutes = require('./routes/payment.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger.util');

const app = express();

// ── Security middlewares ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab', labReportRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/admin/announcements', announcementRoutes);
app.use('/api/hospital/staff', staffRoutes);
app.use('/api/config', configRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/payments', paymentRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
