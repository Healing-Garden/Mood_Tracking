const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Bắt buộc phải là Mật khẩu ứng dụng (App Password)
  },
  // Thêm giới hạn thời gian kết nối tránh việc bị treo trên production
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

exports.sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Mood Tracking" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Mã OTP xác thực của bạn",
    html: `<h3>Mã OTP của bạn là: <b>${otp}</b></h3><p>Mã này có hiệu lực trong vòng 5 phút.</p>`,
  });
};
