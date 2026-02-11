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
};


