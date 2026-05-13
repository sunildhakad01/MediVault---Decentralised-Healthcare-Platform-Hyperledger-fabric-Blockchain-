// POST /api/consultations/log-access
// Non-blocking Fabric access log (dev: just acknowledge).

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // In dev: silently accept and return a mock tx ID
  return res.status(200).json({
    success: true,
    txId: `FABRIC-${Date.now().toString(16)}`,
  });
}
