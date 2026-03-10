const aiService = require('../services/aiService');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const getMongoDB = async () => {
    const conn = mongoose.connection;
    if (!conn || conn.readyState !== 1) {
        throw new Error('MongoDB not connected');
    }
    return conn.db;
};

class AIController {
    // Suggest prompting questions
    async suggestQuestions(req, res) {
        try {
            const userId = req.userId || req.body.userId;
            const { recentMood, count = 3, language = 'en' } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

            const result = await aiService.suggestQuestions(userId, recentMood, count, language);

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
                res.json({
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
            const userId = req.userId || req.body.userId;
            const { date } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

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

    // Get daily summary
    async getDailySummary(req, res) {
        try {
            const { userId } = req.params;
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const db = await getMongoDB();

            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);

            let summary = null;
            try {
                summary = await db.collection('daily_summaries').findOne({
                    user_id: new ObjectId(userId),
                    date: targetDate
                });
            } catch (e) {
                summary = null;
            }

            if (!summary) {
                summary = await db.collection('daily_summaries').findOne({
                    user_id: String(userId),
                    date: targetDate
                });
            }

            if (!summary) {
                return res.status(404).json({ message: 'No summary for this day' });
            }

            res.json({
                success: true,
                data: {
                    summary: summary.summary,
                    metadata: summary.metadata,
                    generatedAt: summary.generated_at,
                    type: 'cached'
                }
            });
        } catch (error) {
            console.error('Get daily summary error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Semantic search
    async semanticSearch(req, res) {
        try {
            const userId = req.userId || req.body.userId;
            const { query, limit = 10 } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

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
            const userId = req.userId || req.body.userId;
            const { days = 30 } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

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
                res.json({
                    success: false,
                    error: result.error,
                    data: {
                        moodPoints: result.moodPoints || [],
                        overallTrend: result.overallTrend || 'error',
                        trendScore: result.trendScore || 0,
                        volatility: result.volatility || 0,
                        insights: result.insights || [],
                        riskFlags: result.riskFlags || [],
                        stats: result.stats || {}
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
            const userId = req.userId || req.body.userId;
            const { currentMood, count = 3, excludeIds = [] } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

            const result = await aiService.suggestPracticalActions(
                userId,
                currentMood,
                Number(count),
                Array.isArray(excludeIds) ? excludeIds : []
            );

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
                res.status(200).json({
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

    async logActionCompletion(req, res) {
        try {
            const userId = req.userId || req.body.userId;
            const { actionId, durationSeconds, moodAtTime, source } = req.body;

            if (!userId || !actionId) {
                return res.status(400).json({ success: false, error: "userId and actionId are required" });
            }

            const result = await aiService.logActionCompletion(
                userId,
                actionId,
                Number(durationSeconds),
                moodAtTime,
                source
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async logSkip(req, res) {
        try {
            const userId = req.userId || req.body.userId;
            const { mood, shownActions, reason } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }

            const result = await aiService.logSkip(
                userId,
                mood,
                Array.isArray(shownActions) ? shownActions : [],
                reason
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getActionHistory(req, res) {
        try {
            const userId = req.params.userId || req.userId;
            const { days = 7 } = req.query;
            const result = await aiService.getActionHistory(userId, Number(days));
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
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