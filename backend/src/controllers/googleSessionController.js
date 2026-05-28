const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const { sign } = require('../utils/jwt');

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
    console.warn('[auth/google-session] token verify failed:', err.message);
    return null;
  }
}

async function exchange(req, res) {
  const idToken = req.body && req.body.id_token ? String(req.body.id_token) : '';
  if (!idToken) return res.status(400).json({ error: 'missing_id_token' });

  const identity = await verifyGoogleIdToken(idToken);
  if (!identity) return res.status(401).json({ error: 'invalid_google_token' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO google_visitors (google_sub, email, name, picture)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             picture = EXCLUDED.picture,
             last_seen = NOW()
       RETURNING id, email, name, picture, is_banned`,
      [identity.sub, identity.email, identity.name, identity.picture]
    );
    const visitor = rows[0];
    if (visitor.is_banned) return res.status(403).json({ error: 'account_banned' });

    const token = sign({ gv: visitor.id });
    res.json({
      token,
      profile: {
        email: visitor.email,
        name: visitor.name,
        picture: visitor.picture,
      },
    });
  } catch (err) {
    console.error('[auth/google-session]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

async function googleMe(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE google_visitors SET last_seen = NOW()
       WHERE id = $1
       RETURNING id, email, name, picture, is_banned`,
      [req.googleVisitorId]
    );
    const visitor = rows[0];
    if (!visitor) return res.status(404).json({ error: 'not_found' });
    if (visitor.is_banned) return res.status(403).json({ error: 'account_banned' });
    res.json({
      profile: {
        email: visitor.email,
        name: visitor.name,
        picture: visitor.picture,
      },
    });
  } catch (err) {
    console.error('[auth/google-me]', err);
    res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { exchange, googleMe };
