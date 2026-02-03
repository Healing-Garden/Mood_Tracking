const mongoose = require("mongoose");

const dailyCheckInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    // 1–5, mapped from emoji mood
    mood: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    // 1–10 slider
    energy: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    // YYYY-MM-DD string for easier querying per day
    date: {
      type: String,
      required: true,
    },
    // Derived from mood: low / neutral / positive
    theme: {
      type: String,
      enum: ["low", "neutral", "positive"],
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure 1 check-in per user per day
dailyCheckInSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyCheckIn", dailyCheckInSchema);

