import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getAllMoods } from '../../utils/mood';

interface QuickCheckInProps {
  onSubmit?: (mood: string, energy: number) => void;
}

export default function QuickCheckIn({ onSubmit }: QuickCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<string>('calm');
  const [energy, setEnergy] = useState(5);
  const moods = getAllMoods();

  const handleSubmit = () => {
    onSubmit?.(selectedMood, energy);
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
        Quick Check-In
      </h2>

      <div className="space-y-6">
        {/* Mood Selection */}
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            How are you feeling?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className="flex flex-col items-center gap-1 rounded-lg p-3 transition-all"
                style={{
                  backgroundColor: selectedMood === mood.value ? 'var(--color-primary)' : 'var(--color-muted)',
                  color: selectedMood === mood.value ? 'white' : 'var(--color-foreground)',
                }}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Energy Level
            </p>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              {energy}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(energy / 10) * 100}%, var(--color-border) ${(energy / 10) * 100}%, var(--color-border) 100%)`,
            }}
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full">
          Save Check-In
        </Button>
      </div>
    </Card>
  );
}
