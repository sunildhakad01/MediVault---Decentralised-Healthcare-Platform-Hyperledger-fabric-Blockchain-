const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { notify } = require('../services/notification.service');
const logger = require('../utils/logger.util');

// POST /api/invoices
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, appointmentId, lineItems, gstPercent } = req.body;
    if (!patientId || !doctorId || !lineItems || !lineItems.length) {
      return res.status(400).json({ success: false, error: 'patientId, doctorId, and lineItems are required' });
    }

    const gst = parseFloat(gstPercent || 18);
    const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const gstAmount = parseFloat((subtotal * gst / 100).toFixed(2));
    const totalAmount = parseFloat((subtotal + gstAmount).toFixed(2));

    let gstin = null;
    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { gstin: true } });
      gstin = hospital?.gstin || null;
    }

    const id = 'INV-' + uuidv4().substring(0, 8).toUpperCase();
    const invoice = await prisma.invoice.create({
      data: {
        id, patientId, doctorId, hospitalId: hospitalId || null,
        appointmentId: appointmentId || null,
        lineItems, subtotal, gstPercent: gst, gstAmount, totalAmount,
        currency: 'INR', status: 'pending', gstin,
      },
    });

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      notify({
        userId: patient.userId, userType: 'patient', type: 'payment',
        title: 'Invoice Generated',
        message: `Invoice ${id} for ₹${totalAmount.toLocaleString('en-IN')} is ready. Please complete payment.`,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

// GET /api/invoices/admin/revenue — must be before /:id
router.get('/admin/revenue', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayAgg, weekAgg, monthAgg, failedPayments] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: today } } }),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: weekStart } } }),
      prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'paid', paidAt: { gte: monthStart } } }),
      prisma.invoice.findMany({
        where: { status: 'failed' },
        select: { id: true, patientId: true, totalAmount: true, createdAt: true },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue:  todayAgg._sum.totalAmount  || 0,
        weekRevenue:   weekAgg._sum.totalAmount   || 0,
        monthRevenue:  monthAgg._sum.totalAmount  || 0,
        failedPayments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch revenue data' });
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// PUT /api/invoices/:id/pay
router.put('/:id/pay', authenticate, async (req, res) => {
  try {
    const { paymentMethod, paymentReference, upiRef } = req.body;
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (existing.status === 'paid') return res.status(400).json({ success: false, error: 'Invoice already paid' });

    const paidAt = new Date();
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'paid', paymentMethod: paymentMethod || 'unknown', paymentReference: paymentReference || null, upiRef: upiRef || null, paidAt },
    });

    const patient = await prisma.patient.findUnique({ where: { id: invoice.patientId } });
    if (patient) {
      const istTime = paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
      notify({
        userId: patient.userId, userType: 'patient', type: 'payment',
        title: 'Payment Confirmed',
        message: `Payment of ₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')} confirmed. Ref: ${paymentReference || invoice.id}. ${istTime} IST`,
        sendEmailFlag: true, email: patient.email,
        emailSubject: 'Payment Confirmation – MediVault',
      }).catch(() => {});
    }

    res.json({ success: true, data: invoice, message: 'Payment recorded' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

module.exports = router;
