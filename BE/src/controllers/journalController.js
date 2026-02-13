const journalService = require("../services/journalService");

module.exports = {
  create: async (req, res) => {
    try {
      const data = await journalService.create({
        userId: req.user.id,
        title: req.body.title,
        mood: req.body.mood,
        energy_level: req.body.energy_level,
        text: req.body.text,
        trigger_tags: req.body.trigger_tags
          ? JSON.parse(req.body.trigger_tags)
          : [],
        files: req.files,
      });
      console.log(req.files);

      res.status(201).json(data);
    } catch (err) {
      console.error(err);
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
        ...req.body,
      });

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

      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  restore: async (req, res) => {
    try {
      await journalService.restore({
        id: req.params.id,
        userId: req.user.id,
      });

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

      res.json({ message: "Deleted permanently" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};
