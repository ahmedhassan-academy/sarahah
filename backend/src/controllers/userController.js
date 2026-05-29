const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { emailHandle, IDENTIFIER_SQL, IDENTIFIER_ORDER } = require('../utils/identifier');

const ONLINE_WINDOW_SQL = `(last_seen IS NOT NULL AND last_seen > NOW() - INTERVAL '5 minutes')`;

async function getPublicProfile(req, res) {
  const identifier = String(req.params.username || '').trim();
  if (!identifier) return res.status(400).json({ error: 'bad_username' });

  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, display_name, bio, avatar_url, allow_messages, is_banned, created_at, visit_count,
              ${ONLINE_WINDOW_SQL} AS is_online
       FROM users WHERE ${IDENTIFIER_SQL} ${IDENTIFIER_ORDER}`,
      [identifier]
    );
    const user = rows[0];
    if (!user || user.is_banned) return res.status(404).json({ error: 'user_not_found' });

    // Increment visit count when the viewer is not the owner
    if (!req.userId || req.userId !== user.id) {
      pool.query(`UPDATE users SET visit_count = visit_count + 1 WHERE id = $1`, [user.id]).catch(() => {});
      user.visit_count = (user.visit_count || 0) + 1;
    }

    // Follower / following counts
    const { rows: counts } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM follows WHERE followee_id = $1)::int AS followers,
         (SELECT COUNT(*) FROM follows WHERE follower_user_id = $1)::int AS following`,
      [user.id]
    );
    user.followers = counts[0].followers;
    user.following = counts[0].following;

    // Whether the current viewer (registered user or Google visitor) already follows
    user.is_following = false;
    if (req.userId) {
      const r = await pool.query(
        `SELECT 1 FROM follows WHERE followee_id = $1 AND follower_user_id = $2`,
        [user.id, req.userId]
      );
      user.is_following = r.rowCount > 0;
    } else if (req.googleVisitorId) {
      const r = await pool.query(
        `SELECT 1 FROM follows WHERE followee_id = $1 AND follower_visitor_id = $2`,
        [user.id, req.googleVisitorId]
      );
      user.is_following = r.rowCount > 0;
    }

    user.handle = emailHandle(user.email);
    delete user.email;
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
    const u = rows[0];
    if (u) u.handle = emailHandle(u.email);
    res.json({ user: u });
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

async function getPublicMessages(req, res) {
  const identifier = String(req.params.username || '').trim();
  if (!identifier) return res.status(400).json({ error: 'bad_username' });
  try {
    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE ${IDENTIFIER_SQL} AND is_banned = FALSE ${IDENTIFIER_ORDER}`,
      [identifier]
    );
    const u = userRows[0];
    if (!u) return res.status(404).json({ error: 'user_not_found' });

    const { rows } = await pool.query(
      `SELECT id, body, created_at
       FROM messages
       WHERE recipient_id = $1 AND is_public = TRUE AND is_hidden = FALSE
       ORDER BY created_at DESC
       LIMIT 50`,
      [u.id]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error('[users/publicMessages]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function resolveFollower(req) {
  // Returns { userId } or { visitorId }, or null if the viewer has no valid identity.
  if (req.userId) {
    const { rows } = await pool.query(`SELECT is_banned FROM users WHERE id = $1`, [req.userId]);
    if (!rows[0]) return null;
    if (rows[0].is_banned) return { banned: true };
    return { userId: req.userId };
  }
  if (req.googleVisitorId) {
    const { rows } = await pool.query(`SELECT is_banned FROM google_visitors WHERE id = $1`, [req.googleVisitorId]);
    if (!rows[0]) return null;
    if (rows[0].is_banned) return { banned: true };
    return { visitorId: req.googleVisitorId };
  }
  return null;
}

async function followerCount(followeeId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS followers FROM follows WHERE followee_id = $1`,
    [followeeId]
  );
  return rows[0].followers;
}

async function followUser(req, res) {
  const identifier = String(req.params.username || '').trim();
  if (!identifier) return res.status(400).json({ error: 'bad_username' });

  try {
    const follower = await resolveFollower(req);
    if (!follower) return res.status(401).json({ error: 'sign_in_required' });
    if (follower.banned) return res.status(403).json({ error: 'account_banned' });

    const { rows } = await pool.query(
      `SELECT id, is_banned FROM users WHERE ${IDENTIFIER_SQL} ${IDENTIFIER_ORDER}`,
      [identifier]
    );
    const target = rows[0];
    if (!target || target.is_banned) return res.status(404).json({ error: 'user_not_found' });
    if (follower.userId && target.id === follower.userId) {
      return res.status(400).json({ error: 'cannot_follow_self' });
    }

    await pool.query(
      `INSERT INTO follows (followee_id, follower_user_id, follower_visitor_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [target.id, follower.userId || null, follower.visitorId || null]
    );

    res.json({ is_following: true, followers: await followerCount(target.id) });
  } catch (err) {
    console.error('[users/follow]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function unfollowUser(req, res) {
  const identifier = String(req.params.username || '').trim();
  if (!identifier) return res.status(400).json({ error: 'bad_username' });

  try {
    const follower = await resolveFollower(req);
    if (!follower) return res.status(401).json({ error: 'sign_in_required' });

    const { rows } = await pool.query(
      `SELECT id FROM users WHERE ${IDENTIFIER_SQL} ${IDENTIFIER_ORDER}`,
      [identifier]
    );
    const target = rows[0];
    if (!target) return res.status(404).json({ error: 'user_not_found' });

    if (follower.userId) {
      await pool.query(
        `DELETE FROM follows WHERE followee_id = $1 AND follower_user_id = $2`,
        [target.id, follower.userId]
      );
    } else if (follower.visitorId) {
      await pool.query(
        `DELETE FROM follows WHERE followee_id = $1 AND follower_visitor_id = $2`,
        [target.id, follower.visitorId]
      );
    }

    res.json({ is_following: false, followers: await followerCount(target.id) });
  } catch (err) {
    console.error('[users/unfollow]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = {
  getPublicProfile,
  getPublicMessages,
  updateProfile,
  changePassword,
  deleteAccount,
  followUser,
  unfollowUser,
};
