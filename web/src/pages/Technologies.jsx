import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import { iconFor } from './Home';

export default function Technologies() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    client.get('/technologies').then((r) => setItems(r.data.items || [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHero kicker="Our core" title="Technologies" sub="Robotics, machine vision and machine intelligence." />
      <section style={{ padding: '60px 0 90px', background: '#f8fafc' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">Core Engineering Domains</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0d2649', marginTop: 8 }}>
              Robotics, Vision &amp; Machine Intelligence
            </h2>
            <p style={{ color: '#52637a', fontSize: 16.5, maxWidth: 660, margin: '12px auto 0' }}>
              Every automation system combines high-precision robotics, high-speed optical inspection, and edge machine learning models.
            </p>
          </div>

          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {items.map((t) => {
              const lines = (t.summary || '').split('\n').map((l) => l.trim()).filter(Boolean);
              const mainLead = lines[0] || t.summary || '';
              const bulletPoints = lines.length > 1 ? lines.slice(1) : (
                t.title.toLowerCase().includes('robot')
                  ? ['Material handling & automated assembly', 'Pick & place with vision guidance', 'Robotic welding & machine tending']
                  : t.title.toLowerCase().includes('vision')
                  ? ['High-speed defect detection', 'Dimension checking & surface inspection', 'OCR, Barcode & OK/NG classification']
                  : ['Edge machine telemetry & OEE', 'Predictive failure anomaly detection', 'Self-optimizing automated control']
              );

              return (
                <Link className="cap link card-dynamic hover-blue" to={`/technologies/${t.slug}`} key={t._id}>
                  <div>
                    <div className="cap-ico card-icon-wrap">{iconFor(t.icon)}</div>
                    <h3>{t.title}</h3>
                    <p style={{ fontWeight: 500 }}>{mainLead}</p>
                    {bulletPoints.length > 0 && (
                      <ul className="tick" style={{ margin: '14px 0 24px', paddingLeft: 0 }}>
                        {bulletPoints.map((pt, k) => (
                          <li key={k} style={{ fontSize: 14, marginBottom: 8 }}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="card-link card-action-link" style={{ marginTop: 'auto' }}>
                    Explore Capabilities →
                  </span>
                </Link>
              );
            })}
            {items.length === 0 && <p className="muted">No technologies yet.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
