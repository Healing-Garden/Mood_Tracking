const mongoose = require("mongoose");

const healingArticleSchema = new mongoose.Schema(
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
            default: "article",
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
        is_active: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("HealingArticle", healingArticleSchema);
