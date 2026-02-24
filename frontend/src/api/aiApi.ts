import http from "./http";

export const aiService = {
  // Get prompting questions
  getQuestions: (userId, recentMood, count = 3) => {
    return http.post('/ai/questions/suggest', {
      userId,
      recentMood,
      count,
    });
  },

  // Generate daily summary
  getDailySummary: (userId, date) => {
    return http.post('/ai/summary/daily', {
      userId,
      date,
    });
  },

  // Semantic search
  semanticSearch: (userId, query, limit = 10) => {
    return http.post('/ai/search/semantic', {
      userId,
      query,
      limit,
    });
  },

  // Analyze emotional trends
  analyzeTrends: (userId, days = 30) => {
    return http.post('/ai/trends/analyze', {
      userId,
      days,
    });
  },

  // Suggest practical actions
  suggestActions: (userId, currentMood, count = 3) => {
    return http.post('/ai/actions/suggest', {
      userId,
      currentMood,
      count,
    });
  },

  // Analyze sentiment
  analyzeSentiment: (text) => {
    return http.post('/ai/sentiment/analyze', { text });
  },

  // Health check
  getHealth: () => {
    return http.get('/ai/health');
  },
};
