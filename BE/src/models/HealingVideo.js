const mongoose = require("mongoose");

const healingVideoSchema = new mongoose.Schema(
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
            default: "video",
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
            duration_seconds: {
                type: Number,
                min: 0,
                default: 0,
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

healingVideoSchema.index({ is_active: 1, "metadata.duration_seconds": 1 });
healingVideoSchema.index({ "metadata.mood_tags": 1 });

module.exports = mongoose.model("HealingVideo", healingVideoSchema);
