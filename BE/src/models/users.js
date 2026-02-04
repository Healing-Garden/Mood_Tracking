const mongoose = require("mongoose");

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

    avatarUrl: String,

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
