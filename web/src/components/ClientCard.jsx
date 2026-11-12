import { Link } from 'react-router-dom';
import { hasVideo } from './videoEmbed';

/** Link target for a company: slug when it has one, otherwise the id (older records). */
export const clientPath = (c = {}) => `/clients/${c.slug || c._id}`;

/**
 * One "Companies we work with" card. Keeps the `.client` class so the 3D tilt,
 * hover recolour and scroll reveal keep working. Clicking opens
 * /clients/<slug> — the company's video + details.
 */
export default function ClientCard({ client: c, big = false }) {
  const video = hasVideo(c);
  return (
    <Link className={`client${big ? ' big' : ''}`} to={clientPath(c)} title={`${c.name} — ${video ? 'watch the video' : 'see details'}`}>
      {c.logo ? <img src={c.logo} alt={c.name} loading="lazy" /> : <span className="client-name">{c.name}</span>}
      {big && (
        <span className="client-meta">
          {c.logo && <b>{c.name}</b>}
          {(c.industry || c.location) && <small>{[c.industry, c.location].filter(Boolean).join(' · ')}</small>}
        </span>
      )}
      {video && <span className="client-play" aria-hidden="true">▶</span>}
      <span className="client-cta">{video ? 'Watch video' : 'View details'} →</span>
    </Link>
  );
}
