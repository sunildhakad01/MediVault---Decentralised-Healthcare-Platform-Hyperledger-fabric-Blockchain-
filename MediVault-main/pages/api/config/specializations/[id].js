// PUT    /api/config/specializations/[id] — update specialization
// DELETE /api/config/specializations/[id] — remove specialization
// AUDIT FIX [Step 10]: Missing route — AdminConfig.jsx called these and got 404.

import { verifyJWT } from '../../../../lib/devAuthStore';

if (!globalThis.__mvConfigSpecializations) {
  globalThis.__mvConfigSpecializations = [];
}
const specStore = globalThis.__mvConfigSpecializations;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (!authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  const { id } = req.query;
  const idx = specStore.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Specialization not found' });

  if (req.method === 'PUT') {
    Object.assign(specStore[idx], req.body, { updatedAt: new Date().toISOString() });
    return res.status(200).json({ success: true, data: specStore[idx] });
  }

  if (req.method === 'DELETE') {
    const [removed] = specStore.splice(idx, 1);
    return res.status(200).json({ success: true, data: removed });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
