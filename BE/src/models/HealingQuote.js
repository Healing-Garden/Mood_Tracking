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
        is_active: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("HealingQuote", healingQuoteSchema);
