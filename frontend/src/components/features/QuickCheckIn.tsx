import { useState } from "react"
import { Button } from "../../components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card"
import { Check } from "lucide-react"

interface QuickCheckInProps {
  onComplete?: (data: { mood: number; energy: number }) => void
}

export default function QuickCheckIn({ onComplete }: QuickCheckInProps) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moods = [
    { emoji: "😢", label: "Very Bad", value: 1 },
    { emoji: "😔", label: "Bad", value: 2 },
    { emoji: "😐", label: "Okay", value: 3 },
    { emoji: "😊", label: "Good", value: 4 },
    { emoji: "😄", label: "Great", value: 5 },
  ]

  const handleSubmit = async () => {
    if (mood === null || energy === null) return

    setIsSubmitting(true)

    // TODO: integrate API call here
    console.log("Check-in submitted:", { mood, energy })

    setTimeout(() => {
      setIsSubmitting(false)
      onComplete?.({ mood, energy })
    }, 1000)
  }

  return (
    <Card className="border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-primary">Today's Check-in</CardTitle>
        <CardDescription>How are you feeling right now?</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mood Selection */}
        <div>
          <p className="text-sm font-semibold text-primary mb-3">
            Your Mood
          </p>
          <div className="flex justify-between gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                title={m.label}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  mood === m.value
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-secondary/50 hover:bg-secondary text-foreground"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-primary">
              Energy Level
            </p>
            {energy !== null && (
              <span className="text-sm font-semibold text-accent bg-accent/20 px-2 py-1 rounded">
                {energy}/5
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEnergy(level)}
                className={`flex-1 h-10 rounded-lg font-semibold transition-all ${
                  energy === level
                    ? "bg-accent text-primary shadow-md"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mood === null || energy === null || isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold gap-2"
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <Check size={18} />
              Save Check-in
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
