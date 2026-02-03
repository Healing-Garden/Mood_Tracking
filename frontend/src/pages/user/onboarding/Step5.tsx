import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { Sparkles, CheckCircle2, Brain } from 'lucide-react'
import { onboardingApi } from '../../../api/onboardingApi'

export default function Step5Complete() {
  const navigate = useNavigate()

  const {
    goalsSelected,
    sensitivity,
    tone,
    theme,
    preferences,
    completeOnboarding,
  } = useOnboarding()

  useEffect(() => {
    // Optional visual delay / animation hook
    const timer = setTimeout(() => {}, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleDone = async () => {
    try {
      // Persist onboarding preferences to backend
      await onboardingApi.save(preferences)
    } catch (error) {
      // In trường hợp backend lỗi, vẫn cho phép user tiếp tục
      console.error('Failed to save onboarding preferences:', error)
    }

    completeOnboarding()
    navigate('/user/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className="h-2 flex-1 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* Completion Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <CheckCircle2 className="w-20 h-20 text-primary relative" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground">
            You're All Set!
          </h1>

          <p className="text-lg text-muted-foreground">
            We've personalized Healing Garden just for you
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardContent className="pt-6 space-y-6">

              {/* Goals */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Your Goals
                </h3>

                <div className="flex flex-wrap gap-2">
                  {goalsSelected.map((goal) => (
                    <span
                      key={goal}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border/30">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Emotional Sensitivity
                  </p>
                  <p className="font-semibold text-foreground capitalize">
                    {sensitivity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Reminder Tone
                  </p>
                  <p className="font-semibold text-foreground capitalize">
                    {tone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Theme
                  </p>
                  <p className="font-semibold text-foreground capitalize">
                    {theme}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meet Your AI */}
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-start">
                <Brain className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Meet Your Thought Partner
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    An AI companion trained to support your mental wellness journey.
                    It learns from your check-ins and provides personalized insights
                    to help you grow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Adjust Preferences
          </Button>

          <Button
            onClick={handleDone}
            className="flex-1 bg-primary text-white gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  )
}
