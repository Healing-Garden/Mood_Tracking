const Journal = require("../models/journalEntries");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

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
    files,
  }) => {
    let images = [];
    let voice_note_url = null;

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer);

        if (file.mimetype.startsWith("image/")) {
          images.push(result.secure_url);
        }

        if (file.mimetype.startsWith("audio/")) {
          voice_note_url = result.secure_url;
        }
      }
    }

    const journal = await Journal.create({
      user_id: userId,
      title,
      mood,
      energy_level: Number(energy_level) || 0,
      text,
      trigger_tags,
      images,
      voice_note_url,
    });

    return journal;
  },
  getAll: async (userId) => {
    return await Journal.find({
      user_id: userId,
      deleted_at: null,
    }).sort({ created_at: -1 });
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

  update: async ({ id, userId, mood, energy_level, text, trigger_tags }) => {
    const journal = await Journal.findOne({
      _id: id,
      user_id: userId,
    });

    if (!journal) throw new Error("Journal not found");

    journal.version_history.push({
      text: journal.text,
      images: journal.images,
      updated_at: new Date(),
    });

    journal.mood = mood ?? journal.mood;
    journal.energy_level = energy_level ?? journal.energy_level;
    journal.text = text ?? journal.text;
    journal.trigger_tags = trigger_tags ?? journal.trigger_tags;

    return await journal.save();
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
