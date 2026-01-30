import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { Heart, Brain, BookOpen, TrendingUp, Plus, Menu, X } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import DailyCheckInModal from '../../../components/modals/DailyCheckInModal'
import { useDailyCheckInStore } from '../../../store/dailyCheckInStore'

const moodTrendData = [
  { day: 'Mon', mood: 7, energy: 6 },
  { day: 'Tue', mood: 6, energy: 7 },
  { day: 'Wed', mood: 8, energy: 5 },
  { day: 'Thu', mood: 7, energy: 8 },
  { day: 'Fri', mood: 9, energy: 7 },
  { day: 'Sat', mood: 8, energy: 8 },
  { day: 'Sun', mood: 7, energy: 6 },
]

const emotionBreakdownData = [
  { name: 'Happy', value: 35, fill: '#52b788' },
  { name: 'Calm', value: 28, fill: '#7fdb8e' },
  { name: 'Anxious', value: 18, fill: '#f4d35e' },
  { name: 'Sad', value: 19, fill: '#8b5cf6' },
]

const weeklyStatsData = {
  checkIns: 7,
  avgMood: 7.7,
  journalEntries: 5,
  insightsGenerated: 3,
}

const UserDashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number>(5)

  const { setShowModal, hasCheckedInToday } = useDailyCheckInStore()

  // Kiểm tra và hiển thị modal check-in nếu chưa check-in hôm nay
  useEffect(() => {
    const hydrateStore = async () => {
      // Đợi store hydrate từ localStorage
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      if (!hasCheckedInToday()) {
        setShowModal(true)
      }
    }

    hydrateStore()
  }, [])

  const handleQuickCheckin = () => {
    if (selectedMood !== null) {
      console.log('Quick check-in:', { mood: selectedMood, energy: energyLevel })
      setSelectedMood(null)
      setEnergyLevel(5)
    }
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
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back! 👋</h2>
                <p className="text-muted-foreground">You're on day 7 of your wellness journey. Keep going!</p>
              </div>

              {/* Quick Check-in */}
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart size={20} className="text-primary" />
                    Today's Check-in
                  </CardTitle>
                  <CardDescription>How are you feeling today?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mood Selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Mood (1-5)</p>
                    <div className="flex gap-2 justify-between">
                      {[1, 2, 3, 4, 5].map((mood) => (
                        <button
                          key={mood}
                          onClick={() => setSelectedMood(mood)}
                          className={`flex-1 py-3 rounded-lg border-2 transition-all text-lg font-semibold ${
                            selectedMood === mood
                              ? 'border-primary bg-primary text-white'
                              : 'border-border/30 hover:border-primary/50'
                          }`}
                        >
                          {['😢', '😟', '😐', '😊', '😄'][mood - 1]}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very Bad</span>
                      <span>Very Good</span>
                    </div>
                  </div>

                  {/* Energy Level */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-foreground">Energy Level</p>
                      <span className="text-sm text-primary font-semibold">{energyLevel}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(Number(e.target.value))}
                      className="w-full h-2 bg-border/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <Button
                    onClick={handleQuickCheckin}
                    disabled={selectedMood === null}
                    className="w-full bg-primary hover:bg-primary/90 text-white h-11"
                  >
                    <Plus size={18} className="mr-2" />
                    Save Check-in
                  </Button>
                </CardContent>
              </Card>

              {/* Mood Trend Chart */}
              <Card className="border-border/50 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Weekly Mood Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={moodTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid var(--color-border)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="mood" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} name="Mood" />
                      <Line type="monotone" dataKey="energy" stroke="var(--color-chart-2)" strokeWidth={2} dot={{ r: 4 }} name="Energy" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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
                      <Pie data={emotionBreakdownData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {emotionBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
                    <p className="text-2xl font-bold text-primary">{weeklyStatsData.checkIns}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Avg Mood</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStatsData.avgMood}/10</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Journal Entries</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStatsData.journalEntries}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">AI Insights</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStatsData.insightsGenerated}</p>
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
