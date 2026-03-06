const Users = require("../models/users");

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
    }
};
