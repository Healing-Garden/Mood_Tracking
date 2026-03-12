import React, { useState, useEffect } from 'react';
import type { AggregatedInsightsParams } from '../../../api/aggregatedInsights';
import { useAggregatedInsights } from '../../../hooks/useAggregatedInsights';
import { DateRangeSelector } from '../../../components/features/aggregated-insights/DateRangeSelector';
import { SegmentFilter } from '../../../components/features/aggregated-insights/SegmentFilter';
import { ExecutiveSummaryCards } from '../../../components/features/aggregated-insights/ExecutiveSummary';
import { CorrelationInsights } from '../../../components/features/aggregated-insights/CorrelationInsights';
import { MoodDistributionChart } from '../../../components/features/aggregated-insights/MoodDistributionChart';
import { DemographicTrendsChart } from '../../../components/features/aggregated-insights/DemographicTrendsChart';
import { useAuth } from '../../../hooks/useAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Button } from '../../../components/ui/Button';
import { RefreshCcw } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  useAuth();
  const [dateRange, setDateRange] = useState<AggregatedInsightsParams['dateRange']>('last_30_days');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [ageGroup, setAgeGroup] = useState<string>();

  const { data, loading, error, refetch, setParams } = useAggregatedInsights({
    dateRange: 'last_30_days',
  });

  useEffect(() => {
    setParams({
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined,
      segments: ageGroup ? { age_group: ageGroup } : {},
    });
  }, [dateRange, startDate, endDate, ageGroup, setParams]);

  const handleDateRangeChange = (range: any, start?: string, end?: string) => {
    setDateRange(range);
    setStartDate(start);
    setEndDate(end);
  };

  if (loading && !data) {
    return (
      <DashboardLayout title="Analytics Dashboard" userType="admin">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-4 transition-all duration-300">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium text-sm">Aggregating community insights...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Analytics Dashboard" 
      userType="admin"
      headerActions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          className="gap-2"
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
        <div className="px-4 py-8 max-w-[1600px] mx-auto w-full transition-all duration-300">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-red-700 flex flex-col items-start gap-3">
              <p className="text-sm font-medium">Error: {error}</p>
              <Button
                onClick={() => refetch()}
                variant="destructive"
                size="sm"
              >
                Retry Request
              </Button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-sm border border-border">
            <DateRangeSelector
              value={dateRange || 'last_30_days'}
              onChange={handleDateRangeChange}
              startDate={startDate}
              endDate={endDate}
            />
            <div className="h-8 w-px bg-border hidden sm:block" />
            <SegmentFilter ageGroup={ageGroup} onChange={setAgeGroup} />
          </div>

          {data?.executive_summary.message ? (
            <div className="mb-6 rounded-xl bg-orange-50 border border-orange-100 p-6 text-orange-800 flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <p className="font-medium">{data.executive_summary.message}</p>
            </div>
          ) : data ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Executive Summary */}
              <ExecutiveSummaryCards data={data.executive_summary} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Mood Distribution */}
                  {Object.keys(data.usage_patterns.mood_distribution).length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
                      <h2 className="mb-6 text-lg font-bold text-foreground">Community Mood Distribution</h2>
                      <MoodDistributionChart data={data.usage_patterns.mood_distribution} />
                    </div>
                  )}

                  {/* Demographic Trends */}
                  {data.demographic_trends.avg_mood_by_age &&
                    Object.keys(data.demographic_trends.avg_mood_by_age).length > 0 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border">
                        <h2 className="mb-6 text-lg font-bold text-foreground">Average Mood by Age Group</h2>
                        <DemographicTrendsChart data={data.demographic_trends.avg_mood_by_age} />
                      </div>
                    )}
              </div>

              {/* Correlation Insights */}
              {data.correlation_insights.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Deep Insights & Correlations</h2>
                  <CorrelationInsights insights={data.correlation_insights} />
                </div>
              )}

              <div className="text-center pt-8 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Report generated at: {data && data.generated_at ? new Date(data.generated_at).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
                <p className="text-muted-foreground">No data available for the selected criteria.</p>
            </div>
          )}
        </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;