import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import { Download, Menu, X, AlertTriangle } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'
import MoodFlow from '../../../components/features/MoodFlow'
import WordCloud from '../../../components/features/WordCloud'
import MoodCalendar from '../../../components/features/MoodCalendar'
import { aiApi } from '../../../api/aiApi'
import { useAuth } from '../../../hooks/useAuth'

type TimeRange = 'week' | 'month' | 'quarter' | 'year'

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
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [isExporting, setIsExporting] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [trendData, setTrendData] = useState<TrendAnalysis | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const getDaysFromRange = (range: TimeRange): number => {
    switch (range) {
      case 'week': return 7
      case 'month': return 30
      case 'quarter': return 90
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
    // TODO: Thực tế gọi API export PDF/CSV
    console.log('Exporting report for range:', timeRange)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsExporting(false)
    alert('Report exported successfully! (mock)')
  }

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
                onClick={handleExport}
                disabled={isExporting}
                className="bg-primary hover:bg-primary/90 text-white gap-2 h-10"
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export Report'}
              </Button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
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
            {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map(range => (
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
                {loadingAI ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                ) : (
                  <div className="text-3xl font-bold text-primary">
                    {scoreToDisplayMood(trendData?.stats?.average_mood)}
                    <span className="text-base font-normal text-muted-foreground">/5</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {trendData?.stats ? (
                    <>{getTrendArrow(trendData.stats.trend_slope)} {trendData.overallTrend} trend</>
                  ) : 'Tracking your mood'}
                </p>
              </CardContent>
            </Card>

            {/* Volatility */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Emotional Stability</CardTitle>
              </CardHeader>
              <CardContent>
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
                <CardTitle className="text-sm font-semibold text-muted-foreground">Days Tracked</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Insights Count */}
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
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
              <MoodFlow defaultPeriod="month" />
            </TabsContent>

            {/* Mood Calendar */}
            <TabsContent value="calendar">
              <MoodCalendar />
            </TabsContent>

            {/* Word Cloud */}
            <TabsContent value="wordcloud">
              <WordCloud defaultPeriod="month" />
            </TabsContent>

            {/* Trigger Heatmap */}
            <TabsContent value="triggers">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Heatmap - main */}
                <div className="lg:col-span-2">
                  <TriggerHeatmap />
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