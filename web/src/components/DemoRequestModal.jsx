import { useState } from 'react';
import { Calendar, Video, Building, Phone, Mail, User, CheckCircle2, MessageSquare } from 'lucide-react';
import client from '../api/client';
import { useSite } from '../api/SiteContext';

const PRODUCTS = [
  'MDMS (Machine Data Monitoring)',
  'Industrial Edge Datalogger',
  'Smart Parking Management System',
  'Smart Home Automation',
  'CampusCloud School ERP',
  'GrandStay Hotel & Resort PMS',
  'Custom Robotics & Vision Inspection',
];

export default function DemoRequestModal({ isOpen, onClose, initialProduct = '' }) {
  const { content } = useSite();
  const wa = content?.social?.whatsapp || '7052050656';
  const cleanWa = wa.replace(/[^0-9]/g, '');
  const waNumber = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    product: initialProduct || PRODUCTS[0],
    demoType: 'Online Demo (Google Meet)',
    date: '',
    message: '',
  });

  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setErr('Please provide your name and phone/WhatsApp number.');
      return;
    }
    setBusy(true);
    setErr('');

    try {
      await client.post('/contact', {
        name: form.name,
        email: form.email || 'not-provided@client.com',
        phone: form.phone,
        subject: `[DEMO REQUEST] ${form.product} (${form.demoType})`,
        message: `DEMO REQUEST DETAILS:\n- Product: ${form.product}\n- Mode: ${form.demoType}\n- Company: ${form.company || 'N/A'}\n- Preferred Date: ${form.date || 'Earliest available'}\n- Notes: ${form.message || 'None'}`,
      });
      setSuccess(true);
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Could not send request right now. You can connect via WhatsApp directly.');
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello RvmAiTech team! I would like to book a live demo for *${form.product}* (${form.demoType}).\nName: ${form.name || 'Client'}\nCompany: ${form.company || 'N/A'}\nPhone: ${form.phone || 'N/A'}`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 23, 46, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 620,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          padding: '36px 32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#0d2649',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(13, 38, 73, 0.25)',
            zIndex: 10,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f47b20'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0d2649'; }}
          aria-label="Close"
        >
          <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, display: 'block' }}>×</span>
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eafaf1', color: '#107e44', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ color: '#0d2649', fontSize: 24, marginBottom: 10, fontWeight: 800 }}>Demo Request Scheduled!</h3>
            <p style={{ color: '#55657d', fontSize: 16, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 24px' }}>
              Thank you! Our technical specialist will connect with you on <b>{form.phone}</b> to confirm your demo slot for <b>{form.product}</b>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="btn btn-primary"
                style={{ background: '#25D366', borderColor: '#25D366', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
              >
                <MessageSquare size={16} /> Instant WhatsApp Confirmation
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#0d2649',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 30px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(13, 38, 73, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f47b20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0d2649';
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f47b20', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Hands-On Session</span>
              <h3 style={{ color: '#0d2649', fontSize: 26, margin: '6px 0 8px', fontWeight: 800 }}>Schedule a Product Demo</h3>
              <p style={{ color: '#55657d', fontSize: 14.5, margin: 0 }}>
                Experience live machine data analytics, edge telemetry, or smart ERP workflows tailored to your operational requirements.
              </p>
            </div>

            {err && (
              <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16 }}>
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product Select */}
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0d2649', marginBottom: 6 }}>
                  Select Solution to Demo *
                </label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14.5, background: '#fcfdfe', color: '#0d2649' }}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Demo Mode */}
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: '#0d2649', marginBottom: 6 }}>
                  Preferred Demo Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {['Online Demo (Google Meet)', 'On-Site Plant Visit / Survey'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, demoType: mode })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: form.demoType === mode ? '2px solid #1351b4' : '1px solid #d0deef',
                        background: form.demoType === mode ? '#eef4ff' : '#ffffff',
                        color: form.demoType === mode ? '#1351b4' : '#52637a',
                        textAlign: 'center',
                      }}
                    >
                      {mode.includes('Online') ? '💻 ' : '🏭 '} {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Email & Company */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                    Company / Plant Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Auto Components"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14 }}
                  />
                </div>
              </div>

              {/* Preferred Date */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0d2649', marginBottom: 5 }}>
                  Preferred Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccd9ea', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: 15 }}
                >
                  {busy ? 'Booking Demo Slot…' : 'Confirm Live Demo Booking →'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDirect}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  title="Book directly on WhatsApp"
                >
                  <MessageSquare size={17} /> WhatsApp
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

