// POST /api/availability/[doctorId]/leave — add leave request
// AUDIT FIX [Step 10]: Missing route — DoctorAvailability.jsx called this and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvDoctorAvailability) {
  globalThis.__mvDoctorAvailability = new Map();
}
const availStore = globalThis.__mvDoctorAvailability;

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId } = req.query;
  const { startDate, endDate, reason, type } = req.body || {};

  if (!startDate) return res.status(400).json({ error: 'startDate is required' });

  if (!availStore.has(doctorId)) {
    availStore.set(doctorId, { doctorId, schedule: {}, slotDurationMinutes: 20, leaveRequests: [], updatedAt: new Date().toISOString() });
  }
  const avail = availStore.get(doctorId);

  const leave = {
    id: `LEAVE-${Date.now()}`,
    doctorId,
    startDate,
    endDate: endDate || startDate,
    reason: reason || '',
    type: type || 'personal',
    status: 'approved',
    createdAt: new Date().toISOString(),
  };

  avail.leaveRequests.push(leave);
  avail.updatedAt = new Date().toISOString();

  return res.status(201).json({ success: true, data: leave, message: 'Leave request added' });
}
