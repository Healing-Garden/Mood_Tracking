const cron = require('node-cron');
const User = require('../models/users');
const SmartNotification = require('../models/SmartNotification');
const aiClient = require('./aiService');
const emailService = require('./emailService');
const webNotification = require('./webNotification');
const { getTimeOfDay } = require('../utils/timeUtils');

cron.schedule('* * * * *', async () => {
  console.log('Checking for due notifications...');
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Lấy tất cả user có bật notification
  const users = await User.find({ 'notificationSettings': { $exists: true } });

  for (const user of users) {
    const settings = user.notificationSettings;
    if (!settings) continue;

    // Kiểm tra categories tồn tại
    if (!settings.categories) continue;

    // Duyệt qua từng category
    for (const [category, catSettings] of Object.entries(settings.categories)) {
      if (!catSettings || !catSettings.enabled) continue;

      let timesToSend = [];
      if (settings.smart_remind_enabled) {
        const suggested = await aiClient.suggestSmartTimes(user._id, category, 30);
        timesToSend = suggested;
      } else {
        if (category === 'weekly_insights') {
          if (catSettings.day_of_week !== currentDay) continue;
          timesToSend = [catSettings.time];
        } else {
          timesToSend = catSettings.time_slots || [];
        }
      }

      if (!timesToSend.includes(currentTimeStr)) continue;

      // Kiểm tra tần suất email
      const methods = catSettings.methods || [];
      const canSendWeb = methods.includes('web');
      const canSendEmail = methods.includes('email') && await checkEmailFrequency(user, category);

      if (!canSendWeb && !canSendEmail) continue;

      // Lấy context user để gửi AI
      const userContext = await buildUserContext(user);
      const timeOfDay = getTimeOfDay(currentHour);
      const aiContent = await aiClient.generateNotificationContent(userContext, category, timeOfDay);

      // Xác định loại notification theo category
      const notificationType = category === 'weekly_insights' ? 'insight' : 'reminder';

      // Gửi web
      if (canSendWeb) {
        await webNotification.send(
          user._id,
          aiContent.title,
          aiContent.content,
          { type: notificationType, context: category }
        );
        await User.updateOne(
          { _id: user._id },
          { $set: { [`notificationSettings.categories.${category}.last_sent.web`]: now } }
        );
      }

      // Gửi email
      if (canSendEmail) {
        const emailSent = await emailService.send(
          user.email,
          aiContent.title,
          `<p>${aiContent.content}</p>`
        );
        if (emailSent) {
          try {
            const notification = new SmartNotification({
              user_id: user._id,
              type: notificationType,
              delivery_method: 'email',
              title: aiContent.title,
              content: aiContent.content,
              status: 'sent',
              scheduled_for: now,
              sent_at: now,
              metadata: { ai_generated: true, context: category }
            });
            await notification.save();
          } catch (e) {
            console.error('Failed to persist email SmartNotification:', e?.message || e);
          }

          await User.updateOne(
            { _id: user._id },
            { $set: { [`notificationSettings.categories.${category}.last_sent.email`]: now } }
          );
        }
      }
    }
  }
});

// Helper: xây dựng context cho AI
async function buildUserContext(user) {
  const JournalEntry = require('../models/journalEntries');
  const DailyCheckin = require('../models/dailyCheckIn');

  // Correcting query and sort for DailyCheckin (Mongoose default timestamps are camelCase)
  const lastJournal = await JournalEntry.findOne({ user_id: user._id }).sort({ created_at: -1 });
  const lastMood = await DailyCheckin.findOne({ user: user._id }).sort({ createdAt: -1 });

  return {
    user_id: user._id.toString(),
    name: user.fullName || user.name || 'you',
    recent_mood: lastMood?.mood,
    recent_energy: lastMood?.energy,
    last_journal_snippet: lastJournal?.text?.substring(0, 100)
  };
}

// Helper: kiểm tra tần suất email 
async function checkEmailFrequency(user, category) {
  const settings = user.notificationSettings;
  if (!settings) return false;

  const limit = settings.email_frequency_limit || { per_category: false, max_per_day: 1 };
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  if (limit.per_category) {
    const cat = settings.categories?.[category];
    if (!cat) return false;
    const lastSent = cat.last_sent?.email;
    if (lastSent && new Date(lastSent) >= startOfDay) return false;
    return true;
  } else {
    let count = 0;
    if (settings.categories) {
      for (const cat of Object.values(settings.categories)) {
        if (cat.last_sent?.email && new Date(cat.last_sent.email) >= startOfDay) count++;
      }
    }
    return count < limit.max_per_day;
  }
}