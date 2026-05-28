const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { exchange: googleSessionExchange, googleMe } = require('../controllers/googleSessionController');
const { requireAuth, requireGoogleVisitor } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const googleSessionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.post('/google-session', googleSessionLimiter, googleSessionExchange);
router.get('/google-me', requireGoogleVisitor, googleMe);

module.exports = router;
