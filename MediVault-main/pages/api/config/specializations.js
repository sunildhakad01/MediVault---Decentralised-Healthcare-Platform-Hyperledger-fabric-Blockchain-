// GET    /api/config/specializations        — list specializations
// POST   /api/config/specializations        — add specialization
// PUT    /api/config/specializations/[id]   — update (handled in [id].js)
// DELETE /api/config/specializations/[id]  — remove (handled in [id].js)
// AUDIT FIX [Step 10]: Missing route — AdminConfig.jsx called these and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvConfigSpecializations) {
  globalThis.__mvConfigSpecializations = [
    { id: 'SPEC-001', name: 'Cardiology',      description: 'Heart and cardiovascular system' },
    { id: 'SPEC-002', name: 'Neurology',        description: 'Brain and nervous system' },
    { id: 'SPEC-003', name: 'Orthopaedics',     description: 'Bones and musculoskeletal system' },
    { id: 'SPEC-004', name: 'Dermatology',      description: 'Skin conditions' },
    { id: 'SPEC-005', name: 'Paediatrics',      description: 'Children\'s health' },
    { id: 'SPEC-006', name: 'Gynaecology',      description: 'Women\'s reproductive health' },
    { id: 'SPEC-007', name: 'General Medicine', description: 'General health and primary care' },
    { id: 'SPEC-008', name: 'Oncology',         description: 'Cancer treatment' },
    { id: 'SPEC-009', name: 'Psychiatry',       description: 'Mental health' },
    { id: 'SPEC-010', name: 'Radiology',        description: 'Medical imaging' },
  ];
}
const specStore = globalThis.__mvConfigSpecializations;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  // Config reads are public; writes require auth
  if (req.method !== 'GET' && !authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: specStore });
  }

  if (req.method === 'POST') {
    const { name, description } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const spec = { id: `SPEC-${Date.now()}`, name: name.trim(), description: description || '', createdAt: new Date().toISOString() };
    specStore.push(spec);
    return res.status(201).json({ success: true, data: spec });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
