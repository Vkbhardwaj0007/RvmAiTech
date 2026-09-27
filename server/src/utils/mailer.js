const nodemailer = require('nodemailer');
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
async function sendContactAlert(subject, text) {
  const to = process.env.CONTACT_EMAIL || process.env.MAIL_FROM;
  if (!transporter || !to) { console.log(`[contact] ${subject} — ${text}`); return; }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject: `[RvmAiTech] ${subject}`, text });
    console.log(`[contact] emailed ${to}`);
  } catch (e) { console.error('contact email failed:', e.message); }
}
module.exports = { sendContactAlert };
