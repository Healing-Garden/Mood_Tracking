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
import FlowerMessenger from '../../../components/features/FlowerMessenger';
import { Quote as QuoteIcon, Sparkles } from 'lucide-react';
import type { HealingContent } from '../../../services/healingContentService';

const NEGATIVE_MOODS = ['very sad', 'very low', 'sad', 'low', 'anxious', 'stressed', 'angry', 'tired', 'overwhelmed'];

const UserDashboardPage = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [weeklyStats, setWeeklyStats] = useState({
    checkIns: 0,
    avgMood: 0,
    journalEntries: 0,
    insightsGenerated: 0,
  })
  const [dailyQuote, setDailyQuote] = useState<HealingContent | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState(true)

  const { setShowModal, resetStore } = useDailyCheckInStore()
  const { lastMood } = useDailyCheckInStore()
  const { openModal } = useActionSuggestionStore()

  // Dynamic greeting logic
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else if (hour < 21) setGreeting('Good Evening')
    else setGreeting('Good Night')
  }, [])

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const onboardingRes = await userApi.getOnboardingStatus()
        if (!onboardingRes.isOnboarded) {
          navigate('/onboarding/step-1', { replace: true })
          return
        }

        if (onboardingRes.onboardedAt) {
          const onboardedDate = new Date(onboardingRes.onboardedAt).toDateString()
          const todayDate = new Date().toDateString()
          if (onboardedDate === todayDate) {
            console.log("Skipping today's check-in (onboarded today)")
            return
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
        const [profile, stats] = await Promise.all([
          userApi.getProfile(),
          userApi.getDashboardData()
        ])
        
        setDashboardData({
          journeyDays: stats.journeyDays || 1,
          moodDistribution: stats.moodDistribution || [],
          userName: profile.fullName || 'User',
        })
        
        if (stats.weeklyStats) {
          setWeeklyStats(stats.weeklyStats)
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setLoading(false)
      }
    }

    checkStatus()
  }, [setShowModal, resetStore, navigate])

  // Fetch real "Quote of the Day" from database
  useEffect(() => {
    const fetchDailyQuote = async () => {
      setIsQuoteLoading(true)
      try {
        const quotes = await userApi.getHealingContent('quote')
        if (quotes && quotes.length > 0) {
          // Use date as seed for daily consistency
          const today = new Date();
          const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
          const index = seed % quotes.length;
          setDailyQuote(quotes[index])
        }
      } catch (error) {
        console.error('Failed to fetch daily quote:', error)
      } finally {
        setIsQuoteLoading(false)
      }
    }
    fetchDailyQuote()
  }, [])

  useEffect(() => {
    if (lastMood && NEGATIVE_MOODS.includes(lastMood.toLowerCase())) {
      openModal(lastMood)
    }
  }, [lastMood, openModal])

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
      <main className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* MAIN CONTENT - 8 Cols */}
          <div className="lg:col-span-8 flex flex-col gap-8 h-full">
            {/* Premium Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/10 rounded-[2rem] p-8 lg:p-10 shadow-sm transition-all hover:shadow-md">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
                    {greeting}, <span className="text-primary">{loading ? '...' : dashboardData?.userName}</span> 👋
                  </h2>
                  <p className="text-muted-foreground text-lg max-w-lg mb-6 leading-relaxed">
                    {loading
                      ? 'Preparing your space...'
                      : "We're glad to see you again. Take a deep breath and let's nurture your garden today."}
                  </p>

                  {!loading && (
                    <Link to="/user/journal">
                      <Button className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all">
                        <BookOpen size={20} />
                        Start Journaling
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Growth Visual */}
                <div className="flex-shrink-0 bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/40 text-center shadow-xl shadow-primary/5 min-w-[200px]">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-black">Growth Journey</p>
                  <div className="relative inline-block mb-3">
                    <p className="text-6xl font-black text-primary drop-shadow-sm">
                      {loading ? '...' : dashboardData?.journeyDays || 1}
                    </p>
                    <div className="absolute -top-1 -right-4 w-3 h-3 bg-accent rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-4 italic">"Growing day by day"</p>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(((dashboardData?.journeyDays || 1) / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Decorative Blur */}
              <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[100%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[30%] h-[80%] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            {/* Daily Healing Quote */}
            <Card className="border-none rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 group relative">
              <CardContent className="p-6 lg:p-7 relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/30 rounded-full blur-[120px] opacity-40 group-hover:opacity-60 transition-all" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/30 rounded-full blur-[120px] opacity-40 group-hover:opacity-60 transition-all" />
                <div className="absolute -top-6 -left-6 opacity-10 text-primary/40 rotate-6">
                  <QuoteIcon size={120} className="text-primary" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  {isQuoteLoading ? (
                    <div className="space-y-3 w-full max-w-sm">
                      <div className="h-4 bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-4 bg-primary/10 rounded-full w-2/3 mx-auto animate-pulse" />
                    </div>
                  ) : dailyQuote ? (
                    <>
                      <h3 className="text-xl font-bold font-serif italic text-slate-800 leading-relaxed px-6">
                        "{dailyQuote.content || dailyQuote.description || dailyQuote.title}"
                      </h3>
                      {dailyQuote.author && (
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-[0.2em] mt-2">
                          — {dailyQuote.author}
                        </p>
                      )}
                    </>
                  ) : (
                    <h3 className="text-xl font-medium text-muted-foreground italic">
                      "Breathe, trust, and let go. Everything is working out for your highest good."
                    </h3>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mood Chart with Premium Card */}
            <Card className="border-border/40 shadow-sm rounded-[2rem] overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Emotional Spectrum</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Visualize your inner flow over time</p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-2xl">
                    <TrendingUp className="text-primary w-6 h-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <MoodFlow defaultPeriod="week" onDataChange={handleMoodDataChange} />
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR CONTENT - 4 Cols */}
          <div className="lg:col-span-4 flex flex-col gap-8 h-full">
            {/* Redesigned Quick Actions */}
            <Card className="border-border/40 shadow-sm rounded-[2rem] overflow-hidden bg-secondary/5 transition-all hover:shadow-md">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold">Quick Space</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex flex-col gap-4">
                <Link to="/user/feedback" className="group">
                  <Button variant="ghost" className="w-full h-14 justify-between px-6 rounded-2xl bg-muted/40 hover:bg-muted text-foreground transition-all group-hover:shadow-sm">
                    <span className="font-bold text-base">Share Feedback</span>
                    <TrendingUp className="group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Link to="/user/analytics" className="group">
                  <Button variant="ghost" className="w-full h-14 justify-between px-6 rounded-2xl bg-muted/40 hover:bg-muted text-foreground transition-all group-hover:shadow-sm">
                    <span className="font-semibold text-base">In-depth Trends</span>
                    <TrendingUp size={22} className="text-muted-foreground" />
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full h-14 justify-between px-6 rounded-2xl bg-muted/40 hover:bg-muted text-foreground transition-all group-hover:shadow-sm">
                  <span className="font-semibold text-base">AI Soul Partner</span>
                  <Brain size={22} className="text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>

            {/* Weekly Highlights */}
            <Card className="border-border/40 shadow-sm rounded-[2rem] overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold">Weekly Pulse</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 rounded-3xl p-5 border border-primary/5 transition-colors hover:bg-primary/10">
                    <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">Check-ins</p>
                    <p className="text-3xl font-black text-primary">{weeklyStats.checkIns}</p>
                  </div>
                  <div className="bg-accent/5 rounded-3xl p-5 border border-accent/5 transition-colors hover:bg-accent/10">
                    <p className="text-xs font-bold text-accent/60 uppercase tracking-widest mb-1">Avg Mood</p>
                    <p className="text-3xl font-black text-accent">{weeklyStats.avgMood}</p>
                  </div>
                  <div className="bg-muted/30 rounded-3xl p-5 border border-muted/20 transition-colors hover:bg-muted/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Journals</p>
                    <p className="text-3xl font-black text-foreground">{weeklyStats.journalEntries}</p>
                  </div>
                  <div className="bg-muted/30 rounded-3xl p-5 border border-muted/20 transition-colors hover:bg-muted/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Insights</p>
                    <p className="text-3xl font-black text-foreground">{weeklyStats.insightsGenerated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Wisdom / Summary */}
            <div className="transition-all transform hover:-translate-y-1 duration-300">
              <DailySummaryCard />
            </div>
          </div>
        </div>
      </main>

      <DailyCheckInModal />
      <ActionSuggestionModal />
      <FlowerMessenger />
    </DashboardLayout>
  )
}

export default UserDashboardPage
