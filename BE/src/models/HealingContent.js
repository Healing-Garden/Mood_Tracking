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
    },
    { timestamps: true }
);

module.exports = mongoose.model("HealingContent", healingContentSchema);
