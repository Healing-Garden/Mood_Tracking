const User = require('../models/users');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');
const webNotification = require('../services/webNotification');

const DEFAULT_NOTIFICATION_SETTINGS = {
  smart_remind_enabled: false,
  email_frequency_limit: { per_category: false, max_per_day: 1 },
  categories: {
    mood_check: { enabled: false, methods: ['web'], time_slots: ['09:00'] },
    journal_reminder: { enabled: false, methods: ['web'], time_slots: ['20:00'] },
    hydration: { enabled: false, methods: ['web'], time_slots: ['10:00', '15:00', '20:00'] },
    meditation: { enabled: false, methods: ['web'], time_slots: ['07:00', '22:00'] },
    weekly_insights: { enabled: false, methods: ['email'], day_of_week: 'Monday', time: '08:00' },
  }
};

// Validation rules cho PUT
exports.validateUpdate = [
  body('smart_remind_enabled').optional().isBoolean(),
  body('email_frequency_limit.per_category').optional().isBoolean(),
  body('email_frequency_limit.max_per_day').optional().isInt({ min: 1, max: 10 }),
  body('categories.*.enabled').optional().isBoolean(),
  body('categories.*.methods').optional().isArray().custom((value) => {
    return value.every(v => ['web', 'email'].includes(v));
  }),
  body('categories.*.time_slots').optional().isArray(),
  body('categories.weekly_insights.day_of_week').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('categories.weekly_insights.time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
];

exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notificationSettings');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const current = user.notificationSettings || {};
    const merged = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...current,
      email_frequency_limit: {
        ...DEFAULT_NOTIFICATION_SETTINGS.email_frequency_limit,
        ...(current.email_frequency_limit || {}),
      },
      categories: {
        ...DEFAULT_NOTIFICATION_SETTINGS.categories,
        ...(current.categories || {}),
      },
    };

    // ensure always saved in DB in normalized form
    user.notificationSettings = merged;
    await user.save();

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized: No user ID' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Start from current settings merged with defaults to avoid missing keys
    const base = user.notificationSettings && Object.keys(user.notificationSettings).length
      ? {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...user.notificationSettings,
          email_frequency_limit: {
            ...DEFAULT_NOTIFICATION_SETTINGS.email_frequency_limit,
            ...(user.notificationSettings.email_frequency_limit || {}),
          },
          categories: {
            ...DEFAULT_NOTIFICATION_SETTINGS.categories,
            ...(user.notificationSettings.categories || {}),
          },
        }
      : { ...DEFAULT_NOTIFICATION_SETTINGS };

    // Update top-level fields
    if (req.body.smart_remind_enabled !== undefined) {
      base.smart_remind_enabled = !!req.body.smart_remind_enabled;
    }

    if (req.body.email_frequency_limit) {
      if (req.body.email_frequency_limit.per_category !== undefined) {
        base.email_frequency_limit.per_category = !!req.body.email_frequency_limit.per_category;
      }
      if (req.body.email_frequency_limit.max_per_day !== undefined) {
        base.email_frequency_limit.max_per_day = Number(req.body.email_frequency_limit.max_per_day);
      }
    }

    // Update categories
    if (req.body.categories) {
      const validCategories = ['mood_check', 'journal_reminder', 'hydration', 'meditation', 'weekly_insights'];

      for (const key of validCategories) {
        if (req.body.categories[key]) {
          const incoming = req.body.categories[key];
          const existing = base.categories[key] || {};

          if (existing) {
            if (incoming.enabled !== undefined) existing.enabled = !!incoming.enabled;
            if (incoming.methods) {
              const arr = Array.isArray(incoming.methods) ? incoming.methods : [incoming.methods];
              existing.methods = Array.from(new Set(arr.filter(m => m === 'web' || m === 'email')));
            }

            if (key === 'weekly_insights') {
              if (incoming.day_of_week) existing.day_of_week = incoming.day_of_week;
              if (incoming.time) existing.time = incoming.time;
            } else {
              if (incoming.time_slots) {
                const slots = Array.isArray(incoming.time_slots)
                  ? incoming.time_slots
                  : [incoming.time_slots];
                existing.time_slots = slots;
              }
            }

            base.categories[key] = existing;
          }
        }
      }
    }

    user.notificationSettings = base;

    // Explicitly mark as modified for nested objects
    user.markModified('notificationSettings');

    await user.save();

    // Always persist a confirmation notification (helps verify BE + DB flow)
    // Fire-and-forget to avoid blocking user settings save.
    (async () => {
      try {
        await webNotification.send(
          userId,
          'Notification settings updated',
          'Your notification preferences have been saved successfully.',
          { type: 'insight', context: 'notification_settings', ai_generated: false }
        );
      } catch (e) {
        console.error('Failed to persist settings confirmation notification:', e?.message || e);
      }
    })();

    // Trigger confirmation notification if smart remind was just enabled
    if (req.body.smart_remind_enabled === true) {
      (async () => {
        try {
          await webNotification.send(
            userId,
            "Smart Remind Enabled",
            "AI will now analyze your behavior to send notifications at optimal times.",
            { type: 'insight', context: 'smart_remind', ai_generated: true }
          );
        } catch (e) {
          console.error("Failed to send smart remind confirmation:", e?.message);
        }
      })();
    }

    res.json({
      message: 'Notification preferences saved',
      notificationSettings: user.notificationSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
