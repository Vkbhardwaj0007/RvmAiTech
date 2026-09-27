import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function TeamDetail() {
  const { slug } = useParams();
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { client.get(`/team/${slug}`).then((r) => setM(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found')); }, [slug]);
  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/leadership" className="card-link">← Back</Link></div></section>;
  if (!m) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;
  return (
    <>
      <PageHero kicker="About Us · Leadership" title={m.name} sub={m.role} />
      <section><div className="wrap">
        <div className="pd-crumb"><Link to="/leadership">Our Leadership</Link> <span>/</span> <b>{m.name}</b></div>
        <div className="member">
          <div className="member-photo">
            {m.photo ? <img src={m.photo} alt={m.name} /> : <div className="lead-ph">{(m.name || '?').slice(0, 1)}</div>}
            <div className="member-social">
              {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ justifyContent: 'center' }}>LinkedIn</a>}
              {m.email && <a href={`mailto:${m.email}`} className="btn" style={{ justifyContent: 'center', border: '2px solid var(--line)', color: 'var(--navy)' }}>Email</a>}
            </div>
          </div>
          <div className="member-body">
            <div className="member-role">{m.role}</div>
            {m.bio && <p className="member-lead">{m.bio}</p>}
            {m.details && <div className="post-body">{String(m.details).split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>}
            <Link to="/contact" className="btn btn-primary" style={{ marginTop: 10 }}>Get in touch</Link>
          </div>
        </div>
      </div></section>
    </>
  );
}
