const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger.util');

// Razorpay initialization (graceful — no crash if key missing)
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    logger.info('Razorpay initialized');
  } else {
    logger.warn('Razorpay keys not set — payment gateway in mock mode');
  }
} catch (e) {
  logger.warn('Razorpay package not installed — payment gateway unavailable');
}

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, error: 'invoiceId required' });

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ success: false, error: 'Invoice already paid' });

    const amountPaise = Math.round(parseFloat(invoice.totalAmount) * 100);

    if (!razorpay) {
      const mockOrderId = 'order_mock_' + uuidv4().replace(/-/g, '').substring(0, 16);
      return res.json({ success: true, data: { orderId: mockOrderId, amount: amountPaise, currency: 'INR', invoiceId, keyId: 'rzp_test_mock', mockMode: true } });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise, currency: 'INR', receipt: invoiceId,
      notes: { invoiceId, patientId: invoice.patientId },
    });

    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, invoiceId, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod, upiRef, mockMode } = req.body;
    if (!invoiceId || !razorpayPaymentId) return res.status(400).json({ success: false, error: 'invoiceId and razorpayPaymentId required' });

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    if (!mockMode && razorpay && razorpaySignature) {
      const crypto = require('crypto');
      const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
      if (expectedSig !== razorpaySignature) return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    const paidAt = new Date();
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'paid', paymentMethod: paymentMethod || 'razorpay', paymentReference: razorpayPaymentId, upiRef: upiRef || null, paidAt },
    });

    const istTime = paidAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    res.json({ success: true, data: { invoiceId, paymentId: razorpayPaymentId, amount: updated.totalAmount, currency: 'INR', paidAt: istTime, upiRef: upiRef || null }, message: 'Payment verified and recorded' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// POST /api/payments/:id/retry-payment
router.post('/:id/retry-payment', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'pending', paymentReference: null, upiRef: null, paidAt: null },
    });
    res.json({ success: true, message: 'Invoice reset to pending. Patient can retry payment.', data: updated });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to retry payment' });
  }
});

// GET /api/payments/receipt/:invoiceId
router.get('/receipt/:invoiceId', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.invoiceId } });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (invoice.status !== 'paid') return res.status(400).json({ success: false, error: 'Invoice not paid' });

    const paidAtIST = invoice.paidAt
      ? new Date(invoice.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : null;

    res.json({
      success: true,
      data: {
        invoiceId: invoice.id, patientId: invoice.patientId, lineItems: invoice.lineItems,
        subtotal: invoice.subtotal, gstPercent: invoice.gstPercent, gstAmount: invoice.gstAmount,
        totalAmount: invoice.totalAmount, currency: 'INR',
        paymentMethod: invoice.paymentMethod, paymentReference: invoice.paymentReference,
        upiRef: invoice.upiRef, gstin: invoice.gstin, paidAt: paidAtIST, status: invoice.status,
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch receipt' });
  }
});

module.exports = router;
