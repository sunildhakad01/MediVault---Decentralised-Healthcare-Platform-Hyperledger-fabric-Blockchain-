// POST /api/lab/orders — create a lab order (doctor-side)
// AUDIT FIX [Step 10]: Missing route — DoctorLabOrders.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvLabOrders) {
  globalThis.__mvLabOrders = new Map(); // orderId → LabOrder
}
const orderStore = globalThis.__mvLabOrders;

if (!globalThis.__mvLabOrdersByPatient) {
  globalThis.__mvLabOrdersByPatient = new Map(); // patientId → orderId[]
}
const byPatient = globalThis.__mvLabOrdersByPatient;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { patientId, doctorId, appointmentId, tests, urgency, clinicalNotes, hospitalId } = req.body || {};

  if (!patientId || !tests?.length) {
    return res.status(400).json({ error: 'patientId and at least one test are required' });
  }

  const orderId = `LAB-${Date.now()}`;
  const order = {
    id: orderId,
    patientId,
    doctorId: doctorId || authUser.id,
    appointmentId: appointmentId || null,
    hospitalId: hospitalId || null,
    tests,
    urgency: urgency || 'routine',
    clinicalNotes: clinicalNotes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orderStore.set(orderId, order);
  if (!byPatient.has(patientId)) byPatient.set(patientId, []);
  byPatient.get(patientId).unshift(orderId);

  return res.status(201).json({ success: true, data: order, message: 'Lab order created' });
}
