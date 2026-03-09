const SmartNotification = require('../models/SmartNotification');
const { getIO } = require('../socketManager');

async function sendWebNotification(userId, title, content, options = {}) {
  const { type = 'reminder', status = 'sent', ...metadata } = options;

  const notification = new SmartNotification({
    user_id: userId,
    type,
    delivery_method: 'web',
    title,
    content,
    status,
    scheduled_for: new Date(),
    sent_at: new Date(),
    metadata: { ai_generated: true, ...metadata }
  });
  await notification.save();

  try {
    const io = getIO();
    io.to(userId.toString()).emit('notification', {
      _id: notification._id,
      title,
      content,
      created_at: notification.createdAt
    });
  } catch (error) {
    console.error('Socket not available:', error.message);
  }
}

module.exports = { send: sendWebNotification };