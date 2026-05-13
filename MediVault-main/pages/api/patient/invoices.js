// GET /api/patient/invoices — list invoices for authenticated patient
// AUDIT FIX [Step 8]: Missing route — PatientInvoices.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';
import { getPatientByUserId } from '../../../lib/devDataStore';

if (!globalThis.__mvPatientInvoices) {
  globalThis.__mvPatientInvoices = new Map(); // patientId → Invoice[]
}
const invoiceStore = globalThis.__mvPatientInvoices;

export { invoiceStore as __patientInvoiceStore };

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const patient = getPatientByUserId(authUser.id);
  const patientId = patient?.id || authUser.patientId || authUser.id;

  const invoices = (invoiceStore.get(patientId) || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return res.status(200).json({ success: true, data: invoices });
}
