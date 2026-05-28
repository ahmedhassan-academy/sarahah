require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./config/migrations');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

const allowList = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowList.length === 0) return true;
  if (allowList.includes(origin)) return true;
  // Allow any subdomain of any allowed root host (e.g. *.saraha.pro)
  try {
    const { hostname, protocol } = new URL(origin);
    return allowList.some((allowed) => {
      try {
        const a = new URL(allowed);
        if (a.protocol !== protocol) return false;
        return hostname === a.hostname || hostname.endsWith(`.${a.hostname}`);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: '512kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'server_error' });
});

const PORT = parseInt(process.env.PORT || '4000', 10);

(async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
  } catch (err) {
    console.error('[boot] failed', err);
    process.exit(1);
  }
})();
