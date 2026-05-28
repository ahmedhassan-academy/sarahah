const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sign } = require('../utils/jwt');
const { emailHandle } = require('../utils/identifier');

function withHandle(user) {
  if (!user) return user;
  return { ...user, handle: emailHandle(user.email) };
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_USERNAMES = new Set([
  'login', 'register', 'logout', 'inbox', 'settings', 'terms', 'privacy', 'help',
  'about', 'contact', 'admin', 'api', 'assets', 'static', 'public',
  'favicon', 'robots', 'sitemap', 'me', 'user', 'users',
]);

async function register(req, res) {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const display_name = String(req.body.display_name || '').trim() || null;

  if (!USERNAME_RE.test(username) || RESERVED_USERNAMES.has(username.toLowerCase())) {
    return res.status(400).json({ error: 'invalid_username' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'weak_password' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, bio, avatar_url, allow_messages, is_admin, is_banned, created_at`,
      [username, email, hash, display_name]
    );
    const user = withHandle(rows[0]);
    const token = sign({ uid: user.id });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      const field = err.constraint && err.constraint.includes('email') ? 'email_taken' : 'username_taken';
      return res.status(409).json({ error: field });
    }
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function login(req, res) {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!identifier || !password) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash, display_name, bio, avatar_url, allow_messages, is_admin, is_banned, created_at
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = $1
       LIMIT 1`,
      [identifier]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

    if (user.is_banned) return res.status(403).json({ error: 'account_banned' });

    delete user.password_hash;
    const token = sign({ uid: user.id });
    res.json({ token, user: withHandle(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function me(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET last_seen = NOW()
       WHERE id = $1
       RETURNING id, username, email, display_name, bio, avatar_url, allow_messages, is_admin, is_banned, created_at, last_seen, visit_count`,
      [req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ user: withHandle(rows[0]) });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { register, login, me };
