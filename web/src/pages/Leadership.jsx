import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import client from '../api/client';
import Seo from '../components/Seo';
import { useSite } from '../api/SiteContext';
import { PageHero } from './_hero.jsx';
import { resolvePageIntro, renderBody, SplitTitle } from '../components/PageIntro';

/**
 * /leadership —
 *   1. Founders on top: members with the "Founder" checkbox ticked (Admin →
 *      Leadership) or "Founder" in their role — or, if nobody is flagged, the first
 *      two members — as large cards: photo | role, name, bio, links.
 *   2. Centred title ("The People | Behind Our Success", Admin → Pages → Our
 *      Leadership; text before "|" is light, after it bold).
 *   3. Grid of the other heads (Admin → Leadership): photo, name, role.
 * Clicking a photo or a name opens the profile page (/leadership/<slug>).
 */
const isFounder = (m) => m?.founder === true || /founder/i.test(m?.role || '');
const Linkedin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
);
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function Leadership() {
  const { content } = useSite();
  const [items, setItems] = useState(null);
  useEffect(() => {
    client.get('/team').then((r) => setItems(r.data.items || [])).catch(() => setItems([]));
  }, []);

  const intro = resolvePageIntro('leadership', content);
  // Founders row: members flagged in admin (checkbox or "Founder" in the role).
  // Nothing flagged yet? Then the first two members (Order 1 and 2) are treated as Founder + Co-Founder.
  const flagged = (items || []).filter(isFounder);
  const founders = flagged.length ? flagged : (items || []).slice(0, 2);
  const rest = (items || []).filter((m) => !founders.includes(m));
  const founderRole = (m, i) => m.role || (i === 0 ? 'Founder' : i === 1 ? 'Co-Founder' : 'Founder');

  const links = (m) => (m.linkedin || m.email) && (
    <div className="people-links">
      {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn"><Linkedin size={15} /></a>}
      {m.email && <a href={`mailto:${m.email}`} aria-label="Email" title="Email"><Mail size={15} /></a>}
    </div>
  );

  return (
    <>
      <Seo title="Our Leadership" description="The people behind RvmAiTech's automation, vision and machine-intelligence systems." />
      <PageHero kicker="About Us" title="Our Leadership" sub="The people who design, build and support our systems." intro={false} />

      {founders.length > 0 && (
        <section className="founders">
          <div className="wrap">
            <div className="founders-kicker">Founders</div>
            <div className={`founders-grid${founders.length === 1 ? ' one' : ''}`}>
              {founders.map((m, i) => {
                const to = m.slug ? `/leadership/${m.slug}` : null;
                const Photo = m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <div className="lead-ph">{initials(m.name)}</div>;
                return (
                  <article className="founder-card" key={m._id || i}>
                    {to ? <Link to={to} className="founder-photo" aria-label={`${m.name} — view profile`}>{Photo}</Link> : <div className="founder-photo">{Photo}</div>}
                    <div className="founder-body">
                      <div className="people-role">{founderRole(m, i)}</div>
                      <h3>{to ? <Link to={to}>{m.name}</Link> : m.name}</h3>
                      {m.bio && <p>{m.bio}</p>}
                      {links(m)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="people">
        <div className="wrap">
          {intro && (rest.length > 0 || items === null) && (
            <div className="people-head">
              {intro.heading && <h2><SplitTitle text={intro.heading} auto /></h2>}
              {intro.body && <div className="people-intro">{renderBody(intro.body)}</div>}
            </div>
          )}

          {items === null && <p className="muted" style={{ textAlign: 'center' }}>Loading…</p>}
          {items?.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Team profiles are being updated — add them in Admin → Leadership.</p>}

          {rest.length > 0 && (
            <div className="people-grid">
              {rest.map((m, i) => {
                const to = m.slug ? `/leadership/${m.slug}` : null;
                const Photo = m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <div className="lead-ph">{initials(m.name)}</div>;
                return (
                  <article className="people-card" key={m._id || i}>
                    {to ? <Link to={to} className="people-photo" aria-label={`${m.name} — view profile`}>{Photo}</Link> : <div className="people-photo">{Photo}</div>}
                    <h3>{to ? <Link to={to}>{m.name}</Link> : m.name}</h3>
                    {m.role && <div className="people-role">{m.role}</div>}
                    {links(m)}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
