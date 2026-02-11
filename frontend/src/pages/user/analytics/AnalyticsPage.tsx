import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import { Download, Menu, X } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'
import MoodFlow from '../../../components/features/MoodFlow'
import WordCloud from '../../../components/features/WordCloud'

type TimeRange = 'week' | 'month' | 'quarter' | 'year'

const AnalyticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [isExporting, setIsExporting] = useState(false)

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
                <div className="text-3xl font-bold text-primary">4.3</div>
                <p className="text-xs text-muted-foreground mt-1">↑ 0.5 from last month</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">89%</div>
                <p className="text-xs text-muted-foreground mt-1">Daily check-ins</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">47</div>
                <p className="text-xs text-muted-foreground mt-1">Journal entries</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">12</div>
                <p className="text-xs text-muted-foreground mt-1">AI insights generated</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Tabs */}
          <Tabs defaultValue="mood" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-lg p-1">
              <TabsTrigger
                value="mood"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
              >
                Mood Flow
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