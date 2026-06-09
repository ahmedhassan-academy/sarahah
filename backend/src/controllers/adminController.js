const pool = require('../config/db');
const { getNetForIps } = require('../utils/ipNet');

async function getStats(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users_total,
        (SELECT COUNT(*)::int FROM users WHERE is_banned = TRUE) AS users_banned,
        (SELECT COUNT(*)::int FROM users WHERE is_admin = TRUE) AS users_admin,
        (SELECT COUNT(*)::int FROM messages) AS messages_total,
        (SELECT COUNT(*)::int FROM messages WHERE is_hidden = TRUE) AS messages_hidden,
        (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS users_last_7d,
        (SELECT COUNT(*)::int FROM messages WHERE created_at > NOW() - INTERVAL '7 days') AS messages_last_7d
    `);
    res.json({ stats: rows[0] });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function listUsers(req, res) {
  const q = String(req.query.q || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);

  try {
    const params = [];
    let where = '1=1';
    if (q) {
      params.push(`%${q}%`);
      where = `(LOWER(u.username) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
         u.id, u.username, u.email, u.display_name, u.is_admin, u.is_banned,
         u.allow_messages, u.created_at, u.banned_at,
         (SELECT COUNT(*)::int FROM messages WHERE recipient_id = u.id) AS msgs_received,
         (SELECT COUNT(*)::int FROM messages WHERE sender_id = u.id) AS msgs_sent
       FROM users u
       WHERE ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('[admin/listUsers]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function listMessages(req, res) {
  const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);
  const q = String(req.query.q || '').trim().toLowerCase();
  const fingerprint = String(req.query.fingerprint || '').trim();

  try {
    const params = [];
    const conds = [];
    if (q) {
      params.push(`%${q}%`);
      conds.push(`LOWER(m.body) LIKE $${params.length}`);
    }
    if (fingerprint) {
      params.push(fingerprint);
      conds.push(`m.sender_fingerprint = $${params.length}`);
    }
    const where = conds.length ? conds.join(' AND ') : '1=1';
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
         m.id, m.body, m.is_read, m.is_favorite, m.is_hidden, m.created_at,
         m.sender_id, m.recipient_id,
         m.sender_email, m.sender_name, m.sender_picture, m.sender_google_sub,
         m.sender_ip, m.sender_user_agent, m.sender_fingerprint,
         r.username AS recipient_username,
         s.username AS sender_username,
         (SELECT EXISTS (
            SELECT 1 FROM banned_fingerprints bf WHERE bf.fingerprint = m.sender_fingerprint
         )) AS fingerprint_banned
       FROM messages m
       JOIN users r ON r.id = m.recipient_id
       LEFT JOIN users s ON s.id = m.sender_id
       WHERE ${where}
       ORDER BY m.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Enrich each message with the sender IP's network info (company/ISP +
    // Wi-Fi vs mobile-data), served from cache where possible.
    const netMap = await getNetForIps(rows.map((m) => m.sender_ip));
    const messages = rows.map((m) => ({
      ...m,
      net: m.sender_ip ? netMap.get(m.sender_ip) || null : null,
    }));

    res.json({ messages });
  } catch (err) {
    console.error('[admin/listMessages]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function banFingerprint(req, res) {
  const fingerprint = String(req.params.fingerprint || '').trim();
  const reason = req.body?.reason ? String(req.body.reason).slice(0, 200) : null;
  if (!fingerprint || fingerprint.length > 128) {
    return res.status(400).json({ error: 'bad_fingerprint' });
  }
  try {
    await pool.query(
      `INSERT INTO banned_fingerprints (fingerprint, banned_by, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (fingerprint) DO UPDATE
         SET banned_at = NOW(), banned_by = EXCLUDED.banned_by, reason = EXCLUDED.reason`,
      [fingerprint, req.userId, reason]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/banFingerprint]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function unbanFingerprint(req, res) {
  const fingerprint = String(req.params.fingerprint || '').trim();
  if (!fingerprint) return res.status(400).json({ error: 'bad_fingerprint' });
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM banned_fingerprints WHERE fingerprint = $1`,
      [fingerprint]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/unbanFingerprint]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function banUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  if (id === req.userId) return res.status(400).json({ error: 'cannot_ban_self' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET is_banned = TRUE, banned_at = NOW() WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/banUser]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function unbanUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET is_banned = FALSE, banned_at = NULL WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/unbanUser]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function setAdmin(req, res) {
  const id = parseInt(req.params.id, 10);
  const value = Boolean(req.body.is_admin);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  if (id === req.userId && !value) return res.status(400).json({ error: 'cannot_demote_self' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE users SET is_admin = $1 WHERE id = $2`,
      [value, id]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/setAdmin]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function deleteMessage(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rowCount } = await pool.query(`DELETE FROM messages WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[admin/deleteMessage]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function toggleHide(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rows } = await pool.query(
      `UPDATE messages SET is_hidden = NOT is_hidden WHERE id = $1 RETURNING is_hidden`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ is_hidden: rows[0].is_hidden });
  } catch (err) {
    console.error('[admin/toggleHide]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = {
  getStats,
  listUsers,
  listMessages,
  banUser,
  unbanUser,
  setAdmin,
  deleteMessage,
  toggleHide,
  banFingerprint,
  unbanFingerprint,
};
