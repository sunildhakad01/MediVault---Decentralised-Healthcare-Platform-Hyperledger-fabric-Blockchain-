// lib/db.js — PostgreSQL connection pool
const { Pool } = require('pg');

if (!globalThis.__mvPgPool) {
  globalThis.__mvPgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  globalThis.__mvPgPool.on('error', (err) => {
    console.error('[MediVault] Postgres pool error:', err.message);
  });
}

const pool = globalThis.__mvPgPool;

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

module.exports = { pool, query };
