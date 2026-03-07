export interface ExecutiveSummary {
  total_active_users: number;
  average_mood: number | null;
  total_interactions: number;
  date_range: {
    start: string;
    end: string;
  };
  message?: string;
}

export interface CorrelationInsight {
  title: string;
  description: string;
  correlation_coefficient?: number;
  p_value?: number;
}

export interface UsagePatterns {
  mood_distribution: Record<string, number>; 
  peak_usage_hours: Record<number, number> | null;
  most_used_features: Array<{ feature: string; count: number }>;
}

export interface DemographicTrends {
  avg_mood_by_age?: Record<string, number>; 
}

export interface AggregatedInsights {
  executive_summary: ExecutiveSummary;
  correlation_insights: CorrelationInsight[];
  usage_patterns: UsagePatterns;
  demographic_trends: DemographicTrends;
  generated_at: string; 
}