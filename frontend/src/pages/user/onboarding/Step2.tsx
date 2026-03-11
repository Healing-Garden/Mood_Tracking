import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

const Q4_OPTIONS = [
  'Very low',
  'Low',
  'Moderate',
  'High',
  'Very high',
]

const Q5_OPTIONS = [
  'Peaceful',
  'Anxious',
  'Tired',
  'Sad',
  'Stressed',
]

const Q6_OPTIONS = [
  'Very clearly',
  'Quite clearly',
  'Moderately',
  'Hard to understand',
  'Very hard to understand',
]

export default function Step2CurrentSituation() {
  const navigate = useNavigate()
  const {
    preferences,
    setStressLevel,
    setRecentState,
    setEmotionalClarity,
    setCurrentStep
  } = useOnboarding()

  const [selectedStress, setSelectedStress] = useState<string>(preferences.stressLevel || '')
  const [selectedRecentState, setSelectedRecentState] = useState<string>(preferences.recentState || '')
  const [selectedClarity, setSelectedClarity] = useState<string>(preferences.emotionalClarity || '')

  const handleContinue = () => {
    if (!selectedStress || !selectedRecentState || !selectedClarity) return

    setStressLevel(selectedStress)
    setRecentState(selectedRecentState)
    setEmotionalClarity(selectedClarity)
    setCurrentStep(3)
    navigate('/onboarding/step-3')
  }

  const handleBack = () => {
    setCurrentStep(1)
    navigate('/onboarding/step-1')
  }

  const isFormValid = selectedStress !== '' && selectedRecentState !== '' && selectedClarity !== ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-foreground">Current Situation</h1>
          <p className="text-lg text-muted-foreground">Tell us about what you've been experiencing</p>
        </div>

        {/* Progress */}
        <div className="flex gap-3 max-w-md mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${s <= 2 ? 'bg-[#188618] shadow-sm' : 'bg-[#188618]/10'
                }`}
            />
          ))}
        </div>

        <div className="space-y-8">
          {/* Question 4 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                How has your stress level been over the past week?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-11">
                {Q4_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedStress(opt)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${selectedStress === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span className="text-sm text-center">{opt}</span>
                    {selectedStress === opt && <Check size={16} className="mt-2" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 5 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">5</span>
                Which state have you most frequently felt recently?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q5_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedRecentState(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedRecentState === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedRecentState === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 6 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">6</span>
                To what extent do you feel you understand your emotions?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q6_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedClarity(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedClarity === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedClarity === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="min-w-[140px] py-7 text-lg text-[#122012]/60 hover:text-[#188618] hover:bg-[#188618]/5 rounded-2xl gap-3"
          >
            <ArrowLeft size={22} /> Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!isFormValid}
            className="min-w-[240px] py-7 text-lg bg-[#188618] hover:bg-[#127012] text-white rounded-2xl shadow-lg shadow-green-900/20 gap-3 transition-all hover:gap-5"
          >
            Continue <ArrowRight size={22} />
          </Button>
        </div>
      </div>
    </div>
  )
}
