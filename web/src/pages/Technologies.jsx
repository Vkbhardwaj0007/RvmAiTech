import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import { iconFor } from './Home';
export default function Technologies() {
  const [items, setItems] = useState([]);
  useEffect(() => { client.get('/technologies').then((r) => setItems(r.data.items || [])).catch(() => {}); }, []);
  return (
    <>
      <PageHero kicker="Our core" title="Technologies" sub="Robotics, machine vision and machine intelligence." />
      <section><div className="wrap"><div className="grid-3">
        {items.map((t) => (
          <Link className="card link" to={`/technologies/${t.slug}`} key={t._id}>
            <div className="card-ico">{iconFor(t.icon)}</div>
            <h3>{t.title}</h3><p>{t.summary}</p>
            <span className="card-link">Explore →</span>
          </Link>
        ))}
        {items.length === 0 && <p className="muted">No technologies yet.</p>}
      </div></div></section>
    </>
  );
}
