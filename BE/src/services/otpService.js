const Otp = require("../models/OtpVerification");
const { generateOTP, hashOTP } = require("../utils/otp");
const { sendOTP } = require("../utils/mailer");

const OTP_TTL = 5 * 60 * 1000;

exports.createOtp = async ({ email, type, payload }) => {
  await Otp.findOneAndDelete({ email, type });

  const otp = generateOTP();

  await Otp.create({
    email,
    type,
    otpHash: hashOTP(otp),
    payload,
    expiresAt: new Date(Date.now() + OTP_TTL),
  });

  try {
    await sendOTP(email, otp);
  } catch (err) {
    console.error("Send OTP failed:", err.message);
  }
};

exports.verifyOtp = async ({ email, type, otp }) => {
  const record = await Otp.findOne({ email, type });
  if (!record) throw new Error("OTP expired or invalid");

  if (record.expiresAt < new Date())
    throw new Error("OTP expired");

  if (hashOTP(otp) !== record.otpHash)
    throw new Error("Invalid OTP");

  await Otp.deleteOne({ email, type });
  return record.payload;
};
