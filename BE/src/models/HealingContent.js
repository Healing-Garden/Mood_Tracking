const mongoose = require("mongoose");

const healingContentSchema = new mongoose.Schema(
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
            enum: ["quote", "video", "article"],
            required: true,
        },
        content: {
            type: String,
            // Used for quote text or article content
        },
        videoUrl: {
            type: String,
            // Used when type = video
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
                // required: true, 
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

healingContentSchema.index({ is_active: 1, "metadata.duration_min": 1 });
healingContentSchema.index({ "metadata.mood_tags": 1 });

module.exports = mongoose.model("HealingContent", healingContentSchema);
