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
