import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { dailyCheckInApi, type SummaryResponse } from '../../../api/dailyCheckInApi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import { Download, Menu, X, TrendingUp } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'
import MoodFlow from '../../../components/features/MoodFlow'
import WordCloud from '../../../components/features/WordCloud'
import MoodCalendar from '../../../components/features/MoodCalendar'

type TimeRange = 'week' | 'month' | 'quarter' | 'year'

const AnalyticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [isExporting, setIsExporting] = useState(false)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        // Map 'quarter' to 'month' because BE currently supports 'week', 'month', 'year'
        const period = timeRange === 'quarter' ? 'month' : timeRange as 'week' | 'month' | 'year'
        const data = await dailyCheckInApi.getAnalyticsSummary(period)
        setSummary(data)
      } catch (error) {
        console.error('Failed to load summary:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [timeRange])

  const handleExport = async () => {
    setIsExporting(true)
    // TODO: Thực tế gọi API export PDF/CSV
    console.log('Exporting report for range:', timeRange)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsExporting(false)
    alert('Report exported successfully! (mock)')
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Avg Mood</CardTitle>
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

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {loading ? '...' : `${summary?.current.consistency || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Daily check-ins</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {loading ? '...' : (summary?.current.journalEntries || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">In this {timeRange}</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {loading ? '...' : (summary?.current.insightCount || 0)}
                </div>
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
                <span className="text-2xl">✨</span> AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
                <span className="text-3xl">📈</span>
                <div>
                  <p className="font-semibold text-primary mb-1">Positive Trend</p>
                  <p className="text-sm text-muted-foreground">Your mood has improved 35% over the last 6 weeks</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
                <span className="text-3xl">🎯</span>
                <div>
                  <p className="font-semibold text-primary mb-1">Key Trigger</p>
                  <p className="text-sm text-muted-foreground">Social activities boost your mood the most</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
                <span className="text-3xl">💪</span>
                <div>
                  <p className="font-semibold text-primary mb-1">Consistency</p>
                  <p className="text-sm text-muted-foreground">You've maintained 89% check-in consistency</p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:shadow-md transition-shadow">
                <span className="text-3xl">💡</span>
                <div>
                  <p className="font-semibold text-primary mb-1">Suggestion</p>
                  <p className="text-sm text-muted-foreground">Try meditation when facing work-related stress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage