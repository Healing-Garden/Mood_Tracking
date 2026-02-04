const profileService = require("../services/profileService");
const fs = require("fs");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await profileService.getProfile(userId);

      res.json({
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await profileService.updateProfile(userId, req.body);

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const data = await profileService.uploadAvatar(userId, req.file);

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        message: "Avatar uploaded successfully",
        ...data,
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(400).json({ message: error.message });
    }
  },

  deleteAvatar: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await profileService.deleteAvatar(userId);

      res.json({
        message: "Avatar reset successfully",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current and new password are required" });
      }

      const result = await profileService.updatePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  setAppLockPin: async (req, res) => {
    try {
      const { pin } = req.body;
      const userId = req.user.id;

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must be exactly 6 digits" });
      }

      const user = await profileService.setAppLockPin(userId, pin);

      res.json({
        message: "App Lock PIN set successfully",
        user,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};
