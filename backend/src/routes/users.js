const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const {
  getPublicProfile,
  getPublicMessages,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/userController');

const router = express.Router();

router.get('/u/:username', optionalAuth, getPublicProfile);
router.get('/u/:username/public-messages', getPublicMessages);
router.patch('/me', requireAuth, updateProfile);
router.post('/me/password', requireAuth, changePassword);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
