const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOTP = async (email, otp) => {
  await transporter.sendMail({
    to: email,
    subject: "Your OTP Code",
    html: `<h3>Your OTP: <b>${otp}</b></h3><p>Valid for 5 minutes</p>`,
  });
};
