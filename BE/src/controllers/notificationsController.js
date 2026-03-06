const SmartNotification = require('../models/SmartNotification');

// GET /api/notifications
// Lấy danh sách thông báo của user hiện tại
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, type, limit = 20, offset = 0 } = req.query;

    const query = { user_id: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    const notifications = await SmartNotification.find(query)
      .sort({ created_at: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10));

    res.json(
      notifications.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        content: n.content,
        status: n.status,
        created_at: n.created_at || n.createdAt,
        scheduled_for: n.scheduled_for,
        sent_at: n.sent_at,
        metadata: n.metadata,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id/read
// Đánh dấu thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await SmartNotification.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: { status: 'read', read_at: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      id: notification._id,
      status: notification.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id
// Xoá thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await SmartNotification.deleteOne({ _id: id, user_id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

