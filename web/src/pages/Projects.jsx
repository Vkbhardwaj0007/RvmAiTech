import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
export default function Projects() {
  const [items, setItems] = useState([]);
  useEffect(() => { client.get('/projects').then((r) => setItems(r.data.items || [])).catch(() => {}); }, []);
  return (
    <>
      <PageHero kicker="Our work" title="Projects" sub="Automation we've delivered on real factory floors." />
      <section><div className="wrap"><div className="grid-3">
        {items.map((p) => {
          const hasVideo = p.video || p.videoUrl;
          return (
            <Link className="card link" to={`/projects/${p.slug}`} key={p._id}>
              {p.image && <div className="proj-thumb"><img className="card-img" src={p.image} alt="" />{hasVideo && <span className="play">▶</span>}</div>}
              {!p.image && hasVideo && <div className="proj-thumb novideo"><span className="play">▶</span></div>}
              {p.year && <div className="prod-cat">{p.year}</div>}
              <h3>{p.title}</h3>
              {p.client && <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{p.client}</div>}
              <p>{p.summary}</p>
              <span className="card-link">{hasVideo ? 'Watch video →' : 'View project →'}</span>
            </Link>
          );
        })}
        {items.length === 0 && <p className="muted">No projects added yet.</p>}
      </div></div></section>
    </>
  );
}
