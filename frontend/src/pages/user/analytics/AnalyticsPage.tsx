import React, { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import {
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts'
import { Download, Menu, X, Lightbulb } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'

const moodTrendData = [
  { week: 'Week 1', mood: 3.2, energy: 2.8, stress: 3.5 },
  { week: 'Week 2', mood: 3.5, energy: 3.0, stress: 3.2 },
  { week: 'Week 3', mood: 3.8, energy: 3.3, stress: 2.8 },
  { week: 'Week 4', mood: 4.1, energy: 3.6, stress: 2.4 },
  { week: 'Week 5', mood: 4.3, energy: 3.8, stress: 2.1 },
  { week: 'Week 6', mood: 4.4, energy: 3.9, stress: 2.0 },
]

const emotionData = [
  { emotion: 'Happy', count: 128 },
  { emotion: 'Calm', count: 105 },
  { emotion: 'Grateful', count: 92 },
  { emotion: 'Anxious', count: 45 },
  { emotion: 'Sad', count: 28 },
]

const triggerData = [
  { trigger: 'Work', positive: 35, negative: 22 },
  { trigger: 'Family', positive: 42, negative: 15 },
  { trigger: 'Health', positive: 28, negative: 38 },
  { trigger: 'Social', positive: 48, negative: 12 },
  { trigger: 'Personal', positive: 55, negative: 18 },
]

const dailyMoodData = [
  { date: 'Jan 15', mood: 3.5 },
  { date: 'Jan 16', mood: 3.7 },
  { date: 'Jan 17', mood: 3.9 },
  { date: 'Jan 18', mood: 4.0 },
  { date: 'Jan 19', mood: 4.2 },
  { date: 'Jan 20', mood: 4.1 },
  { date: 'Jan 21', mood: 4.3 },
  { date: 'Jan 22', mood: 4.4 },
]

const COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-chart-3)', 'var(--color-chart-4)']

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
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-lg p-1">
            <TabsTrigger
              value="mood"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
            >
              Mood Trend
            </TabsTrigger>
            <TabsTrigger
              value="emotions"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
            >
              Emotions
            </TabsTrigger>
            <TabsTrigger
              value="triggers"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
            >
              Triggers
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
            >
              Daily
            </TabsTrigger>
          </TabsList>

          {/* Mood Trend */}
          <TabsContent value="mood">
            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-primary">Mood Trend Over Time</CardTitle>
                <CardDescription>Your mood, energy, and stress levels across weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={moodTrendData}>
                      <defs>
                        <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="stress"
                        fill="url(#stressGradient)"
                        stroke="var(--color-destructive)"
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        dot={{ fill: 'var(--color-primary)', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        stroke="var(--color-accent)"
                        strokeWidth={2.5}
                        dot={{ fill: 'var(--color-accent)', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emotions */}
          <TabsContent value="emotions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-border shadow-md">
                <CardHeader>
                  <CardTitle className="text-primary">Most Tracked Emotions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="emotion" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-md">
                <CardHeader>
                  <CardTitle className="text-primary">Emotion Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emotionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ payload }) => `${payload.emotion}: ${payload.count}`}
                          outerRadius={100}
                          dataKey="count"
                        >
                          {emotionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Triggers */}
          <TabsContent value="triggers">
            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-primary">Triggers Impact Analysis</CardTitle>
                <CardDescription>How different triggers affect your mood</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={triggerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="trigger" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="positive" fill="var(--color-primary)" name="Positive Impact" />
                      <Bar dataKey="negative" fill="var(--color-destructive)" name="Negative Impact" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily */}
          <TabsContent value="daily">
            <Card className="border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-primary">Daily Mood Pattern</CardTitle>
                <CardDescription>Your mood over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyMoodData}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="var(--color-primary)"
                        fillOpacity={1}
                        fill="url(#colorMood)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
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