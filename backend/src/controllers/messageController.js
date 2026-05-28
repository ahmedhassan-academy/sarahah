const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const MAX_BODY = 1000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function verifyGoogleIdToken(idToken) {
  if (!googleClient || !idToken) return null;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p || !p.email_verified) return null;
    return {
      sub: p.sub,
      email: p.email,
      name: p.name || null,
      picture: p.picture || null,
    };
  } catch (err) {
    console.warn('[messages/send] google token verify failed:', err.message);
    return null;
  }
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

async function sendMessage(req, res) {
  const username = String(req.params.username || '').trim();
  const body = String(req.body.body || '').trim();
  const googleIdToken = req.body.google_id_token ? String(req.body.google_id_token) : '';
  const fingerprintRaw = req.body.fingerprint ? String(req.body.fingerprint).trim() : '';
  // FingerprintJS visitorIds are 20-char hex; accept up to 128 chars for safety.
  const fingerprint = fingerprintRaw.length > 0 && fingerprintRaw.length <= 128 ? fingerprintRaw : null;

  if (!body) return res.status(400).json({ error: 'empty_message' });
  if (body.length > MAX_BODY) return res.status(400).json({ error: 'too_long' });

  let googleIdentity = null;
  if (!req.userId) {
    googleIdentity = await verifyGoogleIdToken(googleIdToken);
    if (!googleIdentity) return res.status(401).json({ error: 'sender_identity_required' });
  }

  try {
    if (fingerprint) {
      const ban = await pool.query(
        `SELECT 1 FROM banned_fingerprints WHERE fingerprint = $1`,
        [fingerprint]
      );
      if (ban.rowCount > 0) return res.status(403).json({ error: 'device_banned' });
    }

    if (req.userId) {
      const senderCheck = await pool.query(`SELECT is_banned FROM users WHERE id = $1`, [req.userId]);
      if (senderCheck.rows[0]?.is_banned) return res.status(403).json({ error: 'account_banned' });
    }

    const { rows: r } = await pool.query(
      `SELECT id, allow_messages, is_banned FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    const recipient = r[0];
    if (!recipient || recipient.is_banned) return res.status(404).json({ error: 'user_not_found' });
    if (!recipient.allow_messages) return res.status(403).json({ error: 'messages_disabled' });
    if (req.userId && recipient.id === req.userId) return res.status(400).json({ error: 'cannot_message_self' });

    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 500) : null;

    const { rows } = await pool.query(
      `INSERT INTO messages
         (recipient_id, sender_id, body,
          sender_email, sender_name, sender_picture, sender_google_sub,
          sender_ip, sender_user_agent, sender_fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at`,
      [
        recipient.id,
        req.userId || null,
        body,
        googleIdentity?.email || null,
        googleIdentity?.name || null,
        googleIdentity?.picture || null,
        googleIdentity?.sub || null,
        ip,
        ua,
        fingerprint,
      ]
    );
    res.status(201).json({ message: rows[0] });
  } catch (err) {
    console.error('[messages/send]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function listInbox(req, res) {
  try {
    const filter = String(req.query.filter || 'all');
    const params = [req.userId];
    let where = `recipient_id = $1 AND is_hidden = FALSE`;
    if (filter === 'unread') where += ` AND is_read = FALSE`;
    if (filter === 'favorite') where += ` AND is_favorite = TRUE`;

    const { rows } = await pool.query(
      `SELECT id, body, is_read, is_favorite, created_at
       FROM messages
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT 200`,
      params
    );

    const { rows: counts } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE is_read = FALSE)::int AS unread,
         COUNT(*) FILTER (WHERE is_favorite = TRUE)::int AS favorite
       FROM messages WHERE recipient_id = $1 AND is_hidden = FALSE`,
      [req.userId]
    );

    res.json({ messages: rows, counts: counts[0] });
  } catch (err) {
    console.error('[messages/list]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function markRead(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rowCount } = await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1 AND recipient_id = $2`,
      [id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[messages/markRead]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function toggleFavorite(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rows } = await pool.query(
      `UPDATE messages SET is_favorite = NOT is_favorite
       WHERE id = $1 AND recipient_id = $2
       RETURNING is_favorite`,
      [id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });
    res.json({ is_favorite: rows[0].is_favorite });
  } catch (err) {
    console.error('[messages/favorite]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function deleteMessage(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad_id' });
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM messages WHERE id = $1 AND recipient_id = $2`,
      [id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[messages/delete]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { sendMessage, listInbox, markRead, toggleFavorite, deleteMessage };
