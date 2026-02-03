import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { Heart, Brain, Zap, Moon, Users, Leaf, ArrowRight } from 'lucide-react'

type Goal = {
  id: string
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const GOALS: Goal[] = [
  {
    id: 'stress',
    label: 'Manage Stress',
    description: 'Learn techniques to reduce daily stress',
    icon: Brain,
  },
  {
    id: 'sleep',
    label: 'Better Sleep',
    description: 'Improve sleep quality and consistency',
    icon: Moon,
  },
  {
    id: 'anxiety',
    label: 'Reduce Anxiety',
    description: 'Develop coping strategies for anxiety',
    icon: Zap,
  },
  {
    id: 'relationships',
    label: 'Build Connections',
    description: 'Strengthen personal relationships',
    icon: Users,
  },
  {
    id: 'mindfulness',
    label: 'Practice Mindfulness',
    description: 'Develop meditation habits',
    icon: Leaf,
  },
  {
    id: 'emotional',
    label: 'Emotional Balance',
    description: 'Understand and regulate emotions',
    icon: Heart,
  },
]

export default function Step1Goals() {
  const navigate = useNavigate()
  const { goalsSelected, setGoalsAndMove } = useOnboarding()

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    goalsSelected ?? []
  )

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleContinue = () => {
    if (selectedGoals.length === 0) return
    setGoalsAndMove(selectedGoals, 2)
    navigate('/onboarding/step-2')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Let's Get Started
          </h1>
          <p className="text-lg text-muted-foreground">
            What brings you to Healing Garden?
          </p>
          <p className="text-sm text-muted-foreground">
            Select all that apply
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step === 1 ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {GOALS.map((goal) => {
            const Icon = goal.icon
            const isSelected = selectedGoals.includes(goal.id)

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`text-left transition-all rounded-lg ${
                  isSelected
                    ? 'ring-2 ring-primary'
                    : 'ring-1 ring-border hover:ring-primary/50'
                }`}
              >
                <Card
                  className={`cursor-pointer h-full ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="w-6 h-6 text-primary" />
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
                    <CardTitle className="mt-3">
                      {goal.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {goal.description}
                    </CardDescription>
                  </CardContent>
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
            onClick={() => navigate('/')}
          >
            Skip for Now
          </Button>

          <Button
            onClick={handleContinue}
            disabled={selectedGoals.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
          >
            Continue <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
