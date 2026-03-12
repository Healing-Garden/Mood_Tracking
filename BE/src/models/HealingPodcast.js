const mongoose = require("mongoose");

const healingPodcastSchema = new mongoose.Schema(
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
            default: "podcast",
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
            type: String, // Cloudinary URL stored in healing_podcasts folder
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

healingPodcastSchema.index({ is_active: 1, "metadata.duration_seconds": 1 });
healingPodcastSchema.index({ "metadata.mood_tags": 1 });

module.exports = mongoose.model("HealingPodcast", healingPodcastSchema);
