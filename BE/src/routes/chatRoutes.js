const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatController');

router.get('/sessions/:userId', chatController.getUserSessions);
router.get('/session/:sessionId', chatController.getSessionDetail);
router.get('/session/:sessionId/messages', chatController.getSessionMessages);
router.delete('/session/:sessionId', chatController.deleteSession); 
router.post('/session/:sessionId/journal', chatController.saveJournalNote);

module.exports = router;