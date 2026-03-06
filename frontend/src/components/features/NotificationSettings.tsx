import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import http from '../../api/http';

interface CategorySettings {
  enabled: boolean;
  methods: ('web' | 'email')[];
  time_slots: string[];
  last_sent?: {
    web?: string | null;
    email?: string | null;
  };
}

interface WeeklyInsightsSettings {
  enabled: boolean;
  methods: ('web' | 'email')[];
  day_of_week: string;
  time: string;
  last_sent?: {
    email?: string | null;
  };
}

interface NotificationSettingsData {
  smart_remind_enabled: boolean;
  email_frequency_limit: {
    per_category: boolean;
    max_per_day: number;
  };
  categories: {
    mood_check: CategorySettings;
    journal_reminder: CategorySettings;
    hydration: CategorySettings;
    meditation: CategorySettings;
    weekly_insights: WeeklyInsightsSettings;
  };
}

type RegularCategoryId = Exclude<keyof NotificationSettingsData['categories'], 'weekly_insights'>;

const categoriesList = [
  { id: 'mood_check' as const, label: 'Mood Check' },
  { id: 'journal_reminder' as const, label: 'Journal Reminder' },
  { id: 'hydration' as const, label: 'Hydration' },
  { id: 'meditation' as const, label: 'Meditation' },
  { id: 'weekly_insights' as const, label: 'Weekly Insights' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultSettings: NotificationSettingsData = {
  smart_remind_enabled: false,
  email_frequency_limit: { per_category: false, max_per_day: 1 },
  categories: {
    mood_check: { enabled: false, methods: ['web'], time_slots: ['09:00'] },
    journal_reminder: { enabled: false, methods: ['web'], time_slots: ['20:00'] },
    hydration: { enabled: false, methods: ['web'], time_slots: ['10:00', '15:00', '20:00'] },
    meditation: { enabled: false, methods: ['web'], time_slots: ['07:00', '22:00'] },
    weekly_insights: { enabled: false, methods: ['email'], day_of_week: 'Monday', time: '08:00' },
  },
};

function normalizeSettings(raw: unknown): NotificationSettingsData | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as any;
  const candidate: any =
    obj.notificationSettings ??
    obj.data?.notificationSettings ??
    obj.data ??
    obj;

  if (!candidate || typeof candidate !== 'object') return null;

  const merged: NotificationSettingsData = {
    ...defaultSettings,
    ...candidate,
    email_frequency_limit: {
      ...defaultSettings.email_frequency_limit,
      ...(candidate.email_frequency_limit || {}),
    },
    categories: {
      ...defaultSettings.categories,
      ...(candidate.categories || {}),
    },
  };

  return merged;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [disableAllWarningAck, setDisableAllWarningAck] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const raw = await http.get('/notifications/settings');
      const normalized = normalizeSettings(raw);
      if (!normalized) {
        setMessage('Invalid settings data structure.');
        setSettings(defaultSettings);
        return;
      }
      setSettings(normalized);
    } catch (error) {
      console.error(error);
      const err = error as { message?: string };
      const msg = err?.message || 'Failed to load settings. Please try again.';
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid token')) {
        setMessage('You are not logged in. Please log in again.');
      } else {
        setMessage(msg);
      }
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSmartRemind = () => {
    setSettings(prev => prev ? { ...prev, smart_remind_enabled: !prev.smart_remind_enabled } : null);
  };

  const handleCategoryChange = <
    K extends keyof NotificationSettingsData['categories'],
    F extends keyof NotificationSettingsData['categories'][K]
  >(
    catId: K,
    field: F,
    value: NotificationSettingsData['categories'][K][F]
  ) => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [catId]: {
            ...prev.categories[catId],
            [field]: value,
          },
        },
      };
    });
  };

  const handleMethodChange = (catId: keyof NotificationSettingsData['categories'], method: 'web' | 'email') => {
    if (!settings) return;
    const current = settings.categories[catId].methods || [];
    const newMethods = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    handleCategoryChange(catId, 'methods', newMethods);
  };

  // Chỉ dành cho regular category (có time_slots)
  const handleTimeSlotChange = (catId: RegularCategoryId, index: number, value: string) => {
    if (!settings) return;
    const slots = [...(settings.categories[catId].time_slots || [])];
    slots[index] = value;
    handleCategoryChange(catId, 'time_slots', slots);
  };

  const addTimeSlot = (catId: RegularCategoryId) => {
    if (!settings) return;
    const slots = settings.categories[catId].time_slots || [];
    handleCategoryChange(catId, 'time_slots', [...slots, '09:00']);
  };

  const removeTimeSlot = (catId: RegularCategoryId, index: number) => {
    if (!settings) return;
    const slots = settings.categories[catId].time_slots.filter((_, i) => i !== index);
    handleCategoryChange(catId, 'time_slots', slots);
  };

  const handleSave = async () => {
    if (!settings) return;
    const allDisabled = Object.values(settings.categories || {}).every(cat => !cat.enabled);
    if (allDisabled && !disableAllWarningAck) {
      setMessage('Please acknowledge the warning before disabling all notifications.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const raw = await http.put(
        '/notifications/settings',
        settings
      );
      const normalized = normalizeSettings(raw);
      if (normalized) {
        setSettings(normalized);
      }
      setMessage('Settings saved successfully!');
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message ?? (error as { message?: string })?.message ?? 'Failed to save settings.';
      if (String(errorMessage).toLowerCase().includes('unauthorized') || String(errorMessage).toLowerCase().includes('invalid token')) {
        setMessage('You are not logged in. Please log in again.');
      } else {
        setMessage(`Error saving: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!settings) return <div>No data available.</div>;
  if (!settings.categories) return <div>Invalid settings data structure.</div>;

  const allDisabled = Object.values(settings.categories).every(cat => !cat.enabled);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Global Smart Remind */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.smart_remind_enabled}
            onChange={handleToggleSmartRemind}
            className="w-5 h-5"
          />
          <span className="font-medium">Enable Smart Remind (AI will suggest optimal times)</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          When enabled, your manually set times will be ignored and AI will choose the best times based on your habits.
        </p>
      </div>

      {/* Category list */}
      {categoriesList.map(cat => {
        const catData = settings.categories[cat.id];
        if (!catData) return null;

        const isWeekly = cat.id === 'weekly_insights';

        return (
          <div key={cat.id} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={catData.enabled}
                  onChange={(e) => handleCategoryChange(cat.id, 'enabled', e.target.checked)}
                  className="w-5 h-5"
                />
                <h3 className="text-lg font-medium">{cat.label}</h3>
              </div>
            </div>

            {catData.enabled && (
              <div className="ml-8 space-y-4">
                {/* Delivery methods */}
                <div>
                  <p className="text-sm font-medium mb-2">Send via:</p>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={catData.methods?.includes('web')}
                        onChange={() => handleMethodChange(cat.id, 'web')}
                      />
                      <span>Web (in-app)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={catData.methods?.includes('email')}
                        onChange={() => handleMethodChange(cat.id, 'email')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                {/* Time settings */}
                {!settings.smart_remind_enabled && (
                  <div>
                    {isWeekly ? (
                      <div className="flex space-x-4">
                        <select
                          value={(catData as WeeklyInsightsSettings).day_of_week}
                          onChange={(e) => handleCategoryChange(cat.id, 'day_of_week', e.target.value)}
                          className="border rounded p-2"
                        >
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={(catData as WeeklyInsightsSettings).time}
                          onChange={(e) => handleCategoryChange(cat.id, 'time', e.target.value)}
                          className="border rounded p-2"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium mb-2">Time slots:</p>
                        {(catData as CategorySettings).time_slots?.map((slot, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <input
                              type="time"
                              value={slot}
                              onChange={(e) => handleTimeSlotChange(cat.id as RegularCategoryId, idx, e.target.value)}
                              className="border rounded p-2"
                            />
                            <button
                              onClick={() => removeTimeSlot(cat.id as RegularCategoryId, idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addTimeSlot(cat.id as RegularCategoryId)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          + Add time slot
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <div className="mt-8">
        {allDisabled && (
          <div className="mb-3 p-3 border border-yellow-300 bg-yellow-50 rounded">
            <p className="text-sm text-yellow-800">
              Warning: Disabling all notifications may cause you to miss important reminders and personalized insights from your AI.
            </p>
            <label className="flex items-center gap-2 mt-2 text-sm text-yellow-900">
              <input
                type="checkbox"
                checked={disableAllWarningAck}
                onChange={(e) => setDisableAllWarningAck(e.target.checked)}
              />
              <span>I understand the risk and still want to disable all notifications.</span>
            </label>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || (allDisabled && !disableAllWarningAck)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default NotificationSettings;