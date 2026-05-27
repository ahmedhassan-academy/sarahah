const pool = require('../config/db');

const MAX_BODY = 1000;

async function sendMessage(req, res) {
  const username = String(req.params.username || '').trim();
  const body = String(req.body.body || '').trim();

  if (!body) return res.status(400).json({ error: 'empty_message' });
  if (body.length > MAX_BODY) return res.status(400).json({ error: 'too_long' });

  try {
    const { rows: r } = await pool.query(
      `SELECT id, allow_messages FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    const recipient = r[0];
    if (!recipient) return res.status(404).json({ error: 'user_not_found' });
    if (!recipient.allow_messages) return res.status(403).json({ error: 'messages_disabled' });
    if (recipient.id === req.userId) return res.status(400).json({ error: 'cannot_message_self' });

    const { rows } = await pool.query(
      `INSERT INTO messages (recipient_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [recipient.id, req.userId, body]
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
    let where = `recipient_id = $1`;
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
       FROM messages WHERE recipient_id = $1`,
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
