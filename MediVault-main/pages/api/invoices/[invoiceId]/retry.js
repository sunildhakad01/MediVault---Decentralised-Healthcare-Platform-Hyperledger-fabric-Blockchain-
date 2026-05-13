// POST /api/invoices/[invoiceId]/retry         — retry a failed invoice (analytics)
// POST /api/invoices/[invoiceId]/retry-payment — retry payment (revenue)
// AUDIT FIX [Step 10]: Missing routes — AdminAnalytics/AdminRevenue called these and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { invoiceId } = req.query;

  // Dev stub — real payment retries are handled by the Express backend
  return res.status(200).json({
    success: true,
    data: { invoiceId, status: 'retry_queued' },
    message: 'Payment retry queued (dev stub)',
  });
}
