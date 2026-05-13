// GET /api/prescriptions/[prescriptionId]/pdf — generate PDF for a prescription
// AUDIT FIX [Step 10]: Missing route — DoctorPrescribeMedicine.jsx called this and got 404.
// Returns a minimal plain-text response as PDF generation requires PDFKit (backend-only).
// In dev mode this returns a text/plain stub so the download doesn't crash the UI.

import { verifyJWT } from '../../../../lib/devAuthStore';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { prescriptionId } = req.query;
  const rx = globalThis.__mvPrescriptions?.get(prescriptionId);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });

  // Build a plain-text prescription stub (PDF generation is Express-backend-only)
  const lines = [
    'MEDIVAULT PRESCRIPTION',
    '======================',
    `Prescription ID : ${rx.id}`,
    `Date            : ${rx.date}`,
    `Patient ID      : ${rx.patientId}`,
    `Doctor ID       : ${rx.doctorId}`,
    '',
    `Diagnosis: ${rx.diagnosis || 'N/A'}`,
    '',
    'Medicines:',
    ...(rx.medicines || []).map((m, i) =>
      `  ${i + 1}. ${m.name || m.medicineName || 'Unknown'} — ${m.dosage || ''} ${m.duration || ''} ${m.instructions || ''}`.trim()
    ),
    '',
    `Notes: ${rx.notes || 'None'}`,
    `Follow-up: ${rx.followUpDate || 'Not scheduled'}`,
    '',
    '(This is a dev-mode text stub. Full PDF is available in the Express backend.)',
  ].join('\n');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
  return res.status(200).send(Buffer.from(lines, 'utf-8'));
}
