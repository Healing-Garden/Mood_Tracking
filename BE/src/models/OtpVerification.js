// models/OtpVerification.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, index: true },
  type: {
    type: String,
    enum: ["REGISTER", "FORGOT_PASSWORD"],
    index: true,
  },
  otpHash: String,
  expiresAt: Date,
  payload: Object, // lưu fullName, age, weight, password
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("OtpVerification", otpSchema);
