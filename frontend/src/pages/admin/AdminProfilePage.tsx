//import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function AdminProfilePage() {
  const { user } = useAuth();
 // const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
        Admin Settings
      </h1>

      {/* Admin Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt={user?.name}
            className="h-20 w-20 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p style={{ color: 'var(--color-muted-foreground)' }}>{user?.email}</p>
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              Admin
            </span>
          </div>
        </div>
      </Card>

      {/* System Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <p style={{ color: 'var(--color-muted-foreground)' }} className="text-sm">
            Total Users
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
            124
          </p>
        </Card>
        <Card className="p-6">
          <p style={{ color: 'var(--color-muted-foreground)' }} className="text-sm">
            Total Check-ins
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--color-secondary)' }}>
            892
          </p>
        </Card>
        <Card className="p-6">
          <p style={{ color: 'var(--color-muted-foreground)' }} className="text-sm">
            System Mood
          </p>
          <p className="mt-2 text-4xl font-bold">😊</p>
        </Card>
        <Card className="p-6">
          <p style={{ color: 'var(--color-muted-foreground)' }} className="text-sm">
            Active Users (Today)
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: 'var(--color-accent)' }}>
            45
          </p>
        </Card>
      </div>

      {/* Permissions */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Permissions</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Manage Users</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <span>View Analytics</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Manage Content</span>
            <span className="text-green-600">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <span>System Settings</span>
            <span className="text-green-600">✓</span>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-bold">Security</h2>
        <Button variant="outline">Change Password</Button>
        <Button variant="outline">Two-Factor Authentication</Button>
      </Card>
    </div>
  );
}
