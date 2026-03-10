import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowRight, Check } from 'lucide-react'

const Q1_OPTIONS = [
  { id: 'Reduce stress', label: 'Reduce stress' },
  { id: 'Improve mood', label: 'Improve mood' },
  { id: 'Sleep better', label: 'Sleep better' },
  { id: 'Better self-understanding', label: 'Better self-understanding' },
  { id: 'Increase focus', label: 'Increase focus' },
  { id: 'Build positive habits', label: 'Build positive habits' },
]

const Q2_OPTIONS = [
  'Calm and relaxed',
  'Positive and motivated',
  'More confident',
  'Balanced and stable',
  'Greater self-clarity',
]

const Q3_OPTIONS = [
  'Better emotional management',
  'Understand my thoughts more clearly',
  'Improve mental health',
  'Personal growth',
  'Find balance in life',
]

export default function Step1PersonalGoals() {
  const navigate = useNavigate()
  const {
    preferences,
    setImproveGoals,
    setFrequentFeeling,
    setPersonalGoalDescription,
    setCurrentStep
  } = useOnboarding()

  const [selectedImproveGoals, setSelectedImproveGoals] = useState<string[]>(preferences.improveGoals || [])
  const [selectedFeeling, setSelectedFeeling] = useState<string>(preferences.frequentFeeling || '')
  const [selectedGoalDesc, setSelectedGoalDesc] = useState<string>(preferences.personalGoalDescription || '')

  const toggleImproveGoal = (id: string) => {
    setSelectedImproveGoals((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      if (prev.length < 2) {
        return [...prev, id]
      }
      return [prev[1], id] // Keep max 2, replace oldest
    })
  }

  const handleContinue = () => {
    if (selectedImproveGoals.length === 0 || !selectedFeeling || !selectedGoalDesc) return

    setImproveGoals(selectedImproveGoals)
    setFrequentFeeling(selectedFeeling)
    setPersonalGoalDescription(selectedGoalDesc)
    setCurrentStep(2)
    navigate('/onboarding/step-2')
  }

  const isFormValid = selectedImproveGoals.length > 0 && selectedFeeling !== '' && selectedGoalDesc !== ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f8f6] to-[#e8f0e8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-[#122012]">Personal Goals</h1>
          <p className="text-lg text-[#122012]/70">Help us understand what you want to achieve</p>
        </div>

        {/* Progress */}
        <div className="flex gap-3 max-w-md mx-auto">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${s <= 1 ? 'bg-[#188618] shadow-sm' : 'bg-[#188618]/10'
                }`}
            />
          ))}
        </div>

        <div className="space-y-8">
          {/* Question 1 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">1</span>
                What do you want to improve most in your life?
              </CardTitle>
              <CardDescription className="pl-11">Select up to 2 goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                {Q1_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleImproveGoal(opt.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedImproveGoals.includes(opt.id)
                        ? 'border-[#188618] bg-[#188618]/5 text-[#188618] font-medium'
                        : 'border-transparent bg-[#f0f4f0] hover:bg-[#e4eee4] text-[#122012]/70'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {selectedImproveGoals.includes(opt.id) && <Check size={18} />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 2 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">2</span>
                How do you want to feel more often?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q2_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedFeeling(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedFeeling === opt
                        ? 'border-[#188618] bg-[#188618]/5 text-[#188618] font-medium'
                        : 'border-transparent bg-[#f0f4f0] hover:bg-[#e4eee4] text-[#122012]/70'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedFeeling === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 3 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">3</span>
                Which best describes your current personal goals?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q3_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedGoalDesc(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedGoalDesc === opt
                        ? 'border-[#188618] bg-[#188618]/5 text-[#188618] font-medium'
                        : 'border-transparent bg-[#f0f4f0] hover:bg-[#e4eee4] text-[#122012]/70'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedGoalDesc === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-6">
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
