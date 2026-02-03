import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { Settings, RotateCcw, Lock, Bell, Palette, LogOut } from 'lucide-react'

type SettingsCategory = {
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  action?: string
}

export default function SettingsPage() {
  const navigate = useNavigate()

  const {
    goalsSelected,
    sensitivity,
    tone,
    theme,
    resetOnboarding,
  } = useOnboarding()

  const [goals, setGoals] = useState<string[]>([])

  useEffect(() => {
    setGoals(goalsSelected)
  }, [goalsSelected])

  const handleRestartOnboarding = () => {
    resetOnboarding()
    navigate('/onboarding/Step1')
  }

  const settingsCategories: SettingsCategory[] = [
    {
      title: 'Personalization',
      description: 'Manage your preferences and goals',
      icon: Palette,
    },
    {
      title: 'Security & Privacy',
      description: 'Manage your account security',
      icon: Lock,
      action: 'Manage',
    },
    {
      title: 'Notifications',
      description: 'Control how we communicate with you',
      icon: Bell,
      action: 'Configure',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings size={32} className="text-primary" />
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Customize your Healing Garden experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Personalization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} className="text-primary" />
                Your Personalization
              </CardTitle>
              <CardDescription>
                Review and update your preferences
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Goals */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Selected Goals
                </p>

                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No goals selected yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {goals.map((goal) => (
                      <span
                        key={goal}
                        className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferences */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Emotional Sensitivity
                  </p>
                  <p className="font-semibold capitalize">
                    {sensitivity}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Reminder Tone
                  </p>
                  <p className="font-semibold capitalize">
                    {tone}
                  </p>
                </div>
              </div>

              {/* Theme */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Theme</p>
                <p className="font-semibold capitalize">
                  {theme}
                </p>
              </div>

              {/* Restart */}
              <Button
                onClick={handleRestartOnboarding}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw size={16} />
                Restart Personalization
              </Button>
            </CardContent>
          </Card>

          {/* Other Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            {settingsCategories.slice(1).map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-6 h-6 text-primary" />
                      {category.title}
                    </CardTitle>
                    <CardDescription>
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      {category.action}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Account */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Account</CardTitle>
              <CardDescription className="text-red-800">
                Account management and logout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full gap-2">
                <LogOut size={16} />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
