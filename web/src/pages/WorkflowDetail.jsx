import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function WorkflowDetail() {
  const { slug } = useParams();
  const [w, setW] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    client.get(`/workflow/${slug}`).then((r) => setW(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [slug]);

  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/" className="card-link">← Home</Link></div></section>;
  if (!w) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  return (
    <>
      <PageHero kicker="Our Workflow" title={w.title} sub={w.summary} />
      <section>
        <div className="wrap">
          <div className="pd-crumb"><Link to="/#workflow">Our Workflow</Link> <span>/</span> <b>{w.title}</b></div>

          {w.intro && <p className="wf-intro">{w.intro}</p>}

          <div className="wf-groups">
            {(w.groups || []).map((g, i) => (
              <div className="wf-group" key={i}>
                <h3>{g.heading}</h3>
                <div className="pd-feat">
                  {g.items.map((it, k) => (
                    <div className="pd-feat-item" key={k}><span className="pd-check">✓</span>{it}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {w.example && (
            <div className="wf-box example">
              <span className="wf-box-label">Example</span>
              <p>{w.example}</p>
            </div>
          )}
          {w.output && (
            <div className="wf-box output">
              <span className="wf-box-label">Output</span>
              <p>{w.output}</p>
            </div>
          )}

          <div className="pd-cta">
            <Link to="/contact" className="btn btn-primary">Talk to us about this</Link>
            <Link to="/#workflow" className="btn" style={{ border: '2px solid var(--line)', color: 'var(--navy)' }}>Full workflow</Link>
          </div>
        </div>
      </section>
    </>
  );
}
