const mongoose = require("mongoose");

const actionCompletionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        action_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HealingContent",
            required: true,
        },
        action_title: {
            type: String,
        },
        duration_seconds: {
            type: Number,
            min: 0,
            default: 0,
        },
        completed_at: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            mood_at_time: {
                type: String,
            },
            source: {
                type: String,
                enum: ["suggestion", "explore"],
                default: "suggestion",
            },
        },
    },
    { timestamps: true }
);

actionCompletionSchema.index({ user_id: 1, completed_at: -1 });
actionCompletionSchema.index({ action_id: 1 });

module.exports = mongoose.model("ActionCompletion", actionCompletionSchema);