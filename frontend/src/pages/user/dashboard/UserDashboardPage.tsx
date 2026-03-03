import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, BookOpen, TrendingUp, Menu, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import DailyCheckInModal from '../../../components/modals/DailyCheckInModal'
import MoodFlow from '../../../components/features/MoodFlow'
import { useDailyCheckInStore } from '../../../store/dailyCheckInStore'
import { dailyCheckInApi } from '../../../api/dailyCheckInApi'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'

const UserDashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState({
    checkIns: 0,
    avgMood: 0,
    journalEntries: 0,
    insightsGenerated: 0,
  })

  const { setShowModal, resetStore } = useDailyCheckInStore()

  // Kiểm tra trạng thái check-in hôm nay từ database khi mở dashboard
  useEffect(() => {
    const checkTodayFromServer = async () => {
      try {
        await dailyCheckInApi.getToday()
        // Đã có check-in hôm nay
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status

          if (status === 404) {
            // Chưa check-in hôm nay
            resetStore()
            // Mở modal
            setShowModal(true)
          } else {
            console.error('Failed to fetch today check-in:', error.message)
          }
        } else {
          console.error('Unexpected error:', error)
        }
      }
    }

    checkTodayFromServer()

    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const data = await dailyCheckInApi.getDashboardData()
        setDashboardData(data)
        setWeeklyStats(data.weeklyStats)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [setShowModal, resetStore])

  const handleMoodDataChange = useCallback((points: any[]) => {
    if (points.length === 0) {
      setWeeklyStats((prev) => ({ ...prev, checkIns: 0, avgMood: 0 }))
    } else {
      const totalMood = points.reduce((sum, p) => sum + p.mood, 0)
      const avgMood = totalMood / points.length
      setWeeklyStats((prev) => ({
        ...prev,
        checkIns: points.length,
        avgMood: Number(avgMood.toFixed(1)),
      }))
    }
  }, [])

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
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-muted to-muted/50 rounded-2xl p-8 border border-border/30">
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h2>
                <p className="text-muted-foreground">
                  {loading ? '...' : `You're on day ${dashboardData?.journeyDays || 1} of your wellness journey. Keep going!`}
                </p>
              </div>

              {/* Mood Trend Chart */}
              <MoodFlow
                defaultPeriod="week"
                onDataChange={handleMoodDataChange}
              />

              {/* Emotions Breakdown */}
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain size={20} className="text-primary" />
                    Emotions Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData?.moodDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name} ${value}%` : ''}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(dashboardData?.moodDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trigger Heatmap */}
              <TriggerHeatmap defaultPeriod="week" />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Weekly Stats */}
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Check-ins</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.checkIns}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Avg Mood</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.avgMood}/5</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Journal Entries</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.journalEntries}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">AI Insights</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.insightsGenerated}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/user/journal">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white justify-start gap-2">
                      <BookOpen size={18} />
                      Write Journal
                    </Button>
                  </Link>
                  <Link to="/user/analytics">
                    <Button variant="outline" className="w-full border-border/50 text-foreground hover:bg-muted justify-start gap-2 bg-transparent">
                      <TrendingUp size={18} />
                      View Analytics
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full border-border/50 text-foreground hover:bg-muted justify-start gap-2 bg-transparent">
                    <Brain size={18} />
                    AI Insights
                  </Button>
                </CardContent>
              </Card>

              {/* Wellness Tips */}
              <Card className="border-border/50 shadow-md bg-gradient-to-br from-accent/20 to-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg">💡 Today's Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Take a 5-minute breathing break. It can reduce anxiety and improve your mood significantly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Daily Check-in Modal */}
      <DailyCheckInModal />
    </div>
  )
}

export default UserDashboardPage
