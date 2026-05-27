const { verify } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthenticated' });

  const payload = verify(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });

  req.userId = payload.uid;
  next();
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    const payload = verify(token);
    if (payload) req.userId = payload.uid;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
