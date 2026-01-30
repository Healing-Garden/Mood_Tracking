import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowRight, Wind, MessageCircle, Flame } from 'lucide-react'

type ToneOption = 'gentle' | 'neutral' | 'motivational'

interface ToneItem {
  id: ToneOption
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const TONES: ToneItem[] = [
  {
    id: 'gentle',
    label: 'Gentle & Supportive',
    description: `"You're doing great. Take your time. I'm here when you need me."`,
    icon: Wind,
  },
  {
    id: 'neutral',
    label: 'Neutral & Balanced',
    description: `"Here are the facts. You have everything you need."`,
    icon: MessageCircle,
  },
  {
    id: 'motivational',
    label: 'Motivational & Uplifting',
    description: `"You've got this! Let's crush your goals together!"`,
    icon: Flame,
  },
]


export default function Step3Tone() {
  const navigate = useNavigate()
  const { tone, setToneAndMove } = useOnboarding()
  const [selected, setSelected] = useState<ToneOption>(tone)

  const handleContinue = () => {
    setToneAndMove(selected, 4)
    navigate('/onboarding/step-4')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            What's Your Vibe?
          </h1>
          <p className="text-lg text-muted-foreground">
            How should we communicate with you?
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step <= 3 ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Options */}
        <div className="space-y-4">
          {TONES.map((option) => {
            const Icon = option.icon
            const isSelected = selected === option.id

            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`w-full text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary'
                    : 'ring-1 ring-border hover:ring-primary/50'
                }`}
              >
                <Card
                  className={`cursor-pointer ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          {/* ✅ Icon chuẩn React TS */}
                          <Icon className="w-5 h-5 text-primary" />
                          {option.label}
                        </CardTitle>
                        <CardDescription className="italic">
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
            onClick={() => navigate('/onboarding/step-2')}
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
