const fs = require('fs');
const Application = require('../models/Application');
const { sendContactAlert } = require('../utils/mailer');
const { publicUrlFor } = require('../lib/publicUrl');

const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));

// multer saves the file before validation runs — drop it again if the form is rejected
function reject(req, res, message) {
  if (req.file) fs.unlink(req.file.path, () => {});
  return res.status(400).json({ message });
}

async function submit(req, res) {
  const b = req.body || {};
  const required = ['name', 'email', 'phone', 'qualification'];
  for (const k of required) if (!String(b[k] || '').trim()) return reject(req, res, `${k} is required`);
  if (!isEmail(b.email)) return reject(req, res, 'Enter a valid email');
  if (!req.file) return reject(req, res, 'Resume (PDF/DOC/DOCX) is required');

  // Built through publicUrl: a bare req.get('host') is attacker-controlled,
  // and a resume link stored in the CMS pointing at someone else's domain is
  // exactly the kind of thing an admin would click in good faith.
  const resumeUrl = publicUrlFor(req, `/uploads/resumes/${req.file.filename}`);
  const doc = await Application.create({
    name: b.name, email: b.email, phone: b.phone,
    position: b.position || 'General application',
    opening: b.opening || undefined,
    qualification: b.qualification,
    experienceYears: b.experienceYears, currentCompany: b.currentCompany, currentDesignation: b.currentDesignation,
    currentSalary: b.currentSalary, expectedSalary: b.expectedSalary, noticePeriod: b.noticePeriod,
    location: b.location, linkedin: b.linkedin, coverNote: b.coverNote,
    resumeUrl, resumeName: req.file.originalname,
  });

  sendContactAlert(
    `New job application — ${doc.position} — ${doc.name}`,
    [
      `Position: ${doc.position}`,
      `Name: ${doc.name}`, `Email: ${doc.email}`, `Phone: ${doc.phone}`,
      `Qualification: ${doc.qualification}`,
      `Experience: ${doc.experienceYears || '-'} yrs`,
      `Current company: ${doc.currentCompany || '-'} (${doc.currentDesignation || '-'})`,
      `Current salary: ${doc.currentSalary || '-'}`, `Expected salary: ${doc.expectedSalary || '-'}`,
      `Notice period: ${doc.noticePeriod || '-'}`, `Location: ${doc.location || '-'}`,
      `LinkedIn/Portfolio: ${doc.linkedin || '-'}`,
      '', `Note:\n${doc.coverNote || '-'}`, '', `Resume: ${resumeUrl}`,
      '', `Received: ${new Date().toLocaleString('en-IN')}`,
    ].join('\n')
  ).catch(() => {});

  // Real-time Webhook forward to RvmAiTech HRMS / Business Suite (https://erp-rvmaitech.onrender.com/api/careers/apply)
  const hrmsCareersUrl =
    process.env.HRMS_CAREERS_URL ||
    'https://erp-rvmaitech.onrender.com/api/careers/apply';

  const parseSalaryNumber = (val) => {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (!val) return 0;
    const nums = (String(val).replace(/,/g, '').match(/\d+/g) || [])
      .map(Number)
      .filter((n) => Number.isFinite(n));
    return nums.length ? Math.max(...nums) : 0;
  };

  const expStr = doc.experienceYears
    ? `${doc.experienceYears} Years`
    : 'Fresher / Not specified';

  const hrmsNotes = [
    doc.qualification ? `Qualification: ${doc.qualification}` : null,
    doc.currentCompany ? `Current: ${doc.currentCompany}${doc.currentDesignation ? ` (${doc.currentDesignation})` : ''}` : null,
    doc.currentSalary ? `Current CTC: ${doc.currentSalary}` : null,
    doc.noticePeriod ? `Notice: ${doc.noticePeriod}` : null,
    doc.linkedin ? `LinkedIn: ${doc.linkedin}` : null,
    resumeUrl ? `Resume: ${resumeUrl}` : null,
    doc.coverNote || null,
  ]
    .filter(Boolean)
    .join(' | ');

  let hrmsSynced = false;
  try {
    const hrmsRes = await fetch(hrmsCareersUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        role: doc.position || 'General application',
        dept: b.dept || 'R&D / Engineering',
        experience: expStr,
        expectedSalary: parseSalaryNumber(doc.expectedSalary),
        source: 'Website Careers Page',
        address: doc.location || 'Not specified',
        notes: hrmsNotes,
      }),
    });
    hrmsSynced = !!(hrmsRes && hrmsRes.ok);
  } catch (err) {
    console.warn('HRMS careers webhook error:', err?.message || err);
  }

  res.status(201).json({ ok: true, id: doc._id, hrmsSynced });
}

async function list(req, res) {
  const items = await Application.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json({ count: items.length, items });
}

async function update(req, res) {
  const patch = {};
  if (req.body.status) patch.status = req.body.status;
  if (typeof req.body.read === 'boolean') patch.read = req.body.read;
  const doc = await Application.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true, item: doc });
}

async function remove(req, res) {
  await Application.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}

module.exports = { submit, list, update, remove };
