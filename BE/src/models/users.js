const mongoose = require("mongoose");

const DEFAULT_AVATAR_URL =
  process.env.DEFAULT_AVATAR_URL ||
  "https://i.pinimg.com/originals/bc/43/98/bc439871417621836a0eeea768d60944.jpg";

const notificationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },

    dailyTimes: {
      type: [String],
      default: [],
    },

    types: {
      moodCheck: { type: Boolean, default: true },
      journalReminder: { type: Boolean, default: true },
      dailyTip: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      min: 0,
    },

    weight: {
      type: Number, // kg
      min: 0,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    avatarUrl: {
      type: String,
      default: DEFAULT_AVATAR_URL,
    },

    dateOfBirth: Date,

    heightCm: Number,

    healthGoals: [{ type: String }],

    accountStatus: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: String,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    notificationSettings: {
      type: notificationSchema,
      default: () => ({}),
    },

    appLockEnabled: {
      type: Boolean,
      default: false,
    },

    appLockPinHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", userSchema);
