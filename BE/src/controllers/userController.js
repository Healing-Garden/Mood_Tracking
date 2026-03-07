const User = require("../models/users");
const DailyCheckIn = require("../models/dailyCheckIn");
const Onboarding = require("../models/onboarding");
const JournalEntry = require("../models/journalEntries");
const ChatSession = require("../models/chatSession");

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
      const { mood, energy, note, triggers } = req.body || {};

      if (!mood || !energy) {
        return res
          .status(400)
          .json({ message: "Mood and energy are required" });
      }

      const today = new Date().toISOString().split("T")[0];
      const theme = getThemeByMood(Number(mood));

      const allowedTriggers = ["Family", "Work", "Health", "Relationships", "Finance", "Sleep", "Social", "Self-care", "Other"];
      const sanitizedTriggers = Array.isArray(triggers)
        ? triggers.filter((t) => allowedTriggers.includes(String(t)))
        : [];

      if (!sanitizedTriggers.length) {
        return res
          .status(400)
          .json({ message: "At least one trigger is required" });
      }

      const payload = {
        user: userId,
        mood,
        energy,
        note: note && String(note).trim() ? note : undefined,
        date: today,
        theme,
        triggers: sanitizedTriggers,
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

  // GET /api/user/checkins/flow?period=week|month|year
  getMoodFlow: async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || "week";

      const today = new Date();
      let start = new Date(today);

      if (period === "year") {
        start.setFullYear(start.getFullYear() - 1);
      } else if (period === "month") {
        start.setMonth(start.getMonth() - 1);
      } else {
        // default: week (7 days)
        start.setDate(start.getDate() - 6);
      }

      const toStr = today.toISOString().split("T")[0];
      const fromStr = start.toISOString().split("T")[0];

      const entries = await DailyCheckIn.find({
        user: userId,
        date: { $gte: fromStr, $lte: toStr },
      })
        .sort({ date: 1 })
        .lean();

      return res.json({
        period,
        from: fromStr,
        to: toStr,
        items: entries,
      });
    } catch (err) {
      console.error("getMoodFlow error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/analytics/trigger-heatmap?period=week|month|year
  getTriggerHeatmap: async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || "month";

      const today = new Date();
      let start = new Date(today);
      if (period === "year") {
        start.setFullYear(start.getFullYear() - 1);
      } else if (period === "month") {
        start.setMonth(start.getMonth() - 1);
      } else {
        start.setDate(start.getDate() - 6);
      }
      const toStr = today.toISOString().split("T")[0];
      const fromStr = start.toISOString().split("T")[0];

      const entries = await DailyCheckIn.find({
        user: userId,
        date: { $gte: fromStr, $lte: toStr },
        triggers: { $exists: true, $ne: [] },
      })
        .select("triggers theme")
        .lean();

      const triggerOrder = ["Family", "Work", "Health", "Relationships", "Finance", "Sleep", "Social", "Self-care", "Other"];
      const mapTheme = (theme) => {
        if (theme === "low") return "negative";
        if (theme === "neutral") return "neutral";
        return "positive";
      };

      const counts = {};
      triggerOrder.forEach((t) => {
        counts[t] = { negative: 0, neutral: 0, positive: 0 };
      });

      entries.forEach((entry) => {
        const moodKey = mapTheme(entry.theme);
        (entry.triggers || []).forEach((t) => {
          if (counts[t]) counts[t][moodKey] += 1;
        });
      });

      const rows = triggerOrder.map((trigger) => ({
        trigger,
        negative: counts[trigger].negative,
        neutral: counts[trigger].neutral,
        positive: counts[trigger].positive,
      }));

      return res.json({
        period,
        from: fromStr,
        to: toStr,
        moodLevels: ["negative", "neutral", "positive"],
        rows,
      });
    } catch (err) {
      console.error("getTriggerHeatmap error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/analytics/word-cloud?period=week|month|year
  getWordCloud: async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || "month";

      const today = new Date();
      let start = new Date(today);
      if (period === "year") {
        start.setFullYear(start.getFullYear() - 1);
      } else if (period === "month") {
        start.setMonth(start.getMonth() - 1);
      } else {
        start.setDate(start.getDate() - 6);
      }
      const toStr = today.toISOString().split("T")[0];
      const fromStr = start.toISOString().split("T")[0];

      const entries = await DailyCheckIn.find({
        user: userId,
        date: { $gte: fromStr, $lte: toStr },
        note: { $exists: true, $ne: "" },
      })
        .select("note")
        .lean();

      // Common stop words to filter out
      const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
        "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "can", "i", "me", "my", "myself", "we",
        "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
        "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its",
        "itself", "they", "them", "their", "theirs", "themselves", "what", "which",
        "who", "whom", "this", "that", "these", "those", "am", "been", "being",
        "have", "has", "had", "having", "do", "does", "did", "doing", "would",
        "should", "could", "ought", "i'm", "you're", "he's", "she's", "it's",
        "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd",
        "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll",
        "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't",
        "haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't",
        "shan't", "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's",
        "that's", "who's", "what's", "here's", "there's", "when's", "where's",
        "why's", "how's", "just", "very", "too", "so", "than", "such", "no",
        "not", "only", "own", "same", "then", "there", "when", "where", "why",
        "how", "all", "both", "each", "few", "more", "most", "other", "some",
      ]);

      // Word frequency map
      const wordFreq = {};

      entries.forEach((entry) => {
        if (!entry.note) return;

        // Extract words: lowercase, remove punctuation, split by whitespace
        const words = entry.note
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2 && !stopWords.has(w));

        words.forEach((word) => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      });

      // Convert to array and sort by frequency
      const words = Object.entries(wordFreq)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 100); // Top 100 words

      return res.json({
        period,
        from: fromStr,
        to: toStr,
        words,
      });
    } catch (err) {
      console.error("getWordCloud error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  // GET /api/user/analytics/mood-history?month=1&year=2024
  getMoodHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required" });
      }

      // Format start and end dates for the month
      const startOfMonth = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];

      const entries = await DailyCheckIn.find({
        user: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      })
        .select("date mood theme")
        .sort({ date: 1 })
        .lean();

      return res.json({
        month: parseInt(month),
        year: parseInt(year),
        items: entries,
      });
    } catch (err) {
      console.error("getMoodHistory error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/analytics/summary?period=week|month|year
  getAnalyticsSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || "month";

      const today = new Date();
      let start = new Date(today);
      let prevStart = new Date(today);
      let days = 30;

      if (period === "year") {
        start.setFullYear(start.getFullYear() - 1);
        prevStart.setFullYear(prevStart.getFullYear() - 2);
        days = 365;
      } else if (period === "month") {
        start.setMonth(start.getMonth() - 1);
        prevStart.setMonth(prevStart.getMonth() - 2);
        days = 30;
      } else {
        // default: week
        start.setDate(start.getDate() - 6);
        prevStart.setDate(prevStart.getDate() - 13);
        days = 7;
      }

      const toStr = today.toISOString().split("T")[0];
      const fromStr = start.toISOString().split("T")[0];
      const prevFromStr = prevStart.toISOString().split("T")[0];

      // 1. Avg Mood & Trend
      const currentCheckIns = await DailyCheckIn.find({
        user: userId,
        date: { $gte: fromStr, $lte: toStr },
      }).select("mood");

      const prevCheckIns = await DailyCheckIn.find({
        user: userId,
        date: { $gte: prevFromStr, $lt: fromStr },
      }).select("mood");

      const calculateAvg = (items) => {
        if (!items.length) return 0;
        const sum = items.reduce((acc, curr) => acc + curr.mood, 0);
        return parseFloat((sum / items.length).toFixed(1));
      };

      const avgMood = calculateAvg(currentCheckIns);
      const prevAvgMood = calculateAvg(prevCheckIns);
      const moodTrend = avgMood - prevAvgMood;

      // 2. Consistency
      const calculateConsistency = (items, daysCount) => Math.round((items.length / daysCount) * 100);
      const consistency = calculateConsistency(currentCheckIns, days);
      const prevConsistency = calculateConsistency(prevCheckIns, days);

      // 3. Total Entries (Journal) - Within the specific period
      const currentEntries = await JournalEntry.countDocuments({
        user_id: userId,
        createdAt: { $gte: start, $lte: today },
        deleted_at: null,
      });
      const prevEntries = await JournalEntry.countDocuments({
        user_id: userId,
        createdAt: { $gte: prevStart, $lt: start },
        deleted_at: null,
      });

      // 4. Insights (Count of chat sessions with summaries) - Within the specific period
      const currentInsights = await ChatSession.countDocuments({
        userId: userId,
        sessionSummary: { $exists: true, $ne: "" },
        createdAt: { $gte: start, $lte: today },
      });
      const prevInsights = await ChatSession.countDocuments({
        userId: userId,
        sessionSummary: { $exists: true, $ne: "" },
        createdAt: { $gte: prevStart, $lt: start },
      });

      return res.json({
        period,
        current: {
          avgMood,
          consistency,
          journalEntries: currentEntries,
          insightCount: currentInsights,
        },
        previous: {
          avgMood: prevAvgMood,
          consistency: prevConsistency,
          journalEntries: prevEntries,
          insightCount: prevInsights,
        },
        moodTrend: parseFloat(moodTrend.toFixed(1)),
      });
    } catch (err) {
      console.error("getAnalyticsSummary error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/dashboard/data
  getDashboardData: async (req, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      const toStr = today.toISOString().split("T")[0];
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      const weekFromStr = weekStart.toISOString().split("T")[0];

      // 1. Wellness Journey Day Count
      const user = await User.findById(userId).select("createdAt");
      let journeyDays = 1;
      if (user && user.createdAt) {
        const diffTime = Math.abs(today - user.createdAt);
        journeyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // 2. Weekly Stats (Same logic as Analytics Page for sync)
      const currentCheckIns = await DailyCheckIn.find({
        user: userId,
        date: { $gte: weekFromStr, $lte: toStr },
      }).select("mood");

      const calculateAvg = (items) => {
        if (!items.length) return 0;
        const sum = items.reduce((acc, curr) => acc + curr.mood, 0);
        return parseFloat((sum / items.length).toFixed(1));
      };

      const avgMood = calculateAvg(currentCheckIns);
      const totalEntriesLabel = await JournalEntry.countDocuments({
        user_id: userId,
        createdAt: { $gte: weekStart, $lte: today },
        deleted_at: null,
      });
      const insightCount = await ChatSession.countDocuments({
        userId: userId,
        sessionSummary: { $exists: true, $ne: "" },
        createdAt: { $gte: weekStart, $lte: today },
      });

      // 3. Mood Distribution (Pie Chart) - Last 30 days
      const monthStart = new Date(today);
      monthStart.setMonth(monthStart.getMonth() - 1);
      const monthFromStr = monthStart.toISOString().split("T")[0];

      const monthEntries = await DailyCheckIn.find({
        user: userId,
        date: { $gte: monthFromStr, $lte: toStr },
      }).select("mood theme");

      const distribution = {
        'Happy': 0,
        'Calm': 0,
        'Anxious': 0,
        'Sad': 0
      };

      monthEntries.forEach(e => {
        if (e.mood === 5) distribution['Happy']++;
        else if (e.mood === 4 || e.mood === 3) distribution['Calm']++;
        else if (e.mood === 2) distribution['Anxious']++;
        else if (e.mood === 1) distribution['Sad']++;
      });

      const totalMonth = monthEntries.length || 1;
      const pieData = [
        { name: 'Happy', value: Math.round((distribution['Happy'] / totalMonth) * 100), fill: '#52b788' },
        { name: 'Calm', value: Math.round((distribution['Calm'] / totalMonth) * 100), fill: '#7fdb8e' },
        { name: 'Anxious', value: Math.round((distribution['Anxious'] / totalMonth) * 100), fill: '#f4d35e' },
        { name: 'Sad', value: Math.round((distribution['Sad'] / totalMonth) * 100), fill: '#8b5cf6' },
      ];

      return res.json({
        journeyDays,
        weeklyStats: {
          checkIns: currentCheckIns.length,
          avgMood,
          journalEntries: totalEntriesLabel,
          insightsGenerated: insightCount
        },
        moodDistribution: pieData
      });

    } catch (err) {
      console.error("getDashboardData error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/user/profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const userService = require("../services/userService");
      const user = await userService.getProfile(userId);
      return res.json(user);
    } catch (err) {
      console.error("getProfile error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  },

  // PUT /api/user/profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { fullName, age, heightCm, weight } = req.body;
      const userService = require("../services/userService");
      const user = await userService.updateProfile(userId, {
        fullName,
        age,
        heightCm,
        weight,
      });
      return res.json({ message: "Profile updated successfully", user });
    } catch (err) {
      console.error("updateProfile error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  },

  // POST /api/user/avatar
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      const userId = req.user.id;
      const userService = require("../services/userService");
      const result = await userService.uploadAvatar(userId, req.file);
      return res.json({ message: "Avatar uploaded successfully", ...result });
    } catch (err) {
      console.error("uploadAvatar error:", err);
      return res.status(500).json({ message: err.message || "Internal server error" });
    }
  },

  // POST /api/user/change-password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword, recoveryCode } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const userService = require("../services/userService");
      const result = await userService.changePassword(userId, {
        currentPassword,
        newPassword,
        recoveryCode,
      });
      return res.json(result);
    } catch (err) {
      console.error("changePassword error:", err);
      return res.status(400).json({ message: err.message || "Internal server error" });
    }
  },

  // GET /api/user/admin/recovery-codes
  getAdminRecoveryCodes: async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userId = req.user.id;
      const userService = require("../services/userService");
      const result = await userService.getAdminRecoveryCodes(userId);
      return res.json(result);
    } catch (err) {
      console.error("getAdminRecoveryCodes error:", err);
      return res.status(400).json({ message: err.message || "Internal server error" });
    }
  },

  // POST /api/user/admin/recovery-codes/regenerate
  regenerateAdminRecoveryCodes: async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userId = req.user.id;
      const userService = require("../services/userService");
      const result = await userService.regenerateAdminRecoveryCodes(userId);
      return res.json(result);
    } catch (err) {
      console.error("regenerateAdminRecoveryCodes error:", err);
      return res.status(400).json({ message: err.message || "Internal server error" });
    }
  },

  setAppLockPin: async (req, res) => {
    try {
      const userId = req.user.id;
      const { pin } = req.body;
      const userService = require("../services/userService");
      const result = await userService.setAppLockPin(userId, pin);
      return res.json(result);
    } catch (err) {
      console.error("setAppLockPin error:", err);
      return res.status(400).json({ message: err.message || "Internal server error" });
    }
  },

  verifyAppLockPin: async (req, res) => {
    try {
      const userId = req.user.id;
      const { pin } = req.body;
      const userService = require("../services/userService");
      const result = await userService.verifyAppLockPin(userId, pin);
      return res.json(result);
    } catch (err) {
      console.error("verifyAppLockPin error:", err);
      return res.status(401).json({ message: err.message || "Internal server error" });
    }
  },

  toggleAppLock: async (req, res) => {
    try {
      const userId = req.user.id;
      const { enabled } = req.body;
      const userService = require("../services/userService");
      const result = await userService.toggleAppLock(userId, enabled);
      return res.json(result);
    } catch (err) {
      console.error("toggleAppLock error:", err);
      return res.status(400).json({ message: err.message || "Internal server error" });
    }
  },
};


