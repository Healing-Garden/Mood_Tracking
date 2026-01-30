import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowRight, Feather, ALargeSmall as BalanceScale, Zap } from 'lucide-react'

type SensitivityOption = 'soft' | 'balanced' | 'vibrant'

interface SensitivityItem {
  id: SensitivityOption
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const SENSITIVITIES: SensitivityItem[] = [
  {
    id: 'soft',
    label: 'Soft & Gentle',
    description: 'Muted colors, calm animations, minimal notifications',
    icon: Feather,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Standard interface with thoughtful design',
    icon: BalanceScale,
  },
  {
    id: 'vibrant',
    label: 'Vibrant & Engaging',
    description: 'Bright colors, dynamic interactions, enthusiastic tone',
    icon: Zap,
  },
]

export default function Step2Sensitivity() {
  const navigate = useNavigate()
  const { sensitivity, setSensitivityAndMove } = useOnboarding()
  const [selected, setSelected] = useState<SensitivityOption>(sensitivity as SensitivityOption)

  const handleContinue = () => {
    setSensitivityAndMove(selected, 3)
    navigate('/onboarding/step-3')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            How Do You Prefer to Feel?
          </h1>
          <p className="text-lg text-muted-foreground">
            We'll adapt our interface to match your emotional needs
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step <= 2 ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Options */}
        <div className="space-y-4">
          {SENSITIVITIES.map((option) => {
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
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {/* ✅ SVG chuẩn – KHÔNG dùng size */}
                          <Icon className="w-5 h-5 text-primary" />
                          {option.label}
                        </CardTitle>
                        <CardDescription>
                          {option.description}
                        </CardDescription>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
            className="flex-1 border-border/50 bg-transparent"
            onClick={() => navigate('/onboarding/step-1')}
          >
            Back
          </Button>

          <Button
            onClick={handleContinue}
            className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
