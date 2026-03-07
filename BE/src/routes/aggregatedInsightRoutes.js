const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); 
const authorizeAdmin = require('../middleware/authorizeAdmin');
const adminController = require('../controllers/aggregatedInsightController');

// Route cho aggregated insights
router.get(
  '/analytics/aggregated-insights',
  authMiddleware,   
  authorizeAdmin,   
  adminController.getAggregatedInsights
);


module.exports = router;