// GET /api/availability/[doctorId] — get doctor availability schedule
// PUT /api/availability/[doctorId] — update doctor availability schedule
// AUDIT FIX [Step 10]: Missing route — DoctorAvailability.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvDoctorAvailability) {
  globalThis.__mvDoctorAvailability = new Map(); // doctorId → AvailabilityEntry
}
const availStore = globalThis.__mvDoctorAvailability;

const DEFAULT_SCHEDULE = {
  Mon: { available: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
  Tue: { available: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
  Wed: { available: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
  Thu: { available: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
  Fri: { available: true,  slots: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:00' }] },
  Sat: { available: true,  slots: [{ start: '09:00', end: '13:00' }] },
  Sun: { available: false, slots: [] },
};

function getAvail(doctorId) {
  if (!availStore.has(doctorId)) {
    availStore.set(doctorId, {
      doctorId,
      schedule: DEFAULT_SCHEDULE,
      slotDurationMinutes: 20,
      leaveRequests: [],
      updatedAt: new Date().toISOString(),
    });
  }
  return availStore.get(doctorId);
}

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: getAvail(doctorId) });
  }

  if (req.method === 'PUT') {
    const { schedule, slotDurationMinutes } = req.body || {};
    const avail = getAvail(doctorId);
    if (schedule) avail.schedule = schedule;
    if (slotDurationMinutes) avail.slotDurationMinutes = slotDurationMinutes;
    avail.updatedAt = new Date().toISOString();
    return res.status(200).json({ success: true, data: avail, message: 'Availability updated' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
