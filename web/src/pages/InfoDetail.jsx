import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

// kind: 'services' | 'technologies'
export default function InfoDetail({ kind }) {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const back = kind === 'services' ? '/services' : '/technologies';
  const kicker = kind === 'services' ? 'Our Services' : 'Technologies';

  useEffect(() => {
    client.get(`/${kind}/${slug}`).then((r) => setD(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [kind, slug]);

  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to={back} className="card-link">← Back</Link></div></section>;
  if (!d) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  return (
    <>
      <PageHero kicker={kicker} title={d.title} sub={d.summary} />
      <section>
        <div className="wrap">
          <div className="pd-crumb"><Link to={back}>{kicker}</Link> <span>/</span> <b>{d.title}</b></div>
          {d.image && <img className="pd-cover" src={d.image} alt="" />}
          {d.intro && <p className="wf-intro">{d.intro}</p>}
          {d.description && !d.intro && <p className="wf-intro">{d.description}</p>}

          <div className="wf-groups">
            {(d.groups || []).map((g, i) => (
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

          <div className="pd-cta">
            <Link to="/contact" className="btn btn-primary">Talk to us about {d.title}</Link>
            <Link to={back} className="btn" style={{ border: '2px solid var(--line)', color: 'var(--navy)' }}>All {kicker.toLowerCase()}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
