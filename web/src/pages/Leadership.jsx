import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function Leadership() {
  const [team, setTeam] = useState([]);
  useEffect(() => { client.get('/team').then((r) => setTeam(r.data.items || [])).catch(() => {}); }, []);
  function open(url) { window.open(url, '_blank', 'noopener'); }
  return (
    <>
      <PageHero kicker="About Us" title="Our Leadership" sub="The team driving intelligent automation at RvmAiTech." />
      <section><div className="wrap"><div className="grid-3">
        {team.map((m) => (
          <Link className="lead-card" to={`/leadership/${m.slug}`} key={m._id}>
            <div className="lead-media">
              {m.photo ? <img src={m.photo} alt={m.name} /> : <div className="lead-ph">{(m.name || '?').slice(0, 1)}</div>}
            </div>
            <div className="lead-body">
              <h3>{m.name}</h3>
              <div className="lead-role">{m.role}</div>
              {m.bio && <p>{m.bio}</p>}
              {(m.linkedin || m.email) && (
                <div className="lead-social">
                  {m.linkedin && <button type="button" title="LinkedIn" onClick={(e) => { e.preventDefault(); open(m.linkedin); }}><svg viewBox="0 0 24 24" width="16" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 22 10.6 22 14.1V21h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z"/></svg></button>}
                  {m.email && <button type="button" title="Email" onClick={(e) => { e.preventDefault(); open(`mailto:${m.email}`); }}><svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6" strokeLinecap="round"/></svg></button>}
                </div>
              )}
              <span className="card-link">View profile →</span>
            </div>
          </Link>
        ))}
        {team.length === 0 && <p className="muted">Team profiles coming soon.</p>}
      </div></div></section>
    </>
  );
}
