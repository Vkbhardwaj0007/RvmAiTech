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

  // Real-time Webhook forward to RvmAiTech ERP & CRM Dashboard (https://erp-rvmaitech.onrender.com/api/inquiries)
  const crmWebhookUrl =
    process.env.BIZTRACK_CRM_URL ||
    process.env.CRM_WEBHOOK_URL ||
    'https://erp-rvmaitech.onrender.com/api/inquiries';

  // Extract numeric budget value (e.g. "₹50,000 – ₹1,50,000" -> 150000, or 350000 -> 350000)
  const parseNumericBudget = (val) => {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (!val) return 0;
    const matches = String(val).replace(/,/g, '').match(/\d+/g);
    if (!matches || !matches.length) return 0;
    const nums = matches.map(Number).filter((n) => Number.isFinite(n));
    return nums.length ? Math.max(...nums) : 0;
  };

  const numericBudget = parseNumericBudget(budget);
  const crmMessage = [
    finalMessage || `Enquiry for ${finalSubject}`,
    budget ? `Budget Range: ${budget}` : null,
    timeline ? `Timeline: ${timeline}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  let crmSynced = false;
  try {
    const crmRes = await fetch(crmWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Customer',
        phone: phone || 'Not provided',
        email: email || 'client@rvmaitech.com',
        company: company || 'Website Lead',
        service: finalSubject || 'Industrial Automation & Vision',
        message: crmMessage,
        budget: numericBudget,
        source: req.body.source || 'Website Landing Page',
      }),
    });
    crmSynced = !!(crmRes && crmRes.ok);
  } catch (err) {
    console.warn('CRM webhook error:', err?.message || err);
  }

  res.status(201).json({ ok: true, id: m._id, crmSynced });
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
