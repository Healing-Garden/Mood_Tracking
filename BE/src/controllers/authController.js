const Users = require("../models/users");
const otpService = require("../services/otpService");
const authService = require("../services/authService");
const bcrypt = require("bcrypt");
const { checkRateLimit } = require("../utils/rateLimit");

module.exports = {
  register: async (req, res) => {
    const { email } = req.body;

    if (await Users.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });

    await otpService.createOtp({
      email,
      type: "REGISTER",
      payload: req.body, // fullName, age, weight, password
    });

    res.json({ message: "OTP sent to email" });
  },

  verifyRegisterOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const payload = await otpService.verifyOtp({
        email,
        type: "REGISTER",
        otp,
      });

      const hashedPassword = await bcrypt.hash(payload.password, 10);

      await Users.create({
        fullName: payload.fullName,
        email,
        password: hashedPassword,
        role: "user",
        authProvider: "local",
        accountStatus: "active",
      });

      res.json({ message: "Register success. Redirect to login" });
    } catch (err) {
      // ✅ QUAN TRỌNG
      res.status(400).json({
        message: err.message || "OTP invalid",
      });
    }
  },

  resendRegisterOtp: async (req, res) => {
    if (!checkRateLimit(req.body.email))
      return res.status(429).json({ message: "Wait before resend" });

    await otpService.createOtp({
      email: req.body.email,
      type: "REGISTER",
      payload: req.body.payload,
    });

    res.json({ message: "OTP resent" });
  },

  login: async (req, res) => {
    try {
      const data = await authService.login(req.body);

      res.cookie("refreshToken", data.refreshToken, {
        httpOnly: true,
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

  forgotPassword: async (req, res) => {
    const { email } = req.body;

    if (!(await Users.findOne({ email })))
      return res.status(404).json({ message: "Email not found" });

    await otpService.createOtp({
      email,
      type: "FORGOT_PASSWORD",
    });

    res.json({ message: "OTP sent" });
  },

  verifyForgotOtp: async (req, res) => {
    const { email, otp, newPassword } = req.body;

    await otpService.verifyOtp({
      email,
      type: "FORGOT_PASSWORD",
      otp,
    });

    await authService.resetPassword(email, newPassword);

    res.json({ message: "Password reset success" });
  },
};
