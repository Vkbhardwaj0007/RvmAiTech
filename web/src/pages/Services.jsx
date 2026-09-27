import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import { iconFor } from './Home';
export default function Services() {
  const [items, setItems] = useState([]);
  useEffect(() => { client.get('/services').then((r) => setItems(r.data.items || [])).catch(() => {}); }, []);
  return (
    <>
      <PageHero kicker="What we do" title="Our Services" sub="Automation solutions across process, home and industry." />
      <section><div className="wrap"><div className="grid-3">
        {items.map((s) => (
          <Link className="card link" to={`/services/${s.slug}`} key={s._id}>
            <div className="card-ico">{iconFor(s.icon)}</div>
            <h3>{s.title}</h3><p>{s.summary}</p>
            {s.features?.length > 0 && <ul className="tick">{s.features.map((f, k) => <li key={k}>{f}</li>)}</ul>}
            <span className="card-link">Learn more →</span>
          </Link>
        ))}
        {items.length === 0 && <p className="muted">No services yet.</p>}
      </div></div></section>
    </>
  );
}
