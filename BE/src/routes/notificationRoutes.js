const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const authMiddleware = require('../middleware/authMiddleware');

// Danh sách thông báo của user hiện tại
router.get('/', authMiddleware, notificationsController.getNotifications);

// Đánh dấu đã đọc
router.patch('/:id/read', authMiddleware, notificationsController.markAsRead);

// Xoá thông báo
router.delete('/:id', authMiddleware, notificationsController.deleteNotification);

module.exports = router;

