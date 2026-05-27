const pool = require('../config/db');

async function requireAdmin(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const { rows } = await pool.query(
      `SELECT is_admin, is_banned FROM users WHERE id = $1`,
      [req.userId]
    );
    const u = rows[0];
    if (!u || !u.is_admin || u.is_banned) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  } catch (err) {
    console.error('[requireAdmin]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { requireAdmin };
