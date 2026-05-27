const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getPublicProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/userController');

const router = express.Router();

router.get('/u/:username', getPublicProfile);
router.patch('/me', requireAuth, updateProfile);
router.post('/me/password', requireAuth, changePassword);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
