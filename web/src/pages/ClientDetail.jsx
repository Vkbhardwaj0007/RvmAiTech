import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, CalendarDays, Globe, VolumeX, ExternalLink, Play } from 'lucide-react';
import client from '../api/client';
import Seo from '../components/Seo';
import { PageHero } from './_hero.jsx';
import SplitSection, { Accent, splitBody, PointIcon, parsePoint } from '../components/SplitSection';
import { resolveVideo } from '../components/videoEmbed';
import ClientCard from '../components/ClientCard';

/**
 * /clients/<slug>  — opened by clicking a card in "Companies we work with".
 *
 *   hero            company name, tagline, chips (industry · location · since · website)
 *   video | details video (uploaded file, YouTube/Vimeo link, or cover image) on the left;
 *                   "About <Company>", summary, description, "What we did" points, buttons on the right
 *   sections        Admin → Clients → Edit → "Detail sections" (image | heading + text), alternating
 *   projects        projects whose Client field matches this company
 *   others          the other companies, so visitors can keep browsing
 *   CTA
 *
 * Everything is edited in Admin → Clients.
 */

// GET /clients/<slug> first; if the API cannot resolve it (a company saved before
// slugs existed, or an id in the link) fall back to the public list.
async function loadClient(slugOrId, listPromise) {
  try {
    const r = await client.get(`/clients/${encodeURIComponent(slugOrId)}`);
    const it = r.data?.item ?? (r.data?._id ? r.data : null);
    if (it && it.name) return it;
  } catch { /* fall through to the list */ }
  const list = await listPromise;
  const want = decodeURIComponent(slugOrId);
  return list.find((c) => c.slug === want || String(c._id) === want) || null;
}

const norm = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function VideoPlayer({ c }) {
  const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const v = resolveVideo(c, { autoplay: !reduce });
  const ref = useRef(null);
  const [muted, setMuted] = useState(!reduce);

  // start muted so the browser allows autoplay; the "unmute" pill hands the sound over
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    el.muted = true;
    el.play?.().catch(() => {});
  }, [v?.src, reduce]);

  function unmute() {
    const el = ref.current;
    if (el) { el.muted = false; el.play?.().catch(() => {}); }
    setMuted(false);
  }

  if (v?.kind === 'file') {
    return (
      <div className="cv-player">
        <video
          ref={ref}
          src={v.src}
          poster={c.image || undefined}
          controls
          playsInline
          preload="metadata"
          autoPlay={!reduce}
          muted={muted}
          onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        />
        {muted && <button type="button" className="cv-unmute" onClick={unmute}><VolumeX size={16} /> Tap to unmute</button>}
      </div>
    );
  }
  if (v?.kind === 'youtube' || v?.kind === 'vimeo') {
    return (
      <div className="cv-player">
        <div className="proj-embed">
          <iframe src={v.src} title={`${c.name} — video`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
        </div>
      </div>
    );
  }
  // no playable video: cover image or the logo, with a link when a non-embeddable video link was saved
  return (
    <div className="cv-player">
      {c.image
        ? <img className="cv-cover" src={c.image} alt={c.name} />
        : <div className="cv-logo-box">{c.logo ? <img src={c.logo} alt={c.name} /> : <span>{c.name}</span>}</div>}
      {v?.kind === 'link' && (
        <a className="cv-link-btn" href={v.src} target="_blank" rel="noreferrer">
          <span className="btn btn-primary"><Play size={18} /> Watch the video</span>
        </a>
      )}
    </div>
  );
}

export default function ClientDetail() {
  const { slug } = useParams();
  const [c, setC] = useState(null);
  const [all, setAll] = useState([]);
  const [projects, setProjects] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    setC(null); setErr('');
    const listP = client.get('/clients').then((r) => r.data?.items || []).catch(() => []);
    (async () => {
      const item = await loadClient(slug, listP);
      const list = await listP;
      if (!alive) return;
      setAll(list);
      if (item) setC(item); else setErr('Company not found');
    })();
    return () => { alive = false; };
  }, [slug]);

  // projects done for this company (Admin → Projects → Client)
  useEffect(() => {
    if (!c) return;
    const me = norm(c.name);
    client.get('/projects')
      .then((r) => setProjects((r.data?.items || []).filter((p) => {
        const pc = norm(p.client);
        return pc && (pc === me || pc.includes(me) || me.includes(pc));
      }).slice(0, 3)))
      .catch(() => setProjects([]));
  }, [c]);

  if (err) {
    return (
      <section><div className="wrap">
        <p className="muted">{err}</p>
        <Link to="/clients" className="card-link">← Companies we work with</Link>
      </div></section>
    );
  }
  if (!c) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  const { paras, items } = splitBody(c.description);
  const highlights = (Array.isArray(c.highlights) ? c.highlights : []).map((h) => String(h).trim()).filter(Boolean);
  const points = [...new Set([...highlights, ...items])];  // "What we did" points: highlights field + "- " lines from the description
  const sections = (Array.isArray(c.sections) ? c.sections : []).filter((s) => s && (s.heading || s.body || s.image));
  const others = all.filter((x) => String(x._id) !== String(c._id));
  const website = (c.url || '').trim();
  const heroSub = c.tagline || c.summary || '';                 // one line under the name in the hero
  const showLead = !!c.summary && (!!c.tagline || !paras.length); // summary in the body when the hero shows the tagline, or there is no description
  const hasText = !!(showLead || paras.length || points.length);

  return (
    <>
      <Seo title={`${c.name} — Companies we work with`} description={c.summary || c.tagline || `${c.name} works with RvmAiTech on automation.`} />

      <PageHero media={c} kicker="Trusted by" title={c.name} sub={heroSub || undefined} intro={false}>
        {(c.industry || c.location || c.since || website) && (
          <div className="cv-chips">
            {c.industry && <span className="cv-chip"><Building2 size={15} /> {c.industry}</span>}
            {c.location && <span className="cv-chip"><MapPin size={15} /> {c.location}</span>}
            {c.since && <span className="cv-chip"><CalendarDays size={15} /> Since {c.since}</span>}
            {website && <a className="cv-chip" href={website} target="_blank" rel="noreferrer"><Globe size={15} /> {website.replace(/^https?:\/\//, '').replace(/\/$/, '')} <ExternalLink size={12} /></a>}
          </div>
        )}
      </PageHero>

      <div className="wrap svc-crumb"><Link to="/">Home</Link> <span>/</span> <Link to="/clients">Companies we work with</Link> <span>/</span> <b>{c.name}</b></div>

      {/* VIDEO | DETAILS */}
      <section className="cv-wrap">
        <div className="wrap cv-grid">
          <div className="cv-media"><VideoPlayer c={c} /></div>
          <div className="cv-body">
            {c.logo && <div className="cv-logo"><img src={c.logo} alt={c.name} /></div>}
            <h2><Accent text={`About ${c.name}`} accent={c.name} /></h2>
            {showLead && <p className="cv-lead">{c.summary}</p>}
            {paras.map((p, i) => <p key={i}>{p}</p>)}
            {!hasText && <p>{c.name} is one of the companies we work with — more about this project is coming soon.</p>}
            {points.length > 0 && (
              <>
                <h3>What we did for <em>{c.name}</em></h3>
                <div className="split-items">
                  {points.map((label, i) => (
                    <div className="split-item" key={i}><span className="si-ico"><PointIcon i={i} label={label} /></span><b>{parsePoint(label).text}</b></div>
                  ))}
                </div>
              </>
            )}
            <div className="cv-actions">
              <Link to="/contact" className="btn btn-primary">Discuss a similar project</Link>
              {website && <a href={website} target="_blank" rel="noreferrer" className="btn btn-ghost dark"><Globe size={16} /> Visit website</a>}
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL SECTIONS (Admin → Clients → Edit → Detail sections) */}
      {sections.map((s, i) => {
        const b = splitBody(s.body);
        return <SplitSection key={i} image={s.image} flip={i % 2 === 0} tone={i % 2 === 0} heading={s.heading} paras={b.paras} items={b.items} />;
      })}

      {/* PROJECTS FOR THIS COMPANY */}
      {projects.length > 0 && (
        <section className="cv-related">
          <div className="wrap">
            <div className="sec-head">
              <div className="sec-kicker">Projects</div>
              <h2>What we built for {c.name}</h2>
            </div>
            <div className="grid-3">
              {projects.map((p) => (
                <Link className="card link" to={`/projects/${p.slug || p._id}`} key={p._id}>
                  {p.image && <img className="card-img" src={p.image} alt="" loading="lazy" />}
                  <h3>{p.title}</h3>
                  {p.summary && <p>{p.summary}</p>}
                  <span className="card-link">View project →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OTHER COMPANIES */}
      {others.length > 0 && (
        <section className="cv-others">
          <div className="wrap">
            <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 32px' }}>
              <div className="sec-kicker">Trusted by</div>
              <h2>More companies we work with</h2>
            </div>
            <div className="clients">
              {others.map((o) => <ClientCard client={o} key={o._id} />)}
            </div>
            <div className="clients-more"><Link to="/clients" className="card-link">All companies →</Link></div>
          </div>
        </section>
      )}

      <section className="svc-cta-wrap">
        <div className="wrap">
          <div className="cta-band">
            <div className="cta-text">
              <h3>Want results like these?</h3>
              <p>Tell us about your process — we will propose the right mix of robotics, vision and intelligence, with a clear payback.</p>
            </div>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">Get a quote</Link>
              <Link to="/projects" className="btn btn-ghost">See all projects</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
