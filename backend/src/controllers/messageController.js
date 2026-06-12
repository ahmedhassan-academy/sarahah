const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const { IDENTIFIER_SQL, IDENTIFIER_ORDER } = require('../utils/identifier');

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
  const isPublic = req.body.is_public === true || req.body.is_public === 'true';
  const saveToSent = req.body.save_to_sent === true || req.body.save_to_sent === 'true';

  // Precise sender location — only present when the sender granted the browser
  // location prompt. Validate ranges and drop anything malformed.
  const toNum = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  let lat = toNum(req.body.lat);
  let lon = toNum(req.body.lon);
  let geoAccuracy = toNum(req.body.geo_accuracy);
  if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    lat = null;
    lon = null;
    geoAccuracy = null;
  }
  if (geoAccuracy !== null && (geoAccuracy < 0 || geoAccuracy > 10000000)) geoAccuracy = null;

  if (!body) return res.status(400).json({ error: 'empty_message' });
  if (body.length > MAX_BODY) return res.status(400).json({ error: 'too_long' });

  let googleIdentity = null;
  if (!req.userId) {
    if (req.googleVisitorId) {
      const { rows: vrows } = await pool.query(
        `SELECT id, google_sub, email, name, picture, is_banned
         FROM google_visitors WHERE id = $1`,
        [req.googleVisitorId]
      );
      const v = vrows[0];
      if (!v) return res.status(401).json({ error: 'sender_identity_required' });
      if (v.is_banned) return res.status(403).json({ error: 'account_banned' });
      googleIdentity = { sub: v.google_sub, email: v.email, name: v.name, picture: v.picture };
    } else {
      googleIdentity = await verifyGoogleIdToken(googleIdToken);
      if (!googleIdentity) return res.status(401).json({ error: 'sender_identity_required' });
    }
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
      `SELECT id, allow_messages, is_banned FROM users WHERE ${IDENTIFIER_SQL} ${IDENTIFIER_ORDER}`,
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
          sender_ip, sender_user_agent, sender_fingerprint,
          is_public, save_to_sent,
          sender_lat, sender_lon, sender_geo_accuracy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        isPublic,
        saveToSent && !!req.userId,
        lat,
        lon,
        geoAccuracy,
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
    let rows;

    if (filter === 'sent') {
      const r = await pool.query(
        `SELECT id, body, is_read, is_favorite, is_public, created_at
         FROM messages
         WHERE sender_id = $1 AND save_to_sent = TRUE AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 200`,
        [req.userId]
      );
      rows = r.rows;
    } else if (filter === 'public') {
      const r = await pool.query(
        `SELECT id, body, is_read, is_favorite, is_public, created_at
         FROM messages
         WHERE recipient_id = $1 AND is_hidden = FALSE AND is_public = TRUE AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 200`,
        [req.userId]
      );
      rows = r.rows;
    } else {
      const params = [req.userId];
      let where = `recipient_id = $1 AND is_hidden = FALSE AND deleted_at IS NULL`;
      if (filter === 'unread') where += ` AND is_read = FALSE`;
      if (filter === 'favorite') where += ` AND is_favorite = TRUE`;

      const r = await pool.query(
        `SELECT id, body, is_read, is_favorite, is_public, created_at
         FROM messages
         WHERE ${where}
         ORDER BY created_at DESC
         LIMIT 200`,
        params
      );
      rows = r.rows;
    }

    const { rows: counts } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE recipient_id = $1 AND is_hidden = FALSE)::int AS total,
         COUNT(*) FILTER (WHERE recipient_id = $1 AND is_hidden = FALSE AND is_read = FALSE)::int AS unread,
         COUNT(*) FILTER (WHERE recipient_id = $1 AND is_hidden = FALSE AND is_favorite = TRUE)::int AS favorite,
         COUNT(*) FILTER (WHERE recipient_id = $1 AND is_hidden = FALSE AND is_public = TRUE)::int AS public,
         COUNT(*) FILTER (WHERE sender_id = $1 AND save_to_sent = TRUE)::int AS sent
       FROM messages
       WHERE deleted_at IS NULL`,
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
      `UPDATE messages SET is_read = TRUE WHERE id = $1 AND recipient_id = $2 AND deleted_at IS NULL`,
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
       WHERE id = $1 AND recipient_id = $2 AND deleted_at IS NULL
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
      `UPDATE messages SET deleted_at = NOW()
       WHERE id = $1 AND recipient_id = $2 AND deleted_at IS NULL`,
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
