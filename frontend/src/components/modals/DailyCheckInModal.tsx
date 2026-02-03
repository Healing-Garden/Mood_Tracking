import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { useDailyCheckInStore, type MoodLevel } from '../../store/dailyCheckInStore'
import { dailyCheckInApi } from '../../api/dailyCheckInApi'

type MoodEmoji = {
  level: MoodLevel
  emoji: string
  label: string
}

const MOOD_EMOJIS: MoodEmoji[] = [
  { level: 1, emoji: '😢', label: 'Very Low' },
  { level: 2, emoji: '😟', label: 'Low' },
  { level: 3, emoji: '😐', label: 'Neutral' },
  { level: 4, emoji: '😊', label: 'Good' },
  { level: 5, emoji: '😄', label: 'Great' },
]

const DailyCheckInModal: React.FC = () => {
  const { showModal, submitCheckIn, getThemeByMood, setShowModal } =
    useDailyCheckInStore()

  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number>(5)
  const [note, setNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (): Promise<void> => {
    if (selectedMood === null) return

    setIsSubmitting(true)

    try {
      // Gửi dữ liệu check-in lên backend để lưu trữ lâu dài
      await dailyCheckInApi.submit({
        mood: selectedMood,
        energy: energyLevel,
        note: note.trim() || undefined,
      })
    } catch (error) {
      console.error('Failed to submit daily check-in:', error)
      // TODO: có thể hiển thị toast thông báo lỗi sau
    } finally {
      // Luôn cập nhật state local (Zustand) và đóng modal
      submitCheckIn({
        mood: selectedMood,
        energy: energyLevel,
        note: note.trim() || undefined,
      })

      setIsSubmitting(false)
      setSelectedMood(null)
      setEnergyLevel(5)
      setNote('')
    }
  }

  const getThemeClasses = (): string => {
    if (selectedMood === null) return ''

    const theme = getThemeByMood(selectedMood)

    switch (theme) {
      case 'low':
        return 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'
      case 'neutral':
        return 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'
      case 'positive':
        return 'bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50'
      default:
        return 'bg-white'
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card
        className={`w-full max-w-md shadow-2xl transition-all duration-500 ${getThemeClasses()}`}
      >
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="text-center flex-1 space-y-2">
              <h2 className="text-2xl font-bold">How are you feeling?</h2>
              <p className="text-sm text-muted-foreground">
                Take a moment to check in with yourself
              </p>
            </div>

            {/* Close / skip button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="ml-4 text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>

          {/* Mood selector */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Pick your mood</p>
            <div className="flex justify-between gap-2">
              {MOOD_EMOJIS.map(({ level, emoji, label }) => {
                const isSelected = selectedMood === level

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedMood(level)}
                    title={label}
                    className={`flex flex-col items-center rounded-lg p-3 transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/20 scale-110 ring-2 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Energy slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Energy Level</p>
              <span className="text-sm font-semibold text-primary">
                {energyLevel}/10
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border/30 accent-primary"
              title="Energy Level"
              aria-label="Energy Level"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              What's on your mind?
              <span className="text-xs text-muted-foreground">(optional)</span>
            </label>

            <Input
              type="text"
              value={note}
              placeholder="Quick thought or feeling..."
              maxLength={100}
              onChange={(e) => setNote(e.target.value)}
            />

            <p className="text-right text-xs text-muted-foreground">
              {note.length}/100
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={selectedMood === null || isSubmitting}
            className="h-11 w-full font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Check In'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This helps us personalize your experience
          </p>
        </div>
      </Card>
    </div>
  )
}

export default DailyCheckInModal
