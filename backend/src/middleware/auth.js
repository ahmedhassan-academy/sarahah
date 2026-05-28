const { verify } = require('../utils/jwt');

function decodeBearer(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  return verify(token);
}

function requireAuth(req, res, next) {
  const payload = decodeBearer(req);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  if (!payload.uid) return res.status(401).json({ error: 'unauthenticated' });
  req.userId = payload.uid;
  next();
}

function optionalAuth(req, _res, next) {
  const payload = decodeBearer(req);
  if (payload) {
    if (payload.uid) req.userId = payload.uid;
    if (payload.gv) req.googleVisitorId = payload.gv;
  }
  next();
}

function requireGoogleVisitor(req, res, next) {
  const payload = decodeBearer(req);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  if (!payload.gv) return res.status(401).json({ error: 'unauthenticated' });
  req.googleVisitorId = payload.gv;
  next();
}

module.exports = { requireAuth, optionalAuth, requireGoogleVisitor };
