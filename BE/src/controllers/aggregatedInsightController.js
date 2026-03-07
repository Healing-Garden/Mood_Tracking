const AdminActivity = require('../models/AdminActivity');
const aggregatedInsightsService = require('../services/aggregatedInsightsService');

class AdminController {
  /**
   * GET /api/admin/analytics/aggregated-insights
   */
  async getAggregatedInsights(req, res) {
    try {
      const { dateRange, startDate, endDate, segments } = req.query;

      // Parse segments từ JSON string
      let parsedSegments = {};
      if (segments) {
        try {
          parsedSegments = JSON.parse(segments);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid segments format' });
        }
      }

      // 1. Ghi audit log (sử dụng req.userId từ authMiddleware)
      await AdminActivity.create({
        admin_id: req.userId,
        action: 'VIEW_AGGREGATED_INSIGHTS',
        target_type: 'system',
        details: {
          date_range: dateRange || 'last_30_days',
          start_date: startDate,
          end_date: endDate,
          segments: parsedSegments,
          timestamp: new Date()
        }
      });

      // 2. Gọi service để lấy insights
      const insights = await aggregatedInsightsService.fetchInsights(
        dateRange,
        startDate,
        endDate,
        parsedSegments
      );

      res.json(insights);
    } catch (error) {
      console.error('Error in getAggregatedInsights controller:', error);

      // Ghi log lỗi
      await AdminActivity.create({
        admin_id: req.userId,
        action: 'VIEW_AGGREGATED_INSIGHTS_FAILED',
        target_type: 'system',
        details: {
          error: error.message,
          stack: error.stack,
          query: req.query
        }
      });

      // Xử lý lỗi từ Python service
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      // Fallback nếu Python service không phản hồi
      try {
        const basicStats = await aggregatedInsightsService.generateBasicStats(req.query);
        return res.json(basicStats);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return res.status(500).json({ message: 'Unable to retrieve insights at this time.' });
      }
    }
  }
}

module.exports = new AdminController();