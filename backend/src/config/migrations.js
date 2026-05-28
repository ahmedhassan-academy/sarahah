const pool = require('./db');

const SCHEMA_VERSION = 6;

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

  // v2 — admin + ban + hide
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE`);

  // v3 — verified anonymous senders (Google) + admin-only IP / UA capture
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_email TEXT`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name TEXT`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_picture TEXT`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_google_sub TEXT`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_ip TEXT`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_user_agent TEXT`);

  // v4 — device fingerprint capture + per-device bans
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_fingerprint TEXT`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_fingerprint
      ON messages (sender_fingerprint)
      WHERE sender_fingerprint IS NOT NULL
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_fingerprints (
      fingerprint TEXT PRIMARY KEY,
      banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT
    )
  `);

  // v5 — presence + visit counter + public/private messages + sender saved copy
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS save_to_sent BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_public_created
      ON messages (recipient_id, created_at DESC)
      WHERE is_public = TRUE AND is_hidden = FALSE
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_sender_saved_created
      ON messages (sender_id, created_at DESC)
      WHERE save_to_sent = TRUE
  `);

  // v6 — persistent Google visitor sessions (anonymous senders signed in via Google)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS google_visitors (
      id SERIAL PRIMARY KEY,
      google_sub TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      picture TEXT,
      first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_banned BOOLEAN NOT NULL DEFAULT FALSE,
      banned_at TIMESTAMPTZ,
      banned_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

async function bootstrapAdmins() {
  const raw = (process.env.BOOTSTRAP_ADMIN_USERNAMES || '').trim();
  if (!raw) return;
  const names = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!names.length) return;
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET is_admin = TRUE
       WHERE LOWER(username) = ANY($1::text[]) AND is_admin = FALSE`,
      [names]
    );
    if (rowCount > 0) {
      console.log(`[admin] promoted ${rowCount} user(s) to admin via BOOTSTRAP_ADMIN_USERNAMES`);
    }
  } catch (err) {
    console.error('[admin] bootstrap failed', err);
  }
}

async function runMigrations() {
  await ensureSchemaVersionTable();
  const current = await getCurrentVersion();

  if (current === SCHEMA_VERSION) {
    console.log(`[migrations] schema is up to date (v${current})`);
  } else {
    console.log(`[migrations] applying schema → v${SCHEMA_VERSION} (was v${current})`);
    await applyAll();
    await setVersion(SCHEMA_VERSION);
    console.log(`[migrations] done`);
  }

  await bootstrapAdmins();
}

module.exports = { runMigrations, SCHEMA_VERSION };
