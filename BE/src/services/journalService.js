const Journal = require("../models/journalEntries");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const aiService = require("../services/aiService");

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
module.exports = {
  create: async ({
    userId,
    title,
    mood,
    energy_level,
    text,
    trigger_tags,
    images = [],
    voice_note_url = null,
  }) => {
    return await Journal.create({
      user_id: userId,
      title,
      mood,
      energy_level: Number(energy_level) || 0,
      text,
      trigger_tags,
      images,
      voice_note_url,
      created_at: new Date(),
    });

    if (text && text.trim()) {
      try {
        const sentimentResult = await aiService.analyzeSentiment(text);
        if (sentimentResult.success) {
          journal.sentiment = {
            sentiment: sentimentResult.sentiment,
            score: sentimentResult.score,
            confidence: sentimentResult.confidence,
            emotions: sentimentResult.emotions || [] 
          };
        }
      } catch (error) {
        console.error("Failed to analyze sentiment for journal entry:", error);
      }
    }

    await journal.save();
    return journal;
  },

  getAll: async (userId) => {
    console.log("SERVICE USER ID:", userId);
    return await Journal.find({
      user_id: userId,
      deleted_at: null,
    })
      .sort({ created_at: -1 })
      .lean();
  },

  getDeleted: async (userId) => {
    return await Journal.find({
      user_id: userId,
      deleted_at: { $ne: null },
    }).sort({ deleted_at: -1 });
  },

  search: async ({ userId, query }) => {
    return await Journal.find({
      user_id: userId,
      deleted_at: null,
      $or: [
        { text: { $regex: query, $options: "i" } },
        { mood: { $regex: query, $options: "i" } },
        { trigger_tags: { $regex: query, $options: "i" } },
      ],
    });
  },

  update: async ({
    id,
    userId,
    title,
    mood,
    energy_level,
    text,
    trigger_tags,
    images,
    voice_note_url,
  }) => {
    const journal = await Journal.findOneAndUpdate(
      { _id: id, user_id: userId },
      {
        $set: {
          title,
          mood,
          energy_level: Number(energy_level),
          text,
          trigger_tags,
          images,
          voice_note_url,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!journal) throw new Error("Journal not found");

    return journal;
  },

  softDelete: async ({ id, userId }) => {
    const journal = await Journal.findOneAndUpdate(
      { _id: id, user_id: userId },
      { deleted_at: new Date() }
    );

    if (!journal) throw new Error("Journal not found");

    return journal;
  },

  restore: async ({ id, userId }) => {
    const journal = await Journal.findOneAndUpdate(
      { _id: id, user_id: userId },
      { deleted_at: null }
    );

    if (!journal) throw new Error("Journal not found");

    return journal;
  },

  permanentDelete: async ({ id, userId }) => {
    const journal = await Journal.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    if (!journal) throw new Error("Journal not found");

    return journal;
  },
};
