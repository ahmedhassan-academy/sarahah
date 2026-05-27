const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';
const needsSSL = url && !url.includes('localhost') && !url.includes('127.0.0.1');

const pool = new Pool({
  connectionString: url,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] pool error', err);
});

module.exports = pool;
