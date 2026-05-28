const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function getPublicProfile(req, res) {
  const username = String(req.params.username || '').trim();
  if (!username) return res.status(400).json({ error: 'bad_username' });

  try {
    const { rows } = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, allow_messages, is_banned, created_at
       FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    const user = rows[0];
    if (!user || user.is_banned) return res.status(404).json({ error: 'user_not_found' });
    delete user.is_banned;
    res.json({ user });
  } catch (err) {
    console.error('[users/public]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function updateProfile(req, res) {
  const display_name =
    req.body.display_name !== undefined ? String(req.body.display_name).trim().slice(0, 60) : undefined;
  const bio =
    req.body.bio !== undefined ? String(req.body.bio).trim().slice(0, 200) : undefined;
  const allow_messages =
    req.body.allow_messages !== undefined ? Boolean(req.body.allow_messages) : undefined;
  const avatar_url =
    req.body.avatar_url !== undefined ? String(req.body.avatar_url).trim().slice(0, 200000) || null : undefined;

  const sets = [];
  const params = [];
  if (display_name !== undefined) {
    params.push(display_name || null);
    sets.push(`display_name = $${params.length}`);
  }
  if (bio !== undefined) {
    params.push(bio || null);
    sets.push(`bio = $${params.length}`);
  }
  if (allow_messages !== undefined) {
    params.push(allow_messages);
    sets.push(`allow_messages = $${params.length}`);
  }
  if (avatar_url !== undefined) {
    params.push(avatar_url);
    sets.push(`avatar_url = $${params.length}`);
  }
  if (!sets.length) return res.json({ ok: true });

  params.push(req.userId);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, username, email, display_name, bio, avatar_url, allow_messages, created_at`,
      params
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[users/update]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function changePassword(req, res) {
  const current = String(req.body.current || '');
  const next = String(req.body.next || '');
  if (next.length < 8) return res.status(400).json({ error: 'weak_password' });

  try {
    const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });

    const ok = await bcrypt.compare(current, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'wrong_current_password' });

    const hash = await bcrypt.hash(next, 10);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[users/changePassword]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function deleteAccount(req, res) {
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[users/delete]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { getPublicProfile, updateProfile, changePassword, deleteAccount };
