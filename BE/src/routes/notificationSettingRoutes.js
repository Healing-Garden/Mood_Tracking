const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getSettings);
router.put(
  '/',
  authMiddleware,
  notificationController.validateUpdate,
  notificationController.updateSettings
);

module.exports = router;