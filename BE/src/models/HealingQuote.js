const mongoose = require("mongoose");

const healingQuoteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            default: "quote",
        },
        moodLevel: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            default: 3,
        },
        content: {
            type: String,
        },
        videoUrl: {
            type: String,
        },
        thumbnail: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
        },
        metadata: {
            duration_min: {
                type: Number,
                min: 0,
                default: 1,
            },
            difficulty: {
                type: String,
                enum: ["easy", "medium", "hard"],
                default: "easy",
            },
            mood_tags: {
                type: [String],
                default: [],
            },
            author: {
                type: String,
                trim: true,
            },
        },
        is_active: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

healingQuoteSchema.index({ is_active: 1, "metadata.duration_min": 1 });
healingQuoteSchema.index({ "metadata.mood_tags": 1 });

module.exports = mongoose.model("HealingQuote", healingQuoteSchema);
