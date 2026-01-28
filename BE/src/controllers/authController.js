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

      res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: false, // true nếu HTTPS
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: data.accessToken,
        user: data.user,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: "No refresh token" });

      const data = await authService.refreshToken(token);
      res.json(data);
    } catch {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  },

  logout: async (req, res) => {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  },
};
