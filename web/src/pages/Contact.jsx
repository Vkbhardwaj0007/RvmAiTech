import { useState } from 'react';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import { useSite } from '../api/SiteContext';

export default function Contact() {
  const { content } = useSite();
  const info = content?.contact || {};
  const email = info.email || 'info@rvmaitech.com';
  const phone = info.phone || '+91 00000 00000';
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function setF(patch) { setForm((f) => ({ ...f, ...patch })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name) { setErr('Naam zaroori hai'); return; }
    setBusy(true); setErr('');
    try {
      await client.post('/contact', form);
      setSent(true);
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Bhej nahi paye — thodi der baad try karo.');
    } finally { setBusy(false); }
  }

  return (
    <>
      <PageHero kicker="Get in touch" title="Contact us" sub="Tell us the process you want to automate." />
      <section><div className="wrap contact-grid">
        <div className="contact-info">
          <div className="cinfo"><span className="ci-ico">✉</span><div><b>Email</b><br /><span>{email}</span></div></div>
          <div className="cinfo"><span className="ci-ico">☎</span><div><b>Phone</b><br /><span>{phone}</span></div></div>
          {info.address && <div className="cinfo"><span className="ci-ico">⚑</span><div><b>Address</b><br /><span>{info.address}</span></div></div>}
          <div className="cinfo"><span className="ci-ico">★</span><div><b>Partner</b><br /><span>{info.tagline || 'Your partner in intelligent automation'}</span></div></div>
        </div>

        <div className="contact-form">
          {sent ? (
            <div className="sent-box">
              <div className="sent-tick">✓</div>
              <h3>Thanks — message mil gaya!</h3>
              <p className="muted">Hamari team jaldi contact karegi.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {err && <div className="form-err">{err}</div>}
              <div className="f-grid">
                <label>Name<input value={form.name} onChange={(e) => setF({ name: e.target.value })} /></label>
                <label>Email<input type="email" value={form.email} onChange={(e) => setF({ email: e.target.value })} /></label>
                <label>Phone<input value={form.phone} onChange={(e) => setF({ phone: e.target.value })} /></label>
                <label>Subject<input value={form.subject} onChange={(e) => setF({ subject: e.target.value })} /></label>
              </div>
              <label className="full">Message<textarea rows="5" value={form.message} onChange={(e) => setF({ message: e.target.value })} /></label>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </div>
      </div></section>
    </>
  );
}
