const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    text: String,
    images: [String],
    updated_at: Date,
  },
  { _id: false }
);

const sentimentSchema = new mongoose.Schema(
  {
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
    score: Number,
    confidence: Number,
    emotions: [{
      label: String,
      score: Number,
      _id: false
    }]
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

    sentiment: sentimentSchema,

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

journalEntrySchema.index({ images: 1 });
journalEntrySchema.index({ voice_note_url: 1 });

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
