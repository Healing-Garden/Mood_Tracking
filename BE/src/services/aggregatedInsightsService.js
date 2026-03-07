const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

class AggregatedInsightsService {
  /**
   * Gọi Python service để lấy aggregated insights
   */
  async fetchInsights(dateRange, startDate, endDate, segments) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/v1/admin/analytics/aggregated/analyze`,
        {
          date_range: dateRange || 'last_30_days',
          start_date: startDate,
          end_date: endDate,
          segments: segments || {}
        },
        {
          headers: {
            'X-API-Key': AI_SERVICE_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 giây
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo basic stats khi Python service không khả dụng (fallback)
   */
  async generateBasicStats(query) {
    return {
      executive_summary: {
        total_active_users: 0,
        average_mood: null,
        total_interactions: 0,
        message: 'Advanced analytics temporarily unavailable. Please try again later.',
        date_range: {
          start: query.startDate || null,
          end: query.endDate || null
        }
      },
      correlation_insights: [],
      usage_patterns: {
        mood_distribution: {},
        peak_usage_hours: null,
        most_used_features: []
      },
      demographic_trends: {},
      generated_at: new Date().toISOString()
    };
  }
}

module.exports = new AggregatedInsightsService();