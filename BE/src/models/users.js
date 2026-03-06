const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  methods: [{ type: String, enum: ['web', 'email'] }],
  time_slots: [String],
  last_sent: {
    web: Date,
    email: Date
  }
}, { _id: false });

const weeklyInsightsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  methods: [{ type: String, enum: ['web', 'email'] }],
  day_of_week: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  time: String,
  last_sent: { email: Date }
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  smart_remind_enabled: { type: Boolean, default: false },
  email_frequency_limit: {
    per_category: { type: Boolean, default: false },
    max_per_day: { type: Number, default: 1 }
  },
  categories: {
    mood_check: categorySchema,
    journal_reminder: categorySchema,
    hydration: categorySchema,
    meditation: categorySchema,
    weekly_insights: weeklyInsightsSchema
  }
}, { _id: false });


const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, },
    age: { type: Number, min: 0, },
    weight: { type: Number,  min: 0, },
    email: { type: String, required: true, unique: true, lowercase: true, },
    password: { type: String, default: null, },
    role: { type: String, enum: ["user", "admin"], default: "user", },
    avatarUrl: String,
    dateOfBirth: Date,
    heightCm: Number,
    healthGoals: [{ type: String }],
    accountStatus: { type: String, enum: ["active", "banned"], default: "active", },
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local", },
    googleId: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({
        smart_remind_enabled: false,
        email_frequency_limit: { per_category: false, max_per_day: 1 },
        categories: {
          mood_check: { enabled: false, methods: ['web'], time_slots: ['09:00'] },
          journal_reminder: { enabled: false, methods: ['web'], time_slots: ['20:00'] },
          hydration: { enabled: false, methods: ['web'], time_slots: ['10:00','15:00','20:00'] },
          meditation: { enabled: false, methods: ['web'], time_slots: ['07:00','22:00'] },
          weekly_insights: { enabled: false, methods: ['email'], day_of_week: 'Monday', time: '08:00' }
        }
      })
    },
    appLockEnabled: { type: Boolean, default: false, },
    appLockPinHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);
