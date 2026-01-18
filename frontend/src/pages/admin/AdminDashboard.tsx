import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { User } from '../../types/user';

// Type cho stat card
interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export default function AdminDashboard() {
  const [users] = useState<User[]>([]); // Nếu sau này fetch thật thì dùng useEffect

  const stats: StatCard[] = [
    { label: 'Total Users', value: '124', icon: '👥', color: 'var(--color-primary)' },
    { label: 'Active Today', value: '45', icon: '🟢', color: 'var(--color-secondary)' },
    { label: 'Check-ins', value: '892', icon: '📊', color: 'var(--color-accent)' },
    { label: 'Avg Mood', value: '😊', icon: '🎭', color: 'var(--color-primary)' },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* User Management */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">User Management</h2>
          <Button>+ Add User</Button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users to display
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="font-medium">{user.name || user.email}</div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="font-medium">User signup</p>
              <p className="text-sm text-muted-foreground">John Doe</p>
            </div>
            <span className="text-sm text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="font-medium">New journal entry</p>
              <p className="text-sm text-muted-foreground">Jane Smith</p>
            </div>
            <span className="text-sm text-muted-foreground">5 hours ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
}