import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { useOnboarding } from '../../../hooks/useOnboarding'
import { useDailyCheckInStore, type MoodLevel } from '../../../store/dailyCheckInStore'
import { dailyCheckInApi, TRIGGER_OPTIONS } from '../../../api/dailyCheckInApi'
import { onboardingApi } from '../../../api/onboardingApi'
import { ArrowLeft, PartyPopper, Sparkles } from 'lucide-react'

type MoodEmoji = {
    level: MoodLevel
    emoji: string
    label: string
    color: string
}

const MOOD_EMOJIS: MoodEmoji[] = [
    { level: 1, emoji: '😢', label: 'Very Low', color: 'text-blue-500' },
    { level: 2, emoji: '😟', label: 'Low', color: 'text-indigo-400' },
    { level: 3, emoji: '😐', label: 'Neutral', color: 'text-gray-400' },
    { level: 4, emoji: '😊', label: 'Good', color: 'text-green-400' },
    { level: 5, emoji: '😄', label: 'Great', color: 'text-yellow-500' },
]

export default function Step4DailyCheckIn() {
    const navigate = useNavigate()
    const { preferences, setCurrentStep, completeOnboarding } = useOnboarding()
    const { submitCheckIn } = useDailyCheckInStore()

    const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
    const [energyLevel, setEnergyLevel] = useState<number>(5)
    const [note, setNote] = useState<string>('')
    const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const toggleTrigger = (tag: string) => {
        setSelectedTriggers((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        )
    }

    const handleFinish = async () => {
        if (selectedMood === null || selectedTriggers.length === 0) return

        setIsSubmitting(true)
        try {
            // 1. Save onboarding preferences
            const finalPreferences = {
                ...preferences,
                isOnboarded: true
            }
            await onboardingApi.save(finalPreferences)

            // 2. Save daily check-in
            const checkInData = {
                mood: selectedMood,
                energy: energyLevel,
                note: note.trim() || undefined,
                triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
            }
            await dailyCheckInApi.submit(checkInData)

            // 3. Update local stores
            submitCheckIn({
                mood: selectedMood,
                energy: energyLevel,
                note: note.trim() || undefined,
            })
            completeOnboarding()

            // 4. Navigate to dashboard
            navigate('/user/dashboard')
        } catch (error) {
            console.error('Failed to complete onboarding session:', error)
            // Fallback: proceed anyway to not block user
            completeOnboarding()
            navigate('/user/dashboard')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        setCurrentStep(3)
        navigate('/onboarding/step-3')
    }

    const isFormValid = selectedMood !== null && selectedTriggers.length > 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f6f8f6] to-[#e8f0e8] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-3xl space-y-10">
                {/* Header */}
                <div className="space-y-3 text-center">
                    <h1 className="text-4xl font-bold text-[#122012]">Daily Check-in</h1>
                    <p className="text-lg text-[#122012]/70">How are you feeling right now?</p>
                </div>

                {/* Progress */}
                <div className="flex gap-3 max-w-md mx-auto">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${s <= 4 ? 'bg-[#188618] shadow-sm' : 'bg-[#188618]/10'
                                }`}
                        />
                    ))}
                </div>

                <div className="space-y-8">
                    {/* Mood selection */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                                <Sparkles size={20} className="text-[#188618]" />
                                Pick your current mood
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between gap-4 py-4">
                                {MOOD_EMOJIS.map(({ level, emoji, label }) => {
                                    const isSelected = selectedMood === level
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setSelectedMood(level)}
                                            className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${isSelected
                                                    ? 'bg-[#188618]/10 ring-2 ring-[#188618] scale-105 shadow-md'
                                                    : 'bg-[#f0f4f0]/50 hover:bg-[#e4eee4] hover:scale-102'
                                                }`}
                                        >
                                            <span className="text-4xl filter drop-shadow-sm">{emoji}</span>
                                            <span className={`text-xs font-semibold ${isSelected ? 'text-[#188618]' : 'text-[#122012]/50'}`}>
                                                {label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Energy Level */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">~</span>
                                Energy Level ({energyLevel}/10)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-10">
                            <div className="space-y-6">
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={energyLevel}
                                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-[#f0f4f0] accent-[#188618]"
                                />
                                <div className="flex justify-between text-sm font-medium text-[#122012]/40">
                                    <span>Tired</span>
                                    <span>Energized</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Triggers */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">!</span>
                                What triggered this mood?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {TRIGGER_OPTIONS.map((tag) => {
                                    const isSelected = selectedTriggers.includes(tag)
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTrigger(tag)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${isSelected
                                                    ? 'bg-[#188618] text-white shadow-lg shadow-green-900/20'
                                                    : 'bg-[#f0f4f0] text-[#122012]/60 hover:bg-[#e4eee4]'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Note */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group transition-all hover:shadow-2xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-[#122012] flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#188618] text-white text-sm">+</span>
                                Add a quick note (optional)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Write something briefly..."
                                maxLength={100}
                                className="w-full min-h-[100px] p-4 rounded-2xl bg-[#f0f4f0]/50 border-2 border-transparent focus:border-[#188618]/30 focus:bg-white transition-all text-[#122012] placeholder-[#122012]/30 resize-none outline-none"
                            />
                            <p className="text-right text-xs text-[#122012]/30 mt-2">{note.length}/100</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center pt-6">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="min-w-[140px] py-7 text-lg text-[#122012]/60 hover:text-[#188618] hover:bg-[#188618]/5 rounded-2xl gap-3"
                    >
                        <ArrowLeft size={22} /> Back
                    </Button>
                    <Button
                        onClick={handleFinish}
                        disabled={!isFormValid || isSubmitting}
                        className="min-w-[240px] py-7 text-lg bg-[#188618] hover:bg-[#127012] text-white rounded-2xl shadow-lg shadow-green-900/20 gap-3 transition-all hover:gap-5"
                    >
                        {isSubmitting ? 'Saving...' : 'Finish Onboarding'} <PartyPopper size={22} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
