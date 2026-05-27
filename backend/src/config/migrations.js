const pool = require('./db');

const SCHEMA_VERSION = 1;

async function ensureSchemaVersionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

async function getCurrentVersion() {
  const { rows } = await pool.query(
    `SELECT value FROM schema_meta WHERE key = 'version'`
  );
  return rows[0] ? parseInt(rows[0].value, 10) : 0;
}

async function setVersion(v) {
  await pool.query(
    `INSERT INTO schema_meta (key, value) VALUES ('version', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(v)]
  );
}

async function applyAll() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      allow_messages BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      body TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_created
      ON messages (recipient_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_username_lower
      ON users (LOWER(username))
  `);
}

async function runMigrations() {
  await ensureSchemaVersionTable();
  const current = await getCurrentVersion();

  if (current === SCHEMA_VERSION) {
    console.log(`[migrations] schema is up to date (v${current})`);
    return;
  }

  console.log(`[migrations] applying schema → v${SCHEMA_VERSION} (was v${current})`);
  await applyAll();
  await setVersion(SCHEMA_VERSION);
  console.log(`[migrations] done`);
}

module.exports = { runMigrations, SCHEMA_VERSION };
