import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

const NOTICE = ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days', 'Serving notice'];
const EMPTY = {
  name: '', email: '', phone: '', position: '', opening: '',
  qualification: '', experienceYears: '', currentCompany: '', currentDesignation: '',
  currentSalary: '', expectedSalary: '', noticePeriod: '', location: '', linkedin: '', coverNote: '',
};

export default function Apply() {
  const [jobs, setJobs] = useState([]);
  const [params] = useSearchParams();
  const [form, setForm] = useState(EMPTY);
  const [resume, setResume] = useState(null);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { client.get('/openings').then((r) => setJobs(r.data.items || [])).catch(() => {}); }, []);

  // /careers/apply?job=<slug> preselects the position
  useEffect(() => {
    const slug = params.get('job');
    if (!slug || !jobs.length) return;
    const j = jobs.find((x) => x.slug === slug);
    if (j) setForm((f) => ({ ...f, position: j.title, opening: j._id }));
  }, [params, jobs]);

  function setF(patch) { setForm((f) => ({ ...f, ...patch })); }
  function onPosition(e) {
    const j = jobs.find((x) => x._id === e.target.value);
    setF(j ? { position: j.title, opening: j._id } : { position: e.target.value === 'other' ? 'Other' : 'General application', opening: '' });
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) { setResume(null); return; }
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { setErr('Resume must be a PDF, DOC or DOCX file'); e.target.value = ''; setResume(null); return; }
    if (f.size > 5 * 1024 * 1024) { setErr('Resume must be under 5 MB'); e.target.value = ''; setResume(null); return; }
    setErr(''); setResume(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setErr('Full name is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return setErr('Enter a valid email');
    if (!form.phone.trim()) return setErr('Phone number is required');
    if (!form.qualification.trim()) return setErr('Highest qualification is required');
    if (!resume) return setErr('Please upload your resume (PDF/DOC/DOCX)');
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (!form.position) fd.set('position', 'General application');
      fd.append('resume', resume);
      await client.post('/applications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSent(true);
      setForm(EMPTY); setResume(null); if (fileRef.current) fileRef.current.value = '';
    } catch (ex) {
      setErr(ex?.response?.data?.message || 'Could not submit — please try again in a moment.');
    } finally { setBusy(false); }
  }

  const job = jobs.find((j) => j._id === form.opening);
  const title = form.position && form.position !== 'General application' ? `Apply for ${form.position}` : 'Job application';

  return (
    <>
      <PageHero kicker="Careers" title={title} sub={job ? `${job.type} · ${job.location}` : 'Send us your profile — we hire for automation, vision and software roles.'} />
      {/* APPLICATION FORM */}
      <section className="soft" id="apply" ref={formRef}><div className="wrap apply-wrap">
        <div className="pd-crumb"><Link to="/careers">Careers</Link> <span>/</span> <b>Apply</b></div>
        <div className="sec-head">
          <div className="sec-kicker">Application form</div>
          <h2>Your details</h2>
          <p>Fill in your details and upload your resume. Fields marked * are required.</p>
        </div>

        <div className="contact-form apply-form">
          {sent ? (
            <div className="sent-box">
              <div className="sent-tick">✓</div>
              <h3>Application received!</h3>
              <p className="muted">Thanks — our team will review your profile and get back to you.</p>
              <div className="hero-cta" style={{ marginTop: 16 }}>
                <Link to="/careers" className="btn btn-primary">Back to careers</Link>
                <button type="button" className="btn btn-ghost dark" onClick={() => setSent(false)}>Submit another application</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {err && <div className="form-err">{err}</div>}

              <h4 className="f-sec">Personal details</h4>
              <div className="f-grid">
                <label>Full name *<input value={form.name} onChange={(e) => setF({ name: e.target.value })} placeholder="Your full name" /></label>
                <label>Email *<input type="email" value={form.email} onChange={(e) => setF({ email: e.target.value })} placeholder="you@example.com" /></label>
                <label>Phone / WhatsApp *<input value={form.phone} onChange={(e) => setF({ phone: e.target.value })} placeholder="+91 …" /></label>
                <label>Current location<input value={form.location} onChange={(e) => setF({ location: e.target.value })} placeholder="City, State" /></label>
              </div>

              <h4 className="f-sec">Position &amp; qualification</h4>
              <div className="f-grid">
                <label>Position applying for
                  <select value={form.opening || (form.position === 'Other' ? 'other' : '')} onChange={onPosition}>
                    <option value="">General application</option>
                    {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}{j.location ? ` — ${j.location}` : ''}</option>)}
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>Highest qualification *<input value={form.qualification} onChange={(e) => setF({ qualification: e.target.value })} placeholder="e.g. B.Tech (Electronics), Diploma, MCA" /></label>
                <label>Total experience (years)<input value={form.experienceYears} onChange={(e) => setF({ experienceYears: e.target.value })} placeholder="e.g. 3.5 (0 for fresher)" /></label>
                <label>LinkedIn / portfolio (optional)<input value={form.linkedin} onChange={(e) => setF({ linkedin: e.target.value })} placeholder="https://" /></label>
              </div>

              <h4 className="f-sec">Current employment</h4>
              <div className="f-grid">
                <label>Current company<input value={form.currentCompany} onChange={(e) => setF({ currentCompany: e.target.value })} placeholder="Company name (or 'Fresher')" /></label>
                <label>Current designation<input value={form.currentDesignation} onChange={(e) => setF({ currentDesignation: e.target.value })} placeholder="e.g. Automation Engineer" /></label>
                <label>Current salary (CTC)<input value={form.currentSalary} onChange={(e) => setF({ currentSalary: e.target.value })} placeholder="e.g. ₹4.5 LPA" /></label>
                <label>Expected salary (CTC)<input value={form.expectedSalary} onChange={(e) => setF({ expectedSalary: e.target.value })} placeholder="e.g. ₹6 LPA" /></label>
                <label>Notice period
                  <select value={form.noticePeriod} onChange={(e) => setF({ noticePeriod: e.target.value })}>
                    <option value="">Select</option>
                    {NOTICE.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label>Resume (PDF / DOC / DOCX, max 5 MB) *
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFile} />
                  {resume && <span className="file-name">{resume.name} · {(resume.size / 1024).toFixed(0)} KB</span>}
                </label>
              </div>

              <label className="full">Why should we hire you? (optional)<textarea rows="4" value={form.coverNote} onChange={(e) => setF({ coverNote: e.target.value })} placeholder="Key skills, projects, PLC/vision/automation experience…" /></label>

              <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
              <p className="muted f-note">Your details are shared only with the RvmAiTech hiring team.</p>
            </form>
          )}
        </div>
      </div></section>
    </>
  );
}
