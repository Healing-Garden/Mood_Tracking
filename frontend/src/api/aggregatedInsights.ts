import http from './http';
import type { AggregatedInsights } from '../types/insights';

export interface AggregatedInsightsParams {
  dateRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  startDate?: string; // ISO date
  endDate?: string;
  segments?: {
    age_group?: string;
  };
}

export const getAggregatedInsights = async (
  params: AggregatedInsightsParams
): Promise<AggregatedInsights> => {
  const response = await http.get<AggregatedInsights>('/admin/analytics/aggregated-insights', {
    params: {
      dateRange: params.dateRange || 'last_30_days',
      startDate: params.startDate,
      endDate: params.endDate,
      segments: params.segments ? JSON.stringify(params.segments) : undefined,
    },
  });
  // http interceptor đã trả về res.data, nên response là dữ liệu cần
  return response as unknown as AggregatedInsights;
};