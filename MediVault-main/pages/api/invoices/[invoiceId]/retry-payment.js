// POST /api/invoices/[invoiceId]/retry-payment — retry payment for an invoice
// AUDIT FIX [Step 10]: Missing route — AdminRevenue.jsx called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { invoiceId } = req.query;

  return res.status(200).json({
    success: true,
    data: { invoiceId, status: 'retry_queued' },
    message: 'Payment retry queued (dev stub)',
  });
}
