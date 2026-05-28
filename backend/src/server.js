require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./config/migrations');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
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
