import http from "./http";

export const aiApi = {
  // Get prompting questions
  getQuestions: (userId: string, recentMood: string | null, count: number = 3, language: string = 'en') => {
    return http.post(
      '/ai/questions/suggest',
      {
        userId,
        recentMood,
        count,
        language,
      },
      { timeout: 30000 }
    );
  },

  // Generate daily summary
  getDailySummary: (userId: string, date: string | null, force: boolean = false) => {
    return http.post('/ai/summary/daily', { userId, date, forceRegenerate: force }, { timeout: 30000 });
  },
  

  // Semantic search
  semanticSearch: (userId: string, query: string, limit: number = 10) => {
    return http.post('/ai/search/semantic', { userId, query, limit }, { timeout: 30000 });
  },

  // Analyze emotional trends
  analyzeTrends: (userId: string, days: number = 30) => {
    return http.post('/ai/trends/analyze', { userId, days }, { timeout: 65000 });
  },

  // Suggest practical actions
  suggestActions: (userId: string, currentMood: string | null, count: number = 3, excludeIds: string[] = []) => {
    return http.post('/ai/actions/suggest', { userId, currentMood, count, excludeIds }, { timeout: 30000 });
  },

  logActionCompletion: (
    userId: string,
    actionId: string,
    durationSeconds: number,
    moodAtTime?: string,
    source: string = 'suggestion',
    postMoodScore?: number
  ) => {
    return http.post('/ai/actions/log-completion', {
      userId,
      actionId,
      durationSeconds,
      moodAtTime,
      source,
      postMoodScore,
    });
  },

  logSkip: (userId: string, mood: string | null, shownActions: string[], reason?: string) => {
    return http.post('/ai/actions/skip', { userId, mood, shownActions, reason });
  },

  checkActionEligibility: (userId: string) => {
    return http.post('/ai/actions/eligibility', { userId });
  },

  // Analyze sentiment
  analyzeSentiment: (text: string) => {
    return http.post('/ai/sentiment/analyze', { text }, { timeout: 30000 });
  },

  // Health check
  getHealth: () => {
    return http.get('/ai/health');
  },
};
