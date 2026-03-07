const Users = require("../models/users");

module.exports = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // We can use req.user.role from the JWT, but mapping it from the DB is safer
        // to ensure the user hasn't been demoted since the token was issued.
        const user = await Users.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden - Admin access required" });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Server error checking admin permissions" });
    }
};
