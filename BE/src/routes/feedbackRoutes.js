const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/feedback/submit - Submit new feedback
// Protect with authMiddleware so we have req.user.id
router.post('/submit', authMiddleware, feedbackController.submitFeedback);

// GET /api/feedback/my-history - Get feedback history for current user
router.get('/my-history', authMiddleware, feedbackController.getMyFeedback);

module.exports = router;
