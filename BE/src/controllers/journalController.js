const journalService = require("../services/journalService");
const aiService = require("../services/aiService");

module.exports = {
  create: async (req, res) => {
    try {
      const data = await journalService.create({
        userId: req.user.id,
        title: req.body.title,
        mood: req.body.mood,
        energy_level: req.body.energy_level,
        text: req.body.text,
        trigger_tags: req.body.trigger_tags || [],
        images: req.body.images || [],
        voice_note_url: req.body.voice_note_url || null,
      });

      if (data?._id && data.text) {
        aiService
          .syncEntry(data._id, req.user.id, data.text, "add")
          .catch(console.error);
      }

      // Delete cached daily summary for today to force regeneration
      const mongoose = require("mongoose");
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      try {
        await mongoose.connection.collection("daily_summaries").deleteMany({
          user_id: mongoose.Types.ObjectId.isValid(req.user.id) ? new mongoose.Types.ObjectId(req.user.id) : req.user.id,
          date: startOfDay
        });
      } catch (err) {
        console.error("Failed to invalidate daily summary cache:", err);
      }

      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await journalService.getAll(req.user.id);
      res.json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  getDeleted: async (req, res) => {
    try {
      const data = await journalService.getDeleted(req.user.id);
      res.json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  search: async (req, res) => {
    try {
      const data = await journalService.search({
        userId: req.user.id,
        query: req.query.q,
      });

      res.json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = await journalService.update({
        id: req.params.id,
        userId: req.user.id,
        title: req.body.title,
        mood: req.body.mood,
        energy_level: req.body.energy_level,
        text: req.body.text,
        trigger_tags: req.body.trigger_tags,
        images: req.body.images,
        voice_note_url: req.body.voice_note_url,
      });

      if (data?._id && data.text) {
        aiService
          .syncEntry(data._id, req.user.id, data.text, "update")
          .catch(console.error);
      }

      res.json(data);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      await journalService.softDelete({
        id: req.params.id,
        userId: req.user.id,
      });

      aiService.deleteEntry(req.params.id, req.user.id).catch((err) => {
        console.error("Delete from vector store failed:", err);
      });

      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  restore: async (req, res) => {
    try {
      const data = await journalService.restore({
        id: req.params.id,
        userId: req.user.id,
      });

      if (data && data._id && data.text) {
        aiService
          .syncEntry(data._id, req.user.id, data.text, "add")
          .catch((err) => {
            console.error("Sync to vector store failed for restore:", err);
          });
      }

      res.json({ message: "Restored successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  permanentDelete: async (req, res) => {
    try {
      await journalService.permanentDelete({
        id: req.params.id,
        userId: req.user.id,
      });

      aiService.deleteEntry(req.params.id, req.user.id).catch((err) => {
        console.error(
          "Delete from vector store failed for permanent delete:",
          err
        );
      });

      res.json({ message: "Deleted permanently" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};
