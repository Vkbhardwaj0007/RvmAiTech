const ContactMessage = require('../models/ContactMessage');
const { sendContactAlert } = require('../utils/mailer');

async function submit(req, res) {
  const { name, email, phone, company, subject, budget, timeline, message, projectCategory, requirements } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const finalSubject = subject || (projectCategory ? `[${projectCategory}] Project Inquiry` : 'Custom Hardware & Software Project Enquiry');
  const finalMessage = message || requirements || '';
  const m = await ContactMessage.create({
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    subject: finalSubject,
    budget: budget || '',
    timeline: timeline || '',
    message: finalMessage,
  });
  // Send email to admin
  const details = [
    `Name: ${name}`,
    `Company: ${company || '-'}`,
    `Email: ${email || '-'}`,
    `Phone / WhatsApp: ${phone || '-'}`,
    `Project Category: ${finalSubject}`,
    budget ? `Expected Budget: ${budget}` : null,
    timeline ? `Project Timeline: ${timeline}` : null,
    '',
    `Project Requirements / Description:`,
    finalMessage || '-',
    '',
    `Received: ${new Date().toLocaleString('en-IN')}`
  ].filter((line) => line !== null).join('\n');

  sendContactAlert(
    `New enquiry from ${name}${company ? ` (${company})` : ''}`,
    details
  ).catch((err) => {
    console.error('Contact email notification error:', err?.message || err);
  });
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
