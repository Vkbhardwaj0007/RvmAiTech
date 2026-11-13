import { toPoint } from '../components/SplitSection';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import { iconFor } from './Home';
export default function Services() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    client.get('/services').then((r) => setItems(r.data.items || [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHero kicker="What we do" title="Our Services" sub="Automation solutions across process, home and industry." />
      <section style={{ padding: '60px 0 90px', background: '#f8fafc' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">End-to-End Execution</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0d2649', marginTop: 8 }}>
              Engineering Services Built for the Shop Floor
            </h2>
            <p style={{ color: '#52637a', fontSize: 16.5, maxWidth: 660, margin: '12px auto 0' }}>
              From initial process analysis to complete factory deployment, PLC integration, and 24/7 telemetry monitoring.
            </p>
          </div>
          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {items.map((s) => (
              <Link className="card link card-dynamic hover-blue" to={`/services/${s.slug}`} key={s._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-ico card-icon-wrap">{iconFor(s.icon)}</div>
                  <h3>{s.title}</h3>
                  <p>{s.summary}</p>
                  {s.features?.length > 0 && (
                    <ul className="tick" style={{ margin: '16px 0 24px' }}>
                      {s.features.map((f, k) => <li key={k}>{toPoint(f).text}</li>)}
                    </ul>
                  )}
                </div>
                <span className="card-link card-action-link" style={{ marginTop: 'auto' }}>
                  Learn more →
                </span>
              </Link>
            ))}
            {items.length === 0 && <p className="muted">No services yet.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
