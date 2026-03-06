const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.MAIL_USER,   
    pass: process.env.MAIL_PASS    
  }
});

/**
 * Gửi email
 * @param {string} to - Địa chỉ người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} html - Nội dung HTML
 * @returns {Promise<boolean>}
 */
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Healing Garden" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

module.exports = { send: sendEmail };