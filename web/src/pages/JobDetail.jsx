import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

const List = ({ title, items }) => (items?.length ? (
  <div className="pd-block">
    <h3>{title}</h3>
    <ul className="tick job-list">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
  </div>
) : null);

export default function JobDetail() {
  const { slug } = useParams();
  const [j, setJ] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    client.get(`/openings/${slug}`).then((r) => setJ(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [slug]);

  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/careers" className="card-link">← Back to careers</Link></div></section>;
  if (!j) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  const applyTo = `/careers/apply?job=${encodeURIComponent(j.slug)}`;
  const paras = (j.description || '').split(/\n{2,}|\n/).map((x) => x.trim()).filter(Boolean);

  return (
    <>
      <PageHero kicker={j.department || 'Careers'} title={j.title} sub={j.summary || `${j.type} · ${j.location}`} />
      <section><div className="wrap job-detail">
        <div className="pd-crumb"><Link to="/careers">Careers</Link> <span>/</span> <b>{j.title}</b></div>

        <div className="job-facts">
          <div className="pd-spec"><span>Type</span><b>{j.type || '—'}</b></div>
          <div className="pd-spec"><span>Location</span><b>{j.location || '—'}</b></div>
          {j.experience && <div className="pd-spec"><span>Experience</span><b>{j.experience}</b></div>}
          {j.salary && <div className="pd-spec"><span>Salary</span><b>{j.salary}</b></div>}
          {j.positions > 0 && <div className="pd-spec"><span>Openings</span><b>{j.positions}</b></div>}
          {j.department && <div className="pd-spec"><span>Department</span><b>{j.department}</b></div>}
        </div>

        <div className="job-body">
          <div>
            {paras.length > 0 && (
              <div className="pd-block">
                <h3>About the role</h3>
                {paras.map((p, i) => <p className="muted" key={i}>{p}</p>)}
              </div>
            )}
            <List title="Responsibilities" items={j.responsibilities} />
            <List title="Requirements" items={j.requirements} />
            <List title="What we offer" items={j.benefits} />
          </div>
          <aside className="job-side">
            <div className="job-side-card">
              <h3>Interested?</h3>
              <p className="muted">Apply with your resume — it takes 2 minutes.</p>
              <Link to={applyTo} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>Apply for this role</Link>
              {j.skills?.length > 0 && (
                <>
                  <div className="job-side-label">Skills</div>
                  <div className="plc-strip" style={{ marginTop: 6 }}>{j.skills.map((s) => <span className="plc" key={s}>{s}</span>)}</div>
                </>
              )}
              <Link to="/careers" className="card-link" style={{ display: 'inline-block', marginTop: 16 }}>← All openings</Link>
            </div>
          </aside>
        </div>

        <div className="pd-cta">
          <Link to={applyTo} className="btn btn-primary">Apply for {j.title}</Link>
          <Link to="/careers" className="btn btn-ghost dark">Back to careers</Link>
        </div>
      </div></section>
    </>
  );
}
