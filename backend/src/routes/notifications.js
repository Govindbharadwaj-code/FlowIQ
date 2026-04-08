const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.get('/', authenticate, getNotifications);
router.put('/mark-all-read', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);

module.exports = router;
