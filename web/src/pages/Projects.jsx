import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function Projects() {
  const [items, setItems] = useState([]);
  useEffect(() => { client.get('/projects').then((r) => setItems(r.data.items || [])).catch(() => {}); }, []);
  return (
    <>
      <PageHero kicker="Verified Deployments" title="Engineering Projects" sub="Real machines. Real telemetry. Live automation running on customer shop floors." />
      <section><div className="wrap"><div className="grid-3">
        {items.map((p) => {
          const hasVideo = p.video || p.videoUrl;
          const status = p.status || 'Live in Production';
          return (
            <Link className="card link" to={`/projects/${p.slug}`} key={p._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {p.image && <div className="proj-thumb"><img className="card-img" src={p.image} alt="" style={{ height: 200, width: '100%', objectFit: 'cover' }} />{hasVideo && <span className="play">▶</span>}</div>}
                {!p.image && hasVideo && <div className="proj-thumb novideo" style={{ height: 200 }}><span className="play">▶</span></div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
                  <div className="prod-cat" style={{ margin: 0 }}>{p.year || '2026'}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#107e44', background: '#eafaf1', padding: '3px 8px', borderRadius: 4 }}>
                    {status}
                  </span>
                </div>

                <h3 style={{ fontSize: 20, marginBottom: 6 }}>{p.title}</h3>
                {p.client && <div style={{ fontSize: 13, fontWeight: 600, color: '#1351b4', marginBottom: 8 }}>Client: {p.client}</div>}
                <p style={{ fontSize: 14.5, color: '#4a5b73', lineHeight: 1.6 }}>{p.summary || p.problemStatement || 'Automated data monitoring and machine telemetry system.'}</p>
              </div>

              <div style={{ marginTop: 16, borderTop: '1px solid #eef3fa', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-link" style={{ margin: 0, fontWeight: 600 }}>{hasVideo ? 'Watch Demo & Case Study →' : 'View Project Details →'}</span>
              </div>
            </Link>
          );
        })}
        {items.length === 0 && <p className="muted">No projects added yet.</p>}
      </div></div></section>
    </>
  );
}
