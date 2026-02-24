const aiService = require('../services/aiService');

class AIController {
    // Suggest prompting questions
    async suggestQuestions(req, res) {
        try {
            const { userId, recentMood, count = 3 } = req.body;
            
            const result = await aiService.suggestQuestions(userId, recentMood, count);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: {
                        questions: result.questions,
                        context: result.context,
                        generatedAt: result.generatedAt
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    data: {
                        questions: result.questions 
                    }
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Generate daily summary
    async generateDailySummary(req, res) {
        try {
            const { userId, date } = req.body;
            
            const result = await aiService.generateDailySummary(userId, date);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: {
                        summary: result.summary,
                        metadata: result.metadata,
                        type: result.type,
                        generatedAt: result.generatedAt
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    data: {
                        summary: result.summary
                    }
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Semantic search
    async semanticSearch(req, res) {
        try {
            const { userId, query, limit = 10 } = req.body;
            
            const result = await aiService.semanticSearch(userId, query, limit);
            
            res.json({
                success: result.success,
                data: {
                    results: result.results,
                    query: result.query,
                    count: result.count,
                    searchType: result.searchType,
                    fallback: result.fallback || false
                },
                error: result.error
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Analyze emotional trends
    async analyzeEmotionalTrends(req, res) {
        try {
            const { userId, days = 30 } = req.body;
            
            const result = await aiService.analyzeEmotionalTrends(userId, days);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: {
                        moodPoints: result.moodPoints,
                        overallTrend: result.overallTrend,
                        trendScore: result.trendScore,
                        volatility: result.volatility,
                        insights: result.insights,
                        riskFlags: result.riskFlags,
                        stats: result.stats
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    data: {
                        insights: result.insights || []
                    }
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Suggest practical actions
    async suggestPracticalActions(req, res) {
        try {
            const { userId, currentMood, count = 3 } = req.body;
            
            const result = await aiService.suggestPracticalActions(userId, currentMood, count);
            
            if (result.success) {
                res.json({
                    success: true,
                    data: {
                        actions: result.actions,
                        context: result.context,
                        suggestedAt: result.suggestedAt
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error,
                    data: {
                        actions: result.actions || [] 
                    }
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Analyze sentiment
    async analyzeSentiment(req, res) {
        try {
            const { text } = req.body;
            
            const result = await aiService.analyzeSentiment(text);
            
            res.json({
                success: result.success,
                data: {
                    sentiment: result.sentiment,
                    score: result.score,
                    confidence: result.confidence
                },
                error: result.error
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Health check
    async healthCheck(req, res) {
        try {
            const health = await aiService.getHealth();
            
            res.json({
                success: health.status === 'healthy',
                data: health
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new AIController();