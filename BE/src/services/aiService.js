// services/aiService.js
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.AI_SERVICE_API_KEY
      }
    });
  }

  async getSuggestedQuestions(userId, recentEntries) {
    const response = await this.client.post('/api/v1/questions/generate', {
      user_id: userId,
      journal_entries: recentEntries
    });
    return response.data.questions;
  }

  async generateDailySummary(userId) {
    const response = await this.client.post('/api/v1/summary/daily', {
      user_id: userId
    });
    return response.data;
  }

  async semanticSearch(userId, query) {
    const response = await this.client.post('/api/v1/search/semantic', {
      user_id: userId,
      query: query
    });
    return response.data.results;
  }

  async analyzeEmotionalState(userId, entries) {
    const response = await this.client.post('/api/v1/analysis/emotional', {
      user_id: userId,
      entries: entries
    });
    return response.data;
  }

  async suggestActions(userId, currentMood) {
    // This could be implemented in Node.js or call Python service
    // Based on current mood, fetch from healing_contents collection
    // (Implementation depends on your preference)
  }
}

module.exports = new AIService();