const mongoose = require('mongoose');

const smartNotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
  type: { type: String, enum: ['reminder', 'insight', 'tip'], required: true },
  delivery_method: { type: String, enum: ['web', 'email'], default: 'web', index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'read'], default: 'pending', index: true },
  read_at: { type: Date },
  scheduled_for: { type: Date, required: true, index: true },
  sent_at: { type: Date },
  metadata: {
    ai_generated: {
      type: Boolean,
      default: false
    },
    context: {
      type: String,
      enum: [
        'mood_check',
        'journal_reminder',
        'hydration',
        'meditation',
        'weekly_insights',
        'notification_settings',
        'smart_remind',
        'other'
      ],
      default: 'other'
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('SmartNotification', smartNotificationSchema);