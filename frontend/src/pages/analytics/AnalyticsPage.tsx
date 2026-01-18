import { Card } from '../../components/ui/Card';

export default function AnalyticsPage() {
  const stats = [
    { label: 'Average Mood', value: '😊 Happy', color: 'var(--color-primary)' },
    { label: 'Check-ins', value: '24', color: 'var(--color-secondary)' },
    { label: 'Streak', value: '7 days', color: 'var(--color-accent)' },
    { label: 'Journal Entries', value: '12', color: 'var(--color-primary)' },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
          Your Analytics
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)' }}>Track your wellness journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 text-center">
            <p style={{ color: 'var(--color-muted-foreground)' }} className="text-sm">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts Placeholder */}
      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">Mood Trends</h2>
        <p style={{ color: 'var(--color-muted-foreground)' }}>Chart visualization coming soon</p>
      </Card>

      <Card className="p-8 text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-xl font-bold mb-2">Weekly Heatmap</h2>
        <p style={{ color: 'var(--color-muted-foreground)' }}>Your mood patterns by day and hour</p>
      </Card>
    </div>
  );
}
