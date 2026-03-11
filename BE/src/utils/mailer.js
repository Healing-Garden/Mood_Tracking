const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // port 587 sử dụng STARTTLS thay vì SSL/TLS trực tiếp
  requireTLS: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Mật khẩu ứng dụng 16 ký tự
  },
  // Giảm timeout xuống 5s để server phản hồi lỗi 500 trước khi Frontend bị timeout (thường là 10s) dẫn tới lỗi 499
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

exports.sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Mood Tracking" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Mã OTP xác thực của bạn",
    html: `<h3>Mã OTP của bạn là: <b>${otp}</b></h3><p>Mã này có hiệu lực trong vòng 5 phút.</p>`,
  });
};
