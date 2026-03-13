const Journal = require("../models/journalEntries");
const cloudinary = require("../config/cloudinary");
const aiService = require("../services/aiService");
const imageService = require("./imageService");

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
    const journal = new Journal({
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
    const oldJournal = await Journal.findOne({ _id: id, user_id: userId });
    if (!oldJournal) throw new Error("Journal not found");

    const oldImages = oldJournal.images || [];
    const oldVoiceNote = oldJournal.voice_note_url;

    const journal = await Journal.findOneAndUpdate(
      { _id: id, user_id: userId },
      {
        $set: {
          title,
          mood,
          energy_level: Number(energy_level),
          text: text !== undefined ? text : oldJournal.text,
          trigger_tags: trigger_tags !== undefined ? trigger_tags : oldJournal.trigger_tags,
          images: images !== undefined ? images : oldJournal.images,
          voice_note_url: voice_note_url !== undefined ? voice_note_url : oldJournal.voice_note_url,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    // After update, check for images that were removed
    if (images !== undefined) {
      const removedImages = oldImages.filter(img => !images.includes(img));
      for (const imgUrl of removedImages) {
        await imageService.deleteImageIfUnused(imgUrl);
      }
    }

    // Check for voice note replacement
    if (voice_note_url !== undefined && oldVoiceNote && oldVoiceNote !== voice_note_url) {
      await imageService.deleteImageIfUnused(oldVoiceNote);
    }

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
    const journal = await Journal.findOne({
      _id: id,
      user_id: userId,
    });

    if (!journal) throw new Error("Journal not found");

    const imagesToDelete = journal.images || [];
    const voiceNoteToDelete = journal.voice_note_url;

    await Journal.deleteOne({ _id: id });

    // Cleanup Cloudinary
    for (const imgUrl of imagesToDelete) {
      await imageService.deleteImageIfUnused(imgUrl);
    }
    if (voiceNoteToDelete) {
      await imageService.deleteImageIfUnused(voiceNoteToDelete);
    }

    return journal;
  },

  cleanupSoftDeleted: async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entriesToPurge = await Journal.find({
      deleted_at: { $lt: thirtyDaysAgo, $ne: null }
    });

    console.log(`Found ${entriesToPurge.length} entries to permanently purge (older than 30 days).`);

    for (const entry of entriesToPurge) {
      try {
        await module.exports.permanentDelete({
          id: entry._id,
          userId: entry.user_id
        });
      } catch (error) {
        console.error(`Failed to purge entry ${entry._id}:`, error);
      }
    }

    return entriesToPurge.length;
  },
};
