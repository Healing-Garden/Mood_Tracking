import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age?.toString() || '', 
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
    goal: user?.moodTrackingGoals || '',
  });

  const handleSave = () => {
    // TODO: Gọi API update profile ở đây
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-primary">Profile</h1>

      {/* Avatar Section */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`
            }
            alt={user?.name || 'User avatar'}
            className="h-20 w-20 rounded-full object-cover border-2 border-border"
          />
          <div>
            <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="p-6">
        {isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="13"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="30"
                  max="300"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Mood Tracking Goal</Label>
              <Input
                id="goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="e.g., Track mood daily"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-semibold mt-1">{user?.age || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height</p>
                <p className="font-semibold mt-1">
                  {user?.height ? `${user.height} cm` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-semibold mt-1">
                  {user?.weight ? `${user.weight} kg` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mood Tracking Goal</p>
                <p className="font-semibold mt-1">
                  {user?.moodTrackingGoals || 'Not set'}
                </p>
              </div>
            </div>

            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
      </Card>

      {/* Security Section */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Security</h2>
        <Button variant="outline">Change Password</Button>
      </Card>
    </div>
  );
}