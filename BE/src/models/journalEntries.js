const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    text: String,
    images: [String],
    updated_at: Date,
  },
  { _id: false }
);

const journalEntrySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    mood: String,
    energy_level: Number,
    text: String,
    images: [String],
    voice_note_url: String,
    trigger_tags: [String],

    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: Date,
    deleted_at: {
      type: Date,
      default: null,
    },

    version_history: [versionSchema],
  },
  { collection: "journal_entries" }
);

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
