import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, MessageSquare, Building2, MapPin, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import client from '../api/client';
import { useSite } from '../api/SiteContext';

const AUDIT_TYPES = [
  'Factory / Plant Automation & OEE Audit (MDMS & PLC)',
  'Machine Vision & Quality Inspection Audit',
  'Robotics & Assembly Line Feasibility Audit',
  'Industrial IoT, Sensors & Edge Datalogging Audit',
  'Custom Software, ERP & Digital Workflow Audit',
  'Smart Parking / Building Automation Site Survey',
  'Complete End-to-End Company Technical Audit',
];

const INDUSTRIES = [
  'Automotive & Auto Components',
  'Textile, Garments & Fabric',
  'Packaging, Printing & Labelling',
  'Electronics, PCB & Semiconductor',
  'FMCG, Food & Beverage',
  'Pharma, Healthcare & Medical Devices',
  'Heavy Engineering, Metal & Steel',
  'Commercial Real Estate / Smart Parking',
  'Education / Hospitality (ERP & PMS)',
  'Other Industry',
];

export function openAuditModal(initialAuditType = '') {
  window.dispatchEvent(new CustomEvent('open-audit-modal', { detail: { auditType: initialAuditType } }));
}

export default function AuditBookingModal({ isOpen: propOpen, onClose: propOnClose, initialAuditType = '' }) {
  const { content } = useSite();
  const wa = content?.social?.whatsapp || '7052050656';
  const cleanWa = wa.replace(/[^0-9]/g, '');
  const waNumber = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = propOpen !== undefined ? propOpen : internalOpen;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    location: '',
    industry: INDUSTRIES[0],
    auditType: initialAuditType || AUDIT_TYPES[0],
    auditMode: 'On-Site Company / Plant Visit',
    scale: '',
    date: '',
    challenges: '',
  });

  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.auditType) {
        setForm((f) => ({ ...f, auditType: e.detail.auditType }));
      }
      setSuccess(false);
      setErr('');
      setInternalOpen(true);
    };
    window.addEventListener('open-audit-modal', handler);
    return () => window.removeEventListener('open-audit-modal', handler);
  }, []);

  useEffect(() => {
    if (initialAuditType) {
      setForm((f) => ({ ...f, auditType: initialAuditType }));
    }
  }, [initialAuditType]);

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setInternalOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setErr('');
    }, 200);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.company.trim()) {
      setErr('Please enter your Name, Company Name, and Phone/WhatsApp number.');
      return;
    }
    setBusy(true);
    setErr('');

    try {
      await client.post('/contact', {
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim() || '',
        phone: form.phone.trim(),
        subject: `[COMPANY AUDIT] ${form.auditType} — ${form.company.trim()}`,
        message: [
          `COMPANY AUDIT BOOKING DETAILS:`,
          `- Company / Plant: ${form.company.trim()}`,
          `- Audit Scope: ${form.auditType}`,
          `- Audit Mode: ${form.auditMode}`,
          `- Industry: ${form.industry}`,
          `- Location / City: ${form.location || 'Not specified'}`,
          `- Facility Scale / Machines: ${form.scale || 'Not specified'}`,
          `- Preferred Date: ${form.date || 'Earliest available slot'}`,
          `- Key Challenges / Goals: ${form.challenges || 'General automation & efficiency assessment'}`,
        ].join('\n'),
      });
      setSuccess(true);
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Could not submit right now. Please try again or connect via WhatsApp.');
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello RvmAiTech Team! I would like to book a *Company Automation Audit*.\n\n` +
      `🏢 *Company:* ${form.company || 'N/A'}\n` +
      `🔍 *Audit Type:* ${form.auditType}\n` +
      `📍 *Mode:* ${form.auditMode} (${form.location || 'India'})\n` +
      `🏭 *Industry:* ${form.industry}\n` +
      `👤 *Contact:* ${form.name || 'Client'} (${form.phone || 'N/A'})\n` +
      `📅 *Preferred Date:* ${form.date || 'Earliest available'}`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 20, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 22,
          maxWidth: 680,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 32px 90px -20px rgba(0, 0, 0, 0.65)',
          position: 'relative',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d2649 0%, #1351b4 100%)',
            padding: '26px 32px 24px',
            color: '#ffffff',
            position: 'relative',
            borderBottom: '3px solid #f47b20',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f47b20'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'; }}
            aria-label="Close"
          >
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 700 }}>×</span>
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244, 123, 32, 0.2)', border: '1px solid rgba(244, 123, 32, 0.55)', color: '#ffd5ad', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            <Sparkles size={13} /> Free Technical &amp; ROI Assessment
          </div>
          <h3 style={{ color: '#ffffff', fontSize: 'clamp(22px, 3vw, 26px)', margin: '0 0 6px', fontWeight: 800 }}>
            Book a Company Automation Audit
          </h3>
          <p style={{ color: '#d3e0f4', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Get a complete evaluation of your machines, production lines, or software workflows by RvmAiTech engineers — with a clear automation roadmap &amp; ROI report.
          </p>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#eafaf1', color: '#107e44', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <CheckCircle2 size={38} />
              </div>
              <h3 style={{ color: '#0d2649', fontSize: 24, marginBottom: 10, fontWeight: 800 }}>
                Company Audit Request Confirmed!
              </h3>
              <p style={{ color: '#475569', fontSize: 15.5, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>
                Thank you, <b>{form.name}</b>! Our senior automation engineers have received the audit request for <b>{form.company}</b> and will reach out on <b>{form.phone}</b> to finalize the schedule.
              </p>

              <div style={{ background: '#f4f8fd', border: '1px solid #d6e2f0', borderRadius: 12, padding: '14px 18px', maxWidth: 460, margin: '0 auto 24px', textAlign: 'left', fontSize: 13.5, color: '#33475b' }}>
                <div><b>Audit Scope:</b> {form.auditType}</div>
                <div style={{ marginTop: 4 }}><b>Format:</b> {form.auditMode}</div>
                {form.location && <div style={{ marginTop: 4 }}><b>Location:</b> {form.location}</div>}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  className="btn btn-primary"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <MessageSquare size={17} /> Share Audit Details on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: '#0d2649',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 28px',
                    fontSize: 14.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {err && (
                <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
                  {err}
                </div>
              )}

              {/* Audit Scope */}
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#0d2649', marginBottom: 6 }}>
                  What would you like us to Audit? *
                </label>
                <select
                  value={form.auditType}
                  onChange={(e) => setForm({ ...form, auditType: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 14.5, background: '#f8fafc', color: '#0d2649', fontWeight: 600 }}
                >
                  {AUDIT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Audit Format */}
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#0d2649', marginBottom: 6 }}>
                  Preferred Audit Mode *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['On-Site Company / Plant Visit', 'Online Technical Audit (Video Call)'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, auditMode: mode })}
                      style={{
                        padding: '11px 12px',
                        borderRadius: 9,
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: form.auditMode === mode ? '2px solid #1351b4' : '1px solid #cbd5e1',
                        background: form.auditMode === mode ? '#eef4ff' : '#ffffff',
                        color: form.auditMode === mode ? '#1351b4' : '#475569',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {mode.includes('On-Site') ? '🏭 ' : '💻 '} {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Name & Industry */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharat Precision Pvt Ltd"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Industry / Sector
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#ffffff', color: '#0d2649' }}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Contact Person Name &amp; Role *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Verma (Plant Head)"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Email & City/Location */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Plant / Office City &amp; State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faridabad, Haryana"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Facility Scale & Preferred Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    No. of Machines / Lines (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 CNC / PLC Machines, 2 Assembly Lines"
                    value={form.scale}
                    onChange={(e) => setForm({ ...form, scale: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Preferred Audit Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Challenges / Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                  Current Challenges or What You Want to Improve (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unplanned machine downtime, manual quality inspection errors, lack of live shift OEE reports..."
                  value={form.challenges}
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-3d-orange"
                  style={{ flex: 1, minWidth: 220, padding: '14px 18px', fontSize: 15.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {busy ? 'Scheduling Audit…' : 'Book Company Audit Now →'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 18px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                  title="Book Audit directly via WhatsApp"
                >
                  <MessageSquare size={17} /> WhatsApp
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

