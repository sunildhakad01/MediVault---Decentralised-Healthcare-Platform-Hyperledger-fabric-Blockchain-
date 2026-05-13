// GET /api/dev/export-store
// Dumps current RAM data to disk. Run once before restarting server.

import fs   from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const counts = {};

  // ── Export devDataStore (doctors, patients, hospitals, appointments) ─────────
  const mvStore = globalThis.__mvStore;
  if (mvStore) {
    const storeJson = {
      doctors:      Object.fromEntries(mvStore.doctors      || new Map()),
      patients:     Object.fromEntries(mvStore.patients     || new Map()),
      hospitals:    Object.fromEntries(mvStore.hospitals    || new Map()),
      appointments: Object.fromEntries(mvStore.appointments || new Map()),
      sequences:    Object.fromEntries(mvStore.sequences    || new Map()),
    };
    fs.writeFileSync(path.join(dataDir, 'store.json'), JSON.stringify(storeJson, null, 2), 'utf8');
    counts.doctors      = Object.keys(storeJson.doctors).length;
    counts.patients     = Object.keys(storeJson.patients).length;
    counts.hospitals    = Object.keys(storeJson.hospitals).length;
    counts.appointments = Object.keys(storeJson.appointments).length;
  }

  // ── Export devAuthStore (user accounts only — not OTP sessions) ──────────────
  const mvAuth = globalThis.__mvEphemeral;
  if (mvAuth) {
    const authJson = {
      users:          Object.fromEntries(mvAuth.users          || new Map()),
      usersByContact: Object.fromEntries(mvAuth.usersByContact || new Map()),
      seq:            mvAuth.seq || 0,
    };
    fs.writeFileSync(path.join(dataDir, 'auth.json'), JSON.stringify(authJson, null, 2), 'utf8');
    counts.users = Object.keys(authJson.users).length;
  }

  return res.status(200).json({
    success: true,
    message: 'All data exported to data/store.json and data/auth.json',
    saved: counts,
  });
}
