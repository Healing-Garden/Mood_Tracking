const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOTP = async (email, otp) => {
  const { data, error } = await resend.emails.send({
    from: "Mood Tracking <onboarding@resend.dev>", // Default email sender from Resend for testing purposes
    to: [email],
    subject: "Mã OTP xác thực của bạn",
    html: `<h3>Mã OTP của bạn là: <b>${otp}</b></h3><p>Mã này có hiệu lực trong vòng 5 phút.</p>`,
  });

  if (error) {
    console.error("❌ Resend API Error:", error);
    throw new Error(error.message);
  }

  console.log("✅ Email sent via Resend API:", data);
  return data;
};
