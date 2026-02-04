const User = require("../models/users");
const DailyCheckIn = require("../models/dailyCheckIn");
const Onboarding = require("../models/onboarding");

// Helper to derive theme from mood (1–5)
const getThemeByMood = (mood) => {
  if (mood <= 2) return "low";
  if (mood === 3) return "neutral";
  return "positive";
};

module.exports = {
  // GET /api/user/onboarding/status
  getOnboardingStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const onboarding = await Onboarding.findOne({ user: userId }).select(
        "isOnboarded"
      );
      if (!onboarding) {
        return res.json({ isOnboarded: false });
      }
      return res.json({ isOnboarded: onboarding.isOnboarded || false });
    } catch (err) {
      console.error("getOnboardingStatus error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/onboarding
  getOnboardingPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const onboarding = await Onboarding.findOne({ user: userId }).lean();
      if (!onboarding) {
        return res.json({});
      }
      return res.json(onboarding);
    } catch (err) {
      console.error("getOnboardingPreferences error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // POST /api/user/onboarding
  saveOnboardingPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        goals = [],
        emotionalSensitivity,
        reminderTone,
        themePreference,
      } = req.body || {};

      const payload = {
        user: userId,
        isOnboarded: true,
        goals,
        emotionalSensitivity,
        reminderTone,
        themePreference,
      };

      const onboarding = await Onboarding.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true, upsert: true, runValidators: true }
      );

      if (!onboarding) {
        return res.status(500).json({ message: "Unable to save onboarding" });
      }

      return res.json(onboarding);
    } catch (err) {
      console.error("saveOnboardingPreferences error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/checkins/today
  getTodayCheckIn: async (req, res) => {
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split("T")[0];

      const entry = await DailyCheckIn.findOne({
        user: userId,
        date: today,
      });

      if (!entry) {
        return res.status(404).json({ message: "No check-in for today" });
      }

      return res.json(entry);
    } catch (err) {
      console.error("getTodayCheckIn error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // POST /api/user/checkins
  saveDailyCheckIn: async (req, res) => {
    try {
      const userId = req.user.id;
      const { mood, energy, note } = req.body || {};

      if (!mood || !energy) {
        return res
          .status(400)
          .json({ message: "Mood and energy are required" });
      }

      const today = new Date().toISOString().split("T")[0];
      const theme = getThemeByMood(Number(mood));

      const payload = {
        user: userId,
        mood,
        energy,
        note: note && String(note).trim() ? note : undefined,
        date: today,
        theme,
      };

      const entry = await DailyCheckIn.findOneAndUpdate(
        { user: userId, date: today },
        payload,
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json(entry);
    } catch (err) {
      console.error("saveDailyCheckIn error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

