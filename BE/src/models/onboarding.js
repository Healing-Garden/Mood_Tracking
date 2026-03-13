const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            unique: true,
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },
        // New Fields for UC 42-45
        improveGoals: [
            {
                type: String,
                trim: true,
            },
        ],
        frequentFeeling: {
            type: String,
            trim: true,
        },
        personalGoalDescription: {
            type: String,
            trim: true,
        },
        stressLevel: {
            type: String,
            trim: true,
        },
        recentState: {
            type: String,
            trim: true,
        },
        emotionalClarity: {
            type: String,
            trim: true,
        },
        reflectionFrequency: {
            type: String,
            trim: true,
        },
        negativeEmotionHandling: {
            type: String,
            trim: true,
        },
        experienceLearning: {
            type: String,
            trim: true,
        },

        // Legacy Fields (kept for backward compatibility)
        goals: [
            {
                type: String,
                trim: true,
            },
        ],
        emotionalSensitivity: {
            type: String,
            enum: ["soft", "balanced", "vibrant"],
            default: "balanced",
        },
        reminderTone: {
            type: String,
            enum: ["gentle", "neutral", "motivational"],
            default: "gentle",
        },
        themePreference: {
            type: String,
            enum: ["light", "dark"],
            default: "light",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Onboarding", onboardingSchema);
