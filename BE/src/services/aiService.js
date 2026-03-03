const axios = require('axios');

class AIServiceClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || process.env.AI_SERVICE_URL || 'http://localhost:8000';
        this.apiKey = config.apiKey || process.env.AI_SERVICE_API_KEY;
        if (!this.apiKey) {
            throw new Error('AI_SERVICE_API_KEY is required');
        }

        this.timeout = config.timeout || 60000;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            }
        });
    }

    /**
     * Get service health status
     */
    async getHealth() {
        try {
            const response = await this.client.get('/api/v1/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error.message);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * UC-18: Suggest prompting questions
     */
    async suggestQuestions(userId, recentMood = null, count = 3) {
        try {
            const response = await this.client.post(
                '/api/v1/questions/suggest',
                {
                    user_id: userId,
                    recent_mood: recentMood,
                    count: count
                },
                { timeout: 12000 }
            );

            return {
                success: true,
                questions: response.data.questions,
                context: response.data.context,
                generatedAt: response.data.generated_at
            };

        } catch (error) {
            console.error('Failed to get questions:', error.message);
            return {
                success: false,
                error: error.message,
                questions: getFallbackQuestions(recentMood, count)
            };
        }
    }

    /**
     * UC-19: Generate daily summary
     */
    async generateDailySummary(userId, date = null) {
        try {
            const response = await this.client.post(
                '/api/v1/summary/daily',
                {
                    user_id: userId,
                    date: date || new Date().toISOString().split('T')[0]
                },
                { timeout: 20000 }
            );

            return {
                success: true,
                summary: response.data.summary,
                metadata: response.data.metadata,
                type: response.data.type,
                generatedAt: response.data.generated_at
            };

        } catch (error) {
            console.error('Failed to generate summary:', error.message);
            return {
                success: false,
                error: error.message,
                summary: "Unable to generate summary at this time. Check back later."
            };
        }
    }

    /**
     * UC-20: Process chat message through CBT agent
     */
    async processChatMessage(sessionId, text, sessionState, userContext, recentMessages = []) {
        try {
            const response = await this.client.post('/api/v1/chat/process_message', {
                text: text,
                session_id: sessionId,
                session_state: sessionState,
                user_context: userContext,
                recent_messages: recentMessages
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Chat message processing failed:', error.message);

            const isVietnamese = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(String(text));

            return {
                success: true,
                data: {
                    text: isVietnamese
                        ? "Mình đang ở đây để lắng nghe. Bạn có thể chia sẻ thêm về cảm xúc của bạn lúc này không?"
                        : "I'm here to listen. Could you tell me more about how you're feeling?",
                    sentiment: { sentiment: 'neutral', score: 0.5, confidence: 0.5 },
                    intent: 'general',
                    technique: 'active_listening',
                    exercise: null,
                    isCrisis: false,
                    next_state: 'assessment',
                    risk_level: 0
                }
            };
        }
    }

    /**
     * UC-21: Semantic search
     */
    async semanticSearch(userId, query, limit = 10) {
        try {
            const response = await this.client.post('/api/v1/search/semantic', {
                user_id: userId,
                query: query,
                limit: limit
            });

            return {
                success: true,
                results: response.data.results,
                query: response.data.query,
                count: response.data.count,
                searchType: response.data.search_type
            };

        } catch (error) {
            console.error('Semantic search failed:', error.message);
            return {
                success: false,
                error: error.message,
                results: [],
                fallback: true
            };
        }
    }

    /**
     * UC-22: Analyze emotional trends
     */
    async analyzeEmotionalTrends(userId, days = 30) {
        try {
            const response = await this.client.post('/api/v1/trends/analyze', {
                user_id: userId,
                days: days
            }, { timeout: 15000 });

            return {
                success: true,
                moodPoints: response.data.mood_points,
                overallTrend: response.data.overall_trend,
                trendScore: response.data.trend_score,
                volatility: response.data.volatility,
                insights: response.data.insights,
                riskFlags: response.data.risk_flags,
                stats: response.data.stats
            };

        } catch (error) {
            console.error('Trend analysis failed:', error.message);
            return {
                success: false,
                error: error.message,
                moodPoints: [],
                insights: [],
                overallTrend: 'error',
                trendScore: 0,
                volatility: 0,
                riskFlags: [],
                stats: {}
            };
        }
    }

    /**
     * UC-22: Detect patterns
     */
    async detectPatterns(userId, days = 90) {
        try {
            const response = await this.client.get(`/api/v1/trends/patterns/${userId}?days=${days}`);

            return {
                success: true,
                patterns: response.data.patterns,
                analysisPeriodDays: response.data.analysis_period_days,
                totalDataPoints: response.data.total_data_points
            };

        } catch (error) {
            console.error('Pattern detection failed:', error.message);
            return {
                success: false,
                error: error.message,
                patterns: []
            };
        }
    }

    /**
     * UC-23: Suggest practical actions
     */
    async suggestPracticalActions(userId, currentMood = null, count = 3) {
        try {
            const response = await this.client.post('/api/v1/actions/suggest', {
                user_id: userId,
                current_mood: currentMood,
                count: count
            });

            return {
                success: true,
                actions: response.data.actions,
                context: response.data.context,
                suggestedAt: response.data.suggested_at
            };

        } catch (error) {
            console.error('Failed to suggest actions:', error.message);
            return {
                success: false,
                error: error.message,
                actions: getFallbackActions(currentMood, count)
            };
        }
    }

    /**
     * UC-23: Log action completion
     */
    async logActionCompletion(userId, actionId, durationSeconds) {
        try {
            const response = await this.client.post('/api/v1/actions/log_completion', {
                user_id: userId,
                action_id: actionId,
                duration_seconds: durationSeconds
            });

            return {
                success: true,
                message: response.data.message
            };

        } catch (error) {
            console.error('Failed to log action completion:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * UC-23: Get action history
     */
    async getActionHistory(userId, days = 7) {
        try {
            const response = await this.client.get(`/api/v1/actions/history/${userId}?days=${days}`);

            return {
                success: true,
                completions: response.data.completions,
                periodDays: response.data.period_days,
                totalCompletions: response.data.total_completions,
                stats: response.data.stats
            };

        } catch (error) {
            console.error('Failed to get action history:', error.message);
            return {
                success: false,
                error: error.message,
                completions: []
            };
        }
    }

    /**
     * Sync a journal entry to vector store (add/update/delete)
     */
    async syncEntry(entryId, userId, text, operation = 'add') {
        try {
            if (!entryId) {
                throw new Error('entryId is required');
            }
            if (!userId) {
                throw new Error('userId is required');
            }

            const params = {
                entry_id: String(entryId),
                user_id: String(userId),
                operation: operation,
            };

            // FastAPI route uses primitive params, which are interpreted as query params.
            if (operation !== 'delete') {
                params.text = String(text || '');
            } else {
                params.text = String(text || '');
            }

            const response = await this.client.post('/api/v1/search/sync/entry', null, { params });
            return response.data;
        } catch (error) {
            console.error('Failed to sync entry:', error.message);
            throw error;
        }
    }

    /**
     * Delete journal entry from vector store
     */
    async deleteEntry(entryId, userId) {
        return this.syncEntry(entryId, userId, '', 'delete');
    }

    /**
     * Analyze sentiment of text
     */
    async analyzeSentiment(text) {
        try {
            // Note: You need to add this endpoint in Python first
            const response = await this.client.post('/api/v1/sentiment/analyze', {
                text: text
            });

            return {
                success: true,
                sentiment: response.data.sentiment,
                score: response.data.score,
                confidence: response.data.confidence,
                emotions: response.data.emotions || []
            };

        } catch (error) {
            console.error('Sentiment analysis failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Fallback functions
function getFallbackQuestions(mood, count) {
    const questionBanks = {
        happy: [
            "What made you smile today?",
            "What are you grateful for right now?",
            "How can you share this happiness with others?"
        ],
        sad: [
            "What comforted you today?",
            "What support do you need right now?",
            "What's one small thing that could help?"
        ],
        anxious: [
            "What's within your control right now?",
            "What would help you feel more grounded?",
            "What's one thing you can let go of?"
        ],
        default: [
            "What was the highlight of your day?",
            "What challenged you today?",
            "What did you learn about yourself today?",
            "How did you take care of yourself?",
            "What are you looking forward to?"
        ]
    };

    const bank = questionBanks[mood] || questionBanks.default;
    return bank.slice(0, count);
}

function getFallbackActions(mood, count) {
    const actions = [
        {
            id: "fallback_breathing",
            title: "Deep Breathing",
            description: "Take 5 deep breaths, inhaling for 4 seconds and exhaling for 6.",
            type: "breathing",
            duration_min: 2,
            difficulty: "easy"
        },
        {
            id: "fallback_stretch",
            title: "Quick Stretch",
            description: "Stand up and stretch your arms overhead for 30 seconds.",
            type: "exercise",
            duration_min: 1,
            difficulty: "easy"
        },
        {
            id: "fallback_gratitude",
            title: "Gratitude Moment",
            description: "Write down 3 things you're grateful for.",
            type: "activity",
            duration_min: 2,
            difficulty: "easy"
        }
    ];

    return actions.slice(0, count);
}

const aiService = new AIServiceClient();

module.exports = aiService;