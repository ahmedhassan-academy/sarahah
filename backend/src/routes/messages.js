const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const {
  sendMessage,
  listInbox,
  markRead,
  toggleFavorite,
  deleteMessage,
} = require('../controllers/messageController');

const router = express.Router();

const sendLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

router.post('/to/:username', requireAuth, sendLimiter, sendMessage);
router.get('/', requireAuth, listInbox);
router.patch('/:id/read', requireAuth, markRead);
router.patch('/:id/favorite', requireAuth, toggleFavorite);
router.delete('/:id', requireAuth, deleteMessage);

module.exports = router;
