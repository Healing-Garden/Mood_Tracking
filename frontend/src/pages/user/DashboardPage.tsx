import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import QuickCheckIn from '../../components/features/QuickCheckIn';
import MoodCard from '../../components/features/MoodCard';
import type { User } from '../../types/user';
import type { MoodEntry } from '../../types/mood';

export default function DashboardPage() {
  const { user } = useAuth() as { user: User | null };
  const [showCheckIn, setShowCheckIn] = useState<boolean>(false);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  const handleCheckInSubmit = (mood: string, energy: number) => {
    // Giả sử mood là MoodType hợp lệ (có thể thêm validation nếu cần)
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      userId: user?.id || '',
      mood: mood as MoodEntry['mood'], // hoặc dùng type guard nếu cần chặt chẽ hơn
      energy,
      timestamp: new Date().toISOString(),
    };

    setMoodEntries((prev) => [newEntry, ...prev]);
    setShowCheckIn(false);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary">
          Welcome back, {user?.name || 'Friend'}! 🌼
        </h1>
        <p className="text-muted-foreground">How are you feeling today?</p>
      </div>

      {/* Quick Check-In or Grid */}
      {showCheckIn ? (
        <div className="max-w-md">
          <QuickCheckIn onSubmit={handleCheckInSubmit} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer p-6 transition-all hover:shadow-lg hover:scale-[1.02]"
            onClick={() => setShowCheckIn(true)}
          >
            <div className="mb-4 text-4xl">📝</div>
            <h3 className="mb-2 text-lg font-bold text-primary">
              Quick Check-In
            </h3>
            <p className="text-muted-foreground">Track your mood and energy</p>
          </Card>

          <Link to="/app/journal">
            <Card className="cursor-pointer p-6 transition-all hover:shadow-lg hover:scale-[1.02]">
              <div className="mb-4 text-4xl">📔</div>
              <h3 className="mb-2 text-lg font-bold text-primary">Journal</h3>
              <p className="text-muted-foreground">Write your thoughts</p>
            </Card>
          </Link>

          <Link to="/app/analytics">
            <Card className="cursor-pointer p-6 transition-all hover:shadow-lg hover:scale-[1.02]">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-lg font-bold text-primary">Analytics</h3>
              <p className="text-muted-foreground">View your trends</p>
            </Card>
          </Link>
        </div>
      )}

      {/* Mood History */}
      {moodEntries.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-primary">
            Recent Check-Ins
          </h2>
          <div className="space-y-3">
            {moodEntries.map((entry) => (
              <MoodCard key={entry.id} entry={entry} />
            ))}
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-primary">
            {moodEntries.length}
          </div>
          <p className="text-muted-foreground">Check-ins this week</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-secondary">
            {user?.moodTrackingGoals || 'Not set'}
          </div>
          <p className="text-muted-foreground">Current goal</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-accent">7</div>
          <p className="text-muted-foreground">Day streak</p>
        </Card>
      </div>
    </div>
  );
}