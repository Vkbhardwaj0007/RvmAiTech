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
  let to = process.env.CONTACT_EMAIL || 'rvmaitech2026@gmail.com';
  try {
    const Site = require('../models/Site');
    const site = await Site.findOne();
    if (site?.content?.contact?.email) {
      to = site.content.contact.email;
    }
  } catch (_) {}

  if (!transporter || !to) { console.log(`[contact] ${subject} — ${text}`); return; }
  try {
    await transporter.sendMail({
      from: `"RvmAiTech Notifications" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `[RvmAiTech] ${subject}`,
      text,
    });
    console.log(`[contact] emailed ${to}`);
  } catch (e) { console.error('contact email failed:', e.message); }
}
/**
 * Sends a password-reset link.
 *
 * Returns true only if the mail was actually handed to SMTP. The caller must
 * NOT change its HTTP response based on that — the endpoint answers the same
 * way whether or not an email went out, or the response would reveal which
 * accounts exist.
 *
 * The link is never logged in production. DEV_LOG_RESET_LINKS=true prints it
 * to the console in development, where there is often no SMTP configured.
 */
async function sendPasswordReset(to, link) {
  const { config } = require('../config/env');

  const text = [
    'A password reset was requested for your RvmAiTech admin account.',
    '',
    `Reset link (valid for ${Math.round(config.resetTokenTtl / 60)} minutes, single use):`,
    link,
    '',
    "If you didn't request this, you can ignore this email — nothing has changed.",
  ].join('\n');

  if (!transporter || !to) {
    if (config.devLogResetLinks) console.log(`[reset] would email ${to}: ${link}`);
    else console.log('[reset] no SMTP configured — reset email not sent');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: '[RvmAiTech] Password reset',
      text,
    });
    // Note the absence of the address and the link in this line.
    console.log('[reset] reset email sent');
    return true;
  } catch (e) {
    console.error('[reset] email failed:', e.message);
    return false;
  }
}

module.exports = { sendContactAlert, sendPasswordReset };
