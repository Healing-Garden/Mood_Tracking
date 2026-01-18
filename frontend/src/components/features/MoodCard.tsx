import type { MoodEntry } from '../../types/mood';
import { getMoodEmoji, getMoodTheme } from '../../utils/mood';
import { formatDate } from '../../utils/date';
import { Card } from '../ui/Card';

interface MoodCardProps {
  entry: MoodEntry;
}

export default function MoodCard({ entry }: MoodCardProps) {
  const emoji = getMoodEmoji(entry.mood);
  const theme = getMoodTheme(entry.mood);

  return (
    <Card
      className="p-4"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: theme.primary,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <p className="font-medium capitalize" style={{ color: theme.primary }}>
              {entry.mood}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {formatDate(entry.timestamp)}
            </p>
            {entry.notes && <p className="mt-2 text-sm">{entry.notes}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            Energy
          </p>
          <p className="text-lg font-bold" style={{ color: theme.secondary }}>
            {entry.energy}/10
          </p>
        </div>
      </div>
    </Card>
  );
}
