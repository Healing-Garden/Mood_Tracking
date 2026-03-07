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

import DashboardSidebar from '../../../components/layout/DashboardSideBar';

const AnalyticsPage: React.FC = () => {
  useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex min-h-screen bg-background text-gray-500">
        <div className={`fixed inset-y-0 left-0 z-30 lg:static lg:block`}>
          <DashboardSidebar userType="admin" onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="admin" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Analytics Dashboard</h1>
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">
              <p>Error: {error}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Bộ lọc */}
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow">
            <DateRangeSelector
              value={dateRange || 'last_30_days'}
              onChange={handleDateRangeChange}
              startDate={startDate}
              endDate={endDate}
            />
            <SegmentFilter ageGroup={ageGroup} onChange={setAgeGroup} />
          </div>

          {data?.executive_summary.message ? (
            <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-700">
              {data.executive_summary.message}
            </div>
          ) : data ? (
            <>
              {/* Executive Summary */}
              <div className="mb-8">
                <ExecutiveSummaryCards data={data.executive_summary} />
              </div>

              {/* Correlation Insights */}
              {data.correlation_insights.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold">Correlation Insights</h2>
                  <CorrelationInsights insights={data.correlation_insights} />
                </div>
              )}

              {/* Mood Distribution */}
              {Object.keys(data.usage_patterns.mood_distribution).length > 0 && (
                <div className="mb-8 rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-semibold">Mood Distribution</h2>
                  <MoodDistributionChart data={data.usage_patterns.mood_distribution} />
                </div>
              )}

              {/* Demographic Trends */}
              {data.demographic_trends.avg_mood_by_age &&
                Object.keys(data.demographic_trends.avg_mood_by_age).length > 0 && (
                  <div className="mb-8 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-semibold">Average Mood by Age Group</h2>
                    <DemographicTrendsChart data={data.demographic_trends.avg_mood_by_age} />
                  </div>
                )}

              <div className="text-right text-sm text-gray-500">
                Generated at: {data && data.generated_at ? new Date(data.generated_at).toLocaleString() : 'Just now'}
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;