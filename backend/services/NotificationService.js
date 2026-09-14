const NotificationModel = require('../models/Notification');

class NotificationService {
  async #findById(id) {
    const notification = await NotificationModel.findById(id);
    if (!notification) throw new Error('Notification not found');
    return notification;
  }

  async createNotification(data) {
    const notification = await NotificationModel.create(data);
    return this.#populate(notification._id);
  }

  async getUserNotifications(userId, unreadOnly = false) {
    const query = { user: userId };
    if (unreadOnly) query.isRead = false;
    return NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getNotificationById(id) {
    const notification = await this.#findById(id);
    return this.#populate(notification._id);
  }

  async markAsRead(id) {
    const notification = await this.#findById(id);
    notification.isRead = true;
    await notification.save();
    return this.#populate(notification._id);
  }

  async markAllAsRead(userId) {
    await NotificationModel.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId) {
    return NotificationModel.countDocuments({ user: userId, isRead: false });
  }

  async #populate(id) {
    return NotificationModel.findById(id);
  }
}

module.exports = new NotificationService();
