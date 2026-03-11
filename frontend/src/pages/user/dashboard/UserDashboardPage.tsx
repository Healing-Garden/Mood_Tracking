import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, BookOpen, TrendingUp } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import DailyCheckInModal from '../../../components/modals/DailyCheckInModal'
import MoodFlow from '../../../components/features/MoodFlow'
import { useDailyCheckInStore } from '../../../store/dailyCheckInStore'
import { userApi } from '../../../api/userApi'
import { dailyCheckInApi } from '../../../api/dailyCheckInApi'
import TriggerHeatmap from '../../../components/features/TriggerHeatmap'
import { DailySummaryCard } from '../../../components/features/DailySummaryCard';
import { useActionSuggestionStore } from '../../../store/actionSuggestionStore';
import ActionSuggestionModal from '../../../components/modals/ActionSuggestionModal';

const NEGATIVE_MOODS = ['very sad', 'very low', 'sad', 'low', 'anxious', 'stressed', 'angry', 'tired', 'overwhelmed'];

const UserDashboardPage = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState({
    checkIns: 0,
    avgMood: 0,
    journalEntries: 0,
    insightsGenerated: 0,
  })

  const { setShowModal, resetStore } = useDailyCheckInStore()
  const { lastMood } = useDailyCheckInStore();
  const { openModal } = useActionSuggestionStore();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const onboardingRes = await userApi.getOnboardingStatus()
        if (!onboardingRes.isOnboarded) {
          navigate('/onboarding/step-1', { replace: true })
          return
        }

        // Skip daily check-in if onboarded today
        if (onboardingRes.onboardedAt) {
          const onboardedDate = new Date(onboardingRes.onboardedAt).toDateString();
          const todayDate = new Date().toDateString();
          if (onboardedDate === todayDate) {
            console.log('Skipping today\'s check-in (onboarded today)');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch onboarding status:', error)
      }

      try {
        await dailyCheckInApi.getToday()
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status === 404) {
            resetStore()
            setShowModal(true)
          } else {
            console.error('Failed to fetch today check-in:', error.message)
          }
        }
      }
      try {
        const profile = await userApi.getProfile()
        // For now, we'll use profile data or defaults for journeyDays
        setDashboardData({
          journeyDays: Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1,
          moodDistribution: [] // Placeholder
        })
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setLoading(false)
      }
    }

    checkStatus()
  }, [setShowModal, resetStore, navigate])

  useEffect(() => {
    if (lastMood && NEGATIVE_MOODS.includes(lastMood.toLowerCase())) {
      openModal(lastMood);
    }
  }, [lastMood, openModal]);

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
    <DashboardLayout title="My Dashboard">
      <main className="px-6 lg:px-10 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-muted/70 to-muted/30 border border-border/40 rounded-3xl p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back 👋
              </h2>
              <p className="text-muted-foreground text-lg">
                {loading
                  ? '...'
                  : `You're on day ${dashboardData?.journeyDays || 1
                    } of your wellness journey. Keep going!`}
              </p>
            </div>

            {/* Mood Chart Card */}
            <Card className="border-border/40 shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Mood Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MoodFlow
                  defaultPeriod="week"
                  onDataChange={handleMoodDataChange}
                />
              </CardContent>
            </Card>

            {/* Heatmap */}
            <Card className="border-border/40 shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Emotional Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TriggerHeatmap defaultPeriod="week" />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-8">
            <DailySummaryCard />
            {/* Weekly Stats */}
            <Card className="border-border/40 shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Weekly Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Check-ins</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.checkIns}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Avg Mood</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.avgMood}/5</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Journal Entries</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.journalEntries}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">AI Insights</p>
                    <p className="text-2xl font-bold text-primary">{weeklyStats.insightsGenerated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/40 shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/user/journal">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white justify-start gap-2 rounded-xl">
                    <BookOpen size={18} />
                    Write Journal
                  </Button>
                </Link>
                <Link to="/user/analytics">
                  <Button variant="outline" className="w-full border-border/50 hover:bg-muted justify-start gap-2 rounded-xl">
                    <TrendingUp size={18} />
                    View Analytics
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-border/50 hover:bg-muted justify-start gap-2 rounded-xl">
                  <Brain size={18} />
                  AI Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <DailyCheckInModal />
      <ActionSuggestionModal />
    </DashboardLayout>
  )
}

export default UserDashboardPage
