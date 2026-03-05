import { useState, useEffect, useRef } from 'react'

import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { dailyCheckInApi, type SummaryResponse } from '../../../api/dailyCheckInApi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import { Download, Menu, X, TrendingUp, AlertTriangle } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'
import MoodFlow from '../../../components/features/MoodFlow'
import WordCloud from '../../../components/features/WordCloud'
import MoodCalendar from '../../../components/features/MoodCalendar'
import ReportTemplate from '../../../components/features/ReportTemplate'
import jsPDF from 'jspdf'
import { toPng } from 'html-to-image'
import { aiApi } from '../../../api/aiApi'
import { useAuth } from '../../../hooks/useAuth'

type TimeRange = 'week' | 'month' | 'year'

interface TrendAnalysis {
  moodPoints: Array<{
    date: string
    mood_score: number | null
    sentiment_score: number | null
    energy_level: number | null
  }>
  overallTrend: string
  trendScore: number
  volatility: number
  insights: string[]
  riskFlags: string[]
  stats: {
    data_points: number
    average_mood: number
    min_mood: number
    max_mood: number
    trend_slope: number
    volatility: number
    analysis_period_days: number
  }
}

const AnalyticsPage = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [isExporting, setIsExporting] = useState(false)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const reportRef = useRef<HTMLDivElement>(null)

  // Helper for date range display
  const getFormattedDateRange = (range: TimeRange) => {
    const end = new Date();
    let start = new Date();

    if (range === 'week') start.setDate(end.getDate() - 7);
    else if (range === 'month') start.setMonth(end.getMonth() - 1);
    else if (range === 'year') start.setFullYear(end.getFullYear() - 1);

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  // Export Modal & Config
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    summaryRange: 'week' as TimeRange,
    moodFlowRange: 'week' as TimeRange,
    heatmapRange: 'week' as TimeRange,
    wordCloudRange: 'week' as TimeRange
  });

  const [exportSummary, setExportSummary] = useState<SummaryResponse | null>(null);

  // Sync config when modal opens
  useEffect(() => {
    if (showExportModal) {
      setExportConfig(prev => ({ ...prev, summaryRange: timeRange }));
    }
  }, [showExportModal, timeRange]);

  // Load summary for export if range changes
  useEffect(() => {
    if (showExportModal) {
      const loadExportSummary = async () => {
        try {
          const data = await dailyCheckInApi.getAnalyticsSummary(exportConfig.summaryRange)
          setExportSummary(data)
        } catch (error) {
          console.error('Failed to load export summary:', error)
        }
      }
      loadExportSummary()
    }
  }, [exportConfig.summaryRange, showExportModal]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        const data = await dailyCheckInApi.getAnalyticsSummary(timeRange)
        setSummary(data)
      } catch (error) {
        console.error('Failed to load summary:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [timeRange])
  const [loadingAI, setLoadingAI] = useState(false)
  const [trendData, setTrendData] = useState<TrendAnalysis | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const getDaysFromRange = (range: TimeRange): number => {
    switch (range) {
      case 'week': return 7
      case 'month': return 30
      case 'year': return 365
      default: return 30
    }
  }

  const fetchTrendData = async () => {
    if (!user?.id) {
      console.warn('User not authenticated')
      return
    }

    setLoadingAI(true)
    setAiError(null)
    try {
      const days = getDaysFromRange(timeRange)
      // http.ts interceptor returns res.data directly, so `response` IS the { success, data, error } object
      const response = await aiApi.analyzeTrends(user.id, days) as unknown as {
        success: boolean
        data: TrendAnalysis
        error?: string
      }

      if (response?.success) {
        setTrendData(response.data)
      } else {
        const errMsg = response?.error || 'Failed to fetch trend data'
        console.error('Failed to fetch trend data:', errMsg)
        setAiError(errMsg)
      }
    } catch (error) {
      console.error('Error fetching trend data:', error)
      setAiError('Advanced insights are temporarily unavailable. Below is your logged data.')
    } finally {
      setLoadingAI(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchTrendData()
    }
  }, [timeRange, user])


  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Delay to ensure all charts and AI content are fully rendered
      await new Promise(resolve => setTimeout(resolve, 2500));

      if (reportRef.current) {
        // Capture with high resolution and reset scaling to avoid distortion
        const imgData = await toPng(reportRef.current, {
          quality: 1,
          pixelRatio: 2,
          width: 800,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            visibility: 'visible',
            position: 'static'
          }
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight();
        const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeightInPdf;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfPageHeight;

        // Add subsequent pages if content exceeds one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeightInPdf; // Calculate offset for the next segment
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
          heightLeft -= pdfPageHeight;
        }

        pdf.save(`HealingGarden_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowExportModal(false);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  const ExportPreviewModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showExportModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-primary">Export Mental Health Report</h2>
            <p className="text-slate-500 text-sm">Configure your report sections before downloading</p>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Close export modal"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Settings Sidebar */}
          <div className="w-full md:w-80 p-6 border-r bg-slate-50/50 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Configuration
              </h3>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Summary Statistics</label>
                <div className="grid grid-cols-3 gap-1">
                  {['week', 'month', 'year'].map(r => (
                    <button
                      key={r}
                      onClick={() => setExportConfig({ ...exportConfig, summaryRange: r as TimeRange })}
                      className={`py-1.5 text-xs rounded-md border font-medium transition-all ${exportConfig.summaryRange === r ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Mood Flow Range</label>
                <div className="grid grid-cols-3 gap-1">
                  {['week', 'month', 'year'].map(r => (
                    <button
                      key={r}
                      onClick={() => setExportConfig({ ...exportConfig, moodFlowRange: r as TimeRange })}
                      className={`py-1.5 text-xs rounded-md border font-medium transition-all ${exportConfig.moodFlowRange === r ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Trigger Factors Range</label>
                <div className="grid grid-cols-3 gap-1">
                  {['week', 'month', 'year'].map(r => (
                    <button
                      key={r}
                      onClick={() => setExportConfig({ ...exportConfig, heatmapRange: r as TimeRange })}
                      className={`py-1.5 text-xs rounded-md border font-medium transition-all ${exportConfig.heatmapRange === r ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Common Themes Range</label>
                <div className="grid grid-cols-3 gap-1">
                  {['week', 'month', 'year'].map(r => (
                    <button
                      key={r}
                      onClick={() => setExportConfig({ ...exportConfig, wordCloudRange: r as TimeRange })}
                      className={`py-1.5 text-xs rounded-md border font-medium transition-all ${exportConfig.wordCloudRange === r ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-11 text-base font-bold shadow-lg shadow-primary/20"
              >
                {isExporting ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</span> : <><Download size={20} /> Download PDF</>}
              </Button>
            </div>
          </div>

          {/* Report Preview */}
          <div className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center">
            <div className="shadow-2xl origin-top scale-[0.55] sm:scale-[0.65] md:scale-[0.5] lg:scale-[0.6] xl:scale-[0.7]">
              <ReportTemplate
                ref={reportRef}
                summary={exportSummary || summary}
                timeRange={exportConfig.summaryRange}
                userName={JSON.parse(localStorage.getItem('user') || '{"name": "User"}').name}
                dateRange={getFormattedDateRange(exportConfig.summaryRange)}
                isPreview={true}
                exportConfig={exportConfig}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to convert internal score (-1 to +1) to 1-5 display scale
  const scoreToDisplayMood = (score: number | undefined): string => {
    if (score === undefined) return '—'
    // internal: -1→1, -0.5→2, 0→3, 0.5→4, 1→5
    const display = (score + 1) / 2 * 4 + 1
    return Math.min(5, Math.max(1, display)).toFixed(1)
  }

  // Helper to get trend arrow
  const getTrendArrow = (slope: number | undefined) => {
    if (slope === undefined) return null
    if (slope > 0.02) return <span className="text-green-500">↑</span>
    if (slope < -0.02) return <span className="text-red-500">↓</span>
    return <span className="text-muted-foreground">→</span>
  }

  // Helper để lấy icon cho insight
  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes('improving')) return '📈'
    if (insight.toLowerCase().includes('downward') || insight.toLowerCase().includes('below average')) return '📉'
    if (insight.toLowerCase().includes('volatile') || insight.toLowerCase().includes('fluctuat')) return '🌊'
    if (insight.toLowerCase().includes('best on')) return '🌟'
    if (insight.toLowerCase().includes('support')) return '🤝'
    if (insight.toLowerCase().includes('mindfulness')) return '🧘'
    return '💡'
  }

  // Helper để lấy title ngắn cho insight
  const getInsightTitle = (insight: string) => {
    if (insight.toLowerCase().includes('improving')) return 'Positive Trend'
    if (insight.toLowerCase().includes('downward')) return 'Declining Trend'
    if (insight.toLowerCase().includes('volatile')) return 'Emotional Volatility'
    if (insight.toLowerCase().includes('best on')) return 'Weekly Pattern'
    if (insight.toLowerCase().includes('support')) return 'Support Suggestion'
    if (insight.toLowerCase().includes('mindfulness')) return 'Mindfulness Tip'
    return 'AI Suggestion'
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ExportPreviewModal />

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">Analytics & Insights</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowExportModal(true)}
                className="bg-primary hover:bg-primary/90 text-white gap-2 h-10"
              >
                <Download size={18} />
                Export Report
              </Button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Time Range Selector */}
          <div className="mb-8 flex flex-wrap gap-3">
            {(['week', 'month', 'year'] as TimeRange[]).map(range => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? 'default' : 'outline'}
                className={
                  timeRange === range
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'border-primary text-primary hover:bg-primary/10'
                }
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>

          {/* Hiển thị cảnh báo nếu có risk flag */}
          {trendData?.riskFlags.includes('prolonged_negative_trend') && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-bold">Mental Health Alert</h3>
                <p className="text-sm">
                  We've detected a prolonged negative trend over the last 7 days.
                  Please take care of yourself and consider reaching out for support.
                </p>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Avg Mood */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Avg Mood Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {loading ? '...' : (summary?.current.avgMood || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary && summary.moodTrend !== 0 ? (
                    <>
                      <span className={summary.moodTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                        {summary.moodTrend > 0 ? '↑' : '↓'} {Math.abs(summary.moodTrend)}
                      </span> from last {timeRange}
                    </>
                  ) : 'No change'}
                </p>
              </CardContent>
            </Card>

            {/* Volatility */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Emotional Stability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {loading ? '...' : `${summary?.current.consistency || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Daily check-ins</p>
                {loadingAI ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-accent">
                    {trendData?.stats
                      ? trendData.volatility < 0.2 ? 'High'
                        : trendData.volatility < 0.4 ? 'Medium'
                          : 'Low'
                      : '—'}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {trendData?.stats
                    ? `Volatility: ${(trendData.volatility * 100).toFixed(0)}%`
                    : 'Mood consistency'}
                </p>
              </CardContent>
            </Card>

            {/* Data Points */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Entries
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {loading ? '...' : (summary?.current.journalEntries || 0)}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  In this {timeRange}
                </p>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Days Tracked
                  </p>

                  {loadingAI ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                  ) : (
                    <div className="text-3xl font-bold text-primary">
                      {trendData?.stats?.data_points ?? '—'}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {trendData?.stats
                      ? `In last ${trendData.stats.analysis_period_days} days`
                      : 'Check-in days'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Insights Count */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {loading ? '...' : (summary?.current.insightCount || 0)}
                </div>
                {loadingAI ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-accent">
                    {trendData?.insights?.length ?? '—'}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">AI insights generated</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Tabs */}
          <Tabs defaultValue="mood" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-lg p-1">
              <TabsTrigger
                value="mood"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
              >
                Mood Flow
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="triggers"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
              >
                Triggers
              </TabsTrigger>
              <TabsTrigger
                value="wordcloud"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
              >
                Word Cloud
              </TabsTrigger>
            </TabsList>

            {/* Mood Trend */}
            <TabsContent value="mood">
              <MoodFlow defaultPeriod="week" />
            </TabsContent>

            {/* Mood Calendar */}
            <TabsContent value="calendar">
              <MoodCalendar />
            </TabsContent>

            {/* Word Cloud */}
            <TabsContent value="wordcloud">
              <WordCloud defaultPeriod="week" />
            </TabsContent>

            {/* Trigger Heatmap */}
            <TabsContent value="triggers">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Heatmap - main */}
                <div className="lg:col-span-2">
                  <TriggerHeatmap defaultPeriod="week" />
                </div>

                {/* Insight panel */}
                <Card className="border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="text-primary">Trigger Insights</CardTitle>
                    <CardDescription>Key emotional correlations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-sm font-semibold text-destructive">
                        🚨 Most Negative Trigger
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Work-related triggers correlate strongly with negative moods.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-sm font-semibold text-green-600">
                        🌱 Most Positive Trigger
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Social & leisure activities improve mood significantly.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/40 border border-border">
                      <p className="text-sm font-semibold">
                        ℹ How to read
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Darker colors indicate higher frequency of that mood for a trigger.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

          </Tabs>

          {/* Comparative Analysis */}
          <Card className="mb-10 border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <TrendingUp size={20} />
                Comparative Analysis
              </CardTitle>
              <CardDescription>
                Comparing current {timeRange} vs previous {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                    <tr>
                      <th className="px-6 py-3 font-medium">Metric</th>
                      <th className="px-6 py-3 font-medium text-center">Previous {timeRange}</th>
                      <th className="px-6 py-3 font-medium text-center">Current {timeRange}</th>
                      <th className="px-6 py-3 font-medium text-center">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { label: 'Avg Mood', key: 'avgMood', suffix: '/5' },
                      { label: 'Consistency', key: 'consistency', suffix: '%' },
                      { label: 'Journal Entries', key: 'journalEntries', suffix: '' },
                      { label: 'AI Insights', key: 'insightCount', suffix: '' },
                    ].map((item) => {
                      const curr = summary?.current[item.key as keyof typeof summary.current] || 0;
                      const prev = summary?.previous[item.key as keyof typeof summary.previous] || 0;
                      const diff = curr - prev;
                      const isPositive = diff > 0;

                      return (
                        <tr key={item.label} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{item.label}</td>
                          <td className="px-6 py-4 text-center text-muted-foreground">{prev}{item.suffix}</td>
                          <td className="px-6 py-4 text-center font-bold text-primary">{curr}{item.suffix}</td>
                          <td className="px-6 py-4 text-center">
                            {diff !== 0 ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${isPositive && item.key !== 'avgMood' || (isPositive && item.key === 'avgMood' && diff > 0)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {isPositive ? '↑' : '↓'} {Math.abs(Number(diff.toFixed(1)))}{item.suffix}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="mt-12 border-border shadow-md bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <span className="text-2xl">✨</span> AI Insights &amp; Recommendations
                {loadingAI && <span className="ml-2 text-sm text-muted-foreground">(updating...)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingAI ? (
                <div className="col-span-2 flex items-center justify-center p-10 text-muted-foreground gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing your emotional trends...</span>
                </div>
              ) : aiError ? (
                <div className="col-span-2 p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <p className="font-semibold mb-1">⚠️ Advanced insights are temporarily unavailable.</p>
                  <p className="text-sm">Below is your logged data. Please try again later.</p>
                  <p className="text-xs mt-2 opacity-70">Error: {aiError}</p>
                </div>
              ) : trendData?.overallTrend === 'insufficient_data' ? (
                <div className="col-span-2 p-6 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                  <p className="font-semibold mb-1">📊 Keep logging to unlock AI insights!</p>
                  <p className="text-sm">{trendData.insights[0] || 'Please continue logging your mood for at least 7 days to enable trend analysis.'}</p>
                </div>
              ) : trendData && trendData.insights.length > 0 ? (
                trendData.insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
                    <span className="text-3xl">{getInsightIcon(insight)}</span>
                    <div>
                      <p className="font-semibold text-primary mb-1">{getInsightTitle(insight)}</p>
                      <p className="text-sm text-muted-foreground">{insight}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center p-8 text-muted-foreground">
                  No insights available at the moment.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage