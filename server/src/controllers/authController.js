const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendContactAlert } = require('../utils/mailer');

function sign(u) { return jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }); }
function frontBase() { return (process.env.CLIENT_URL || process.env.CORS_ORIGIN || process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''); }
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));

async function login(req, res) {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ message: 'userId and password required' });
  const u = await User.findOne({ userId: String(userId).toLowerCase() }).select('+passwordHash');
  if (!u || !(await u.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(u), user: u.toSafe() });
}
async function me(req, res) { res.json({ user: req.user.toSafe() }); }

async function forgot(req, res) {
  const { userId } = req.body;
  const u = userId ? await User.findOne({ userId: String(userId).toLowerCase() }) : null;
  // always respond ok (don't reveal if account exists)
  if (u) {
    const target = u.email || (isEmail(u.userId) ? u.userId : '');
    if (target) {
      const raw = crypto.randomBytes(24).toString('hex');
      u.resetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      u.resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await u.save();
      const link = `${frontBase()}/admin/reset?token=${raw}`;
      // reuse mailer; send to the admin's email
      const nodemailer = require('nodemailer');
      let transporter = null;
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      }
      const body = `Password reset for RvmAiTech admin (${u.userId}).\n\nReset link (valid 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`;
      if (transporter) {
        try { await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: target, subject: '[RvmAiTech] Password reset', text: body }); console.log(`[reset] emailed ${target}`); }
        catch (e) { console.error('reset email failed:', e.message); }
      } else { console.log(`[reset] ${target}: ${link}`); }
    } else {
      console.log(`[reset] user ${u.userId} has no email set — cannot send`);
    }
  }
  res.json({ ok: true, message: 'If the account exists and has an email, a reset link has been sent.' });
}

async function reset(req, res) {
  const { token, password } = req.body;
  if (!token || !password || String(password).length < 6) return res.status(400).json({ message: 'token and password (min 6) required' });
  const hash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const u = await User.findOne({ resetTokenHash: hash, resetTokenExp: { $gt: new Date() } });
  if (!u) return res.status(400).json({ message: 'Invalid or expired reset link' });
  u.password = password;
  u.resetTokenHash = ''; u.resetTokenExp = undefined;
  await u.save();
  res.json({ ok: true });
}

module.exports = { login, me, forgot, reset };
