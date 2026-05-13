// DELETE /api/availability/[doctorId]/leave/[leaveId] — cancel leave request
// AUDIT FIX [Step 10]: Missing route — DoctorAvailability.jsx called this and got 404.

import { verifyJWT } from '../../../../../lib/devAuthStore';

if (!globalThis.__mvDoctorAvailability) {
  globalThis.__mvDoctorAvailability = new Map();
}
const availStore = globalThis.__mvDoctorAvailability;

export default function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const authUser = verifyJWT(token);
  if (!authUser) return res.status(401).json({ error: 'Authentication required' });

  const { doctorId, leaveId } = req.query;
  const avail = availStore.get(doctorId);
  if (!avail) return res.status(404).json({ error: 'No availability record found' });

  const idx = avail.leaveRequests.findIndex(l => l.id === leaveId);
  if (idx === -1) return res.status(404).json({ error: 'Leave request not found' });

  const [removed] = avail.leaveRequests.splice(idx, 1);
  return res.status(200).json({ success: true, data: removed, message: 'Leave cancelled' });
}
