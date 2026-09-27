const ContactMessage = require('../models/ContactMessage');
const { sendContactAlert } = require('../utils/mailer');

async function submit(req, res) {
  const { name, email, phone, subject, message } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const m = await ContactMessage.create({ name, email, phone, subject, message });
  // fire-and-forget email to site owner
  sendContactAlert(
    `New enquiry from ${name}`,
    `Name: ${name}\nEmail: ${email || '-'}\nPhone: ${phone || '-'}\nSubject: ${subject || '-'}\n\nMessage:\n${message || '-'}\n\nReceived: ${new Date().toLocaleString('en-IN')}`
  ).catch(() => {});
  res.status(201).json({ ok: true, id: m._id });
}
async function list(req, res) {
  const msgs = await ContactMessage.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json({ count: msgs.length, messages: msgs });
}
async function markRead(req, res) {
  await ContactMessage.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ ok: true });
}
module.exports = { submit, list, markRead };
