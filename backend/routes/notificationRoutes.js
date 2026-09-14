const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.get('/', NotificationController.getUserNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.post('/generate-test', NotificationController.generateTestNotifications);
router.patch('/:id/mark-read', NotificationController.markAsRead);
router.patch('/mark-all-read', NotificationController.markAllAsRead);

module.exports = router;
