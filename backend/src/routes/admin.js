const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const ctrl = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.get('/messages', ctrl.listMessages);
router.patch('/users/:id/ban', ctrl.banUser);
router.patch('/users/:id/unban', ctrl.unbanUser);
router.patch('/users/:id/admin', ctrl.setAdmin);
router.delete('/messages/:id', ctrl.deleteMessage);
router.patch('/messages/:id/hide', ctrl.toggleHide);
router.post('/fingerprints/:fingerprint/ban', ctrl.banFingerprint);
router.delete('/fingerprints/:fingerprint/ban', ctrl.unbanFingerprint);

module.exports = router;
