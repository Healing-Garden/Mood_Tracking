const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/questions/suggest', aiController.suggestQuestions);
router.post('/summary/daily', aiController.generateDailySummary);
router.get('/summary/daily/:userId', aiController.getDailySummary);
router.post('/search/semantic', aiController.semanticSearch);
router.post('/trends/analyze', aiController.analyzeEmotionalTrends);
router.post('/actions/suggest', aiController.suggestPracticalActions);
router.post('/sentiment/analyze', aiController.analyzeSentiment);
router.get('/health', aiController.healthCheck);

module.exports = router;