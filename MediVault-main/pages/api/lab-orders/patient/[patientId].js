// GET /api/lab-orders/patient/[patientId] — list lab orders for a patient (doctor-side view)
// AUDIT FIX [Step 10]: Missing route — DoctorLabOrders.jsx called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvLabOrders) {
  globalThis.__mvLabOrders = new Map();
}
if (!globalThis.__mvLabOrdersByPatient) {
  globalThis.__mvLabOrdersByPatient = new Map();
}
const orderStore = globalThis.__mvLabOrders;
const byPatient = globalThis.__mvLabOrdersByPatient;

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { patientId } = req.query;
  const ids = byPatient.get(patientId) || [];
  const orders = ids.map(id => orderStore.get(id)).filter(Boolean);

  return res.status(200).json({ success: true, data: orders });
}
