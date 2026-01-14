const authService = require("../services/authService");

module.exports = {
    register: async (req, res) => {
        try {
            const user = await authService.register(req.body);
            res.json(user);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    login: async (req, res) => {
        try {
            const data = await authService.login(req.body);
            res.json(data);
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    }
};