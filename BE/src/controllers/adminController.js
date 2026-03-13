const Users = require("../models/users");
const Feedback = require("../models/Feedback");

module.exports = {
    getUsers: async (req, res) => {
        try {
            const { search } = req.query;
            let query = {};
            if (search) {
                query = {
                    $or: [
                        { fullName: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } }
                    ]
                };
            }

            const users = await Users.find(query)
                .select("_id fullName email avatarUrl isBanned role createdAt accountStatus")
                .sort({ createdAt: -1 });

            res.json(users);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getAllFeedback: async (req, res) => {
        try {
            console.log("Fetching all feedback...");
            const feedbacks = await Feedback.find()
                .populate({
                    path: "user_id",
                    model: "Users",
                    select: "fullName email"
                })
                .sort({ created_at: -1 });

            console.log(`Found ${feedbacks.length} feedback entries.`);
            if (feedbacks.length > 0) {
                console.log("Sample feedback user_id:", feedbacks[0].user_id);
            }

            res.json(feedbacks);
        } catch (err) {
            console.error("Get all feedback error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    banUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { durationDays, reason } = req.body;

            if (req.user && (req.user.id === id || req.user._id === id)) {
                return res.status(400).json({ message: "You cannot ban yourself" });
            }

            let banExpiresAt = null;
            if (durationDays && typeof durationDays === 'number' && durationDays > 0) {
                banExpiresAt = new Date();
                banExpiresAt.setDate(banExpiresAt.getDate() + durationDays);
            }

            const user = await Users.findByIdAndUpdate(
                id,
                {
                    isBanned: true,
                    accountStatus: "banned",
                    banExpiresAt: banExpiresAt,
                    banReason: reason || ""
                },
                { new: true }
            );

            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({ message: "User banned successfully", user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    unbanUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await Users.findByIdAndUpdate(
                id,
                {
                    isBanned: false,
                    accountStatus: "active",
                    banExpiresAt: null,
                    banReason: ""
                },
                { new: true }
            );

            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({ message: "User unbanned successfully", user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    updateFeedbackStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, admin_response } = req.body;

            const feedback = await Feedback.findByIdAndUpdate(
                id,
                { status, admin_response },
                { new: true }
            );

            if (!feedback) return res.status(404).json({ message: "Feedback not found" });

            res.json({ message: "Feedback updated successfully", feedback });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};
