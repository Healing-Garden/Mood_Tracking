import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { ArrowLeft, Check } from 'lucide-react'

const Q7_OPTIONS = [
  'Every day',
  'A few times a week',
  'Occasionally',
  'Rarely',
  'Almost never',
]

const Q8_OPTIONS = [
  'Talk to someone',
  'Write down my thoughts',
  'Keep it inside',
  'Do something else to distract myself',
  "I'm not sure",
]

const Q9_OPTIONS = [
  'Very often',
  'Quite often',
  'Occasionally',
  'Rarely',
  'Almost never',
]

export default function Step3SelfReflection() {
  const navigate = useNavigate()
  const {
    preferences,
    setReflectionFrequency,
    setNegativeEmotionHandling,
    setExperienceLearning,
    setCurrentStep,
  } = useOnboarding()

  const [selectedFreq, setSelectedFreq] = useState<string>(preferences.reflectionFrequency || '')
  const [selectedHandling, setSelectedHandling] = useState<string>(preferences.negativeEmotionHandling || '')
  const [selectedLearning, setSelectedLearning] = useState<string>(preferences.experienceLearning || '')

  const handleNext = () => {
    if (!selectedFreq || !selectedHandling || !selectedLearning) return

    // Update local state
    setReflectionFrequency(selectedFreq)
    setNegativeEmotionHandling(selectedHandling)
    setExperienceLearning(selectedLearning)
    setCurrentStep(4)

    // Go to Step 4 (Daily Check-in)
    navigate('/onboarding/step-4')
  }

  const handleBack = () => {
    setCurrentStep(2)
    navigate('/onboarding/step-2')
  }

  const isFormValid = selectedFreq !== '' && selectedHandling !== '' && selectedLearning !== ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-foreground">Self-Reflection Habits</h1>
          <p className="text-lg text-muted-foreground">One last step to complete your journey</p>
        </div>

        {/* Progress */}
        <div className="flex gap-3 max-w-md mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${s <= 3 ? 'bg-[#188618] shadow-sm' : 'bg-[#188618]/10'
                }`}
            />
          ))}
        </div>

        <div className="space-y-8">
          {/* Question 7 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">7</span>
                How often do you take time to reflect on your day?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q7_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedFreq(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedFreq === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedFreq === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 8 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">8</span>
                What is your typical response to negative emotions?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q8_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedHandling(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedHandling === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedHandling === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 9 */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-foreground flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">9</span>
                How often do you learn from your personal experiences?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pl-11">
                {Q9_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedLearning(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedLearning === opt
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-transparent bg-muted/60 hover:bg-muted text-muted-foreground'
                      }`}
                  >
                    <span>{opt}</span>
                    {selectedLearning === opt && <div className="w-5 h-5 rounded-full bg-[#188618] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
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
            onClick={handleNext}
            disabled={!isFormValid}
            className="min-w-[240px] py-7 text-lg bg-[#188618] hover:bg-[#127012] text-white rounded-2xl shadow-lg shadow-green-900/20 gap-3 transition-all hover:gap-5"
          >
            Next <Check size={22} />
          </Button>
        </div>
      </div>
    </div>
  )
}
