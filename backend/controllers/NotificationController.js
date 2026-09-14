const NotificationService = require('../services/NotificationService');

class NotificationController {
  constructor(service = NotificationService) {
    this.#service = service;
  }

  #service;

  getUserNotifications = async (req, res) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await this.#service.getUserNotifications(req.user._id, unreadOnly);
      res.json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getUnreadCount = async (req, res) => {
    try {
      const count = await this.#service.getUnreadCount(req.user._id);
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  markAsRead = async (req, res) => {
    try {
      const notification = await this.#service.markAsRead(req.params.id);
      res.json({ success: true, message: 'Notification marked as read', data: notification });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  };

  markAllAsRead = async (req, res) => {
    try {
      const result = await this.#service.markAllAsRead(req.user._id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  generateTestNotifications = async (req, res) => {
    try {
      const userId = req.user._id;
      const notifications = [
        {
          user: userId,
          type: 'booking_confirmation',
          title: 'Booking Confirmed',
          message: 'Your booking BK-TEST-123 for New York → Los Angeles has been confirmed.',
          status: 'confirmed'
        },
        {
          user: userId,
          type: 'payment_successful',
          title: 'Payment Successful',
          message: 'Your payment of $250.00 for booking BK-TEST-123 was successful.',
          status: 'success'
        },
        {
          user: userId,
          type: 'refund_pending',
          title: 'Refund Request Submitted',
          message: 'Your refund request of $100.00 for booking BK-TEST-456 has been submitted.',
          status: 'pending'
        }
      ];

      const created = [];
      for (const notif of notifications) {
        const createdNotif = await this.#service.createNotification(notif);
        created.push(createdNotif);
      }

      res.json({ success: true, message: 'Test notifications generated', count: created.length, data: created });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = new NotificationController();
