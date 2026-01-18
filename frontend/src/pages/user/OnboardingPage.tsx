import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useMoodTheme } from '../../contexts/MoodThemeContext';
import type { MoodType } from '../../types/mood';

const MOODS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'hopeful', emoji: '🤞', label: 'Hopeful' },
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
];

export default function OnboardingPage() {
  const [age, setAge] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const { setMood } = useMoodTheme();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate age
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      alert('Please enter a valid age between 13 and 120');
      return;
    }

    setMood(selectedMood); // ← type an toàn, không cần as any nữa
    localStorage.setItem('userAge', age);
    navigate('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/10 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <span className="text-5xl">🌻</span>
          </div>
          <CardTitle className="text-center text-2xl">Welcome to Your Healing Garden</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="age">How old are you?</Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="120"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>How are you feeling today?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedMood === mood.value
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="text-3xl mb-2">{mood.emoji}</div>
                    <div className="text-sm font-medium">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-6 text-lg hover:bg-primary/90"
            >
              Let's Begin Your Journey
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}