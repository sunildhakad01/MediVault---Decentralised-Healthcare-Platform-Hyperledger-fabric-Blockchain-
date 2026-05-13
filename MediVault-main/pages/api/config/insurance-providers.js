// GET  /api/config/insurance-providers — list insurance providers
// POST /api/config/insurance-providers — add provider
// AUDIT FIX [Step 10]: Missing route — AdminConfig.jsx called this and got 404.

import { verifyJWT } from '../../../lib/devAuthStore';

if (!globalThis.__mvConfigInsurance) {
  globalThis.__mvConfigInsurance = [
    { id: 'INS-001', name: 'Star Health Insurance',          code: 'STAR', type: 'general' },
    { id: 'INS-002', name: 'HDFC ERGO Health Insurance',     code: 'HDFC', type: 'general' },
    { id: 'INS-003', name: 'ICICI Lombard Health Insurance', code: 'ICICI', type: 'general' },
    { id: 'INS-004', name: 'Bajaj Allianz Health Insurance', code: 'BAJAJ', type: 'general' },
    { id: 'INS-005', name: 'Niva Bupa Health Insurance',     code: 'NIVA',  type: 'health' },
    { id: 'INS-006', name: 'Ayushman Bharat (PMJAY)',        code: 'PMJAY', type: 'govt' },
    { id: 'INS-007', name: 'CGHS',                           code: 'CGHS',  type: 'govt' },
    { id: 'INS-008', name: 'ESIC',                           code: 'ESIC',  type: 'govt' },
  ];
}
const insStore = globalThis.__mvConfigInsurance;

export default function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = req.headers['x-admin-session'];
  const authUser = verifyJWT(token);
  if (req.method !== 'GET' && !authUser && !session) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: insStore });
  }

  if (req.method === 'POST') {
    const { name, code, type } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const provider = { id: `INS-${Date.now()}`, name: name.trim(), code: code || '', type: type || 'general', createdAt: new Date().toISOString() };
    insStore.push(provider);
    return res.status(201).json({ success: true, data: provider });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
