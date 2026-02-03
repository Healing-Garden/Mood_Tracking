import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowRight, Sun, Moon } from 'lucide-react'


type ThemeOption = 'light' | 'dark'

interface ThemeItem {
  id: ThemeOption
  label: string
  description: string
  preview: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const THEMES: ThemeItem[] = [
  {
    id: 'light',
    label: 'Light Theme',
    description: 'Bright, energizing environment',
    preview: 'bg-white',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark Theme',
    description: 'Calming, eye-friendly environment',
    preview: 'bg-slate-900',
    icon: Moon,
  },
]

export default function Step4Theme() {
  const navigate = useNavigate()
  const { theme, setThemeAndMove } = useOnboarding()
  const [selected, setSelected] = useState<ThemeOption>(theme)

  const handleContinue = () => {
    setThemeAndMove(selected, 5)
    navigate('/onboarding/step-5')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Choose Your Theme
          </h1>
          <p className="text-lg text-muted-foreground">
            How do you prefer your interface to look?
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step <= 4 ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Theme Options */}
        <div className="grid md:grid-cols-2 gap-4">
          {THEMES.map((option) => {
            const Icon = option.icon
            const isSelected = selected === option.id

            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary'
                    : 'ring-1 ring-border hover:ring-primary/50'
                }`}
              >
                <Card
                  className={`cursor-pointer h-full overflow-hidden ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Preview */}
                  <div
                    className={`${option.preview} h-32 flex items-center justify-center`}
                  >
                    <Icon
                      className={`w-12 h-12 ${
                        option.id === 'light'
                          ? 'text-yellow-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{option.label}</CardTitle>
                        <CardDescription>
                          {option.description}
                        </CardDescription>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/step-3')}
          >
            Back
          </Button>

          <Button
            onClick={handleContinue}
            className="flex-1 bg-primary text-white gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
