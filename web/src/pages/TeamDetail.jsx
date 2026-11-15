import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Sparkles, CheckCircle2, Quote, Send } from 'lucide-react';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

const Linkedin = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const KNOWN_FOCUS_ITEMS = [
  'Embedded Systems & Electronics',
  'IoT & Industrial Connectivity',
  'PLC & Machine Communication',
  'Machine Data Monitoring',
  'Robotics & Automation',
  'Computer Vision',
  'Industrial Software & Data Systems',
];

function parseFocusBlock(text) {
  const raw = String(text || '').replace(/^my\s+focus\s*:?\s*/i, '').trim();
  const byLines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byLines.length > 1) return byLines;

  // Fallback if single newlines were collapsed into spaces
  const matched = KNOWN_FOCUS_ITEMS.filter((item) => raw.toLowerCase().includes(item.toLowerCase()));
  if (matched.length >= 2) return matched;

  return raw.split(/[•|·,]/).map((s) => s.trim()).filter(Boolean);
}

function parseBioTags(bio) {
  if (!bio) return { headline: '', tags: [] };
  const parts = String(bio)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = [];
  parts.forEach((p) => {
    if (p.includes('•')) {
      p.split('•').map((s) => s.trim()).filter(Boolean).forEach((t) => tags.push(t));
    } else {
      tags.push(p);
    }
  });
  return { headline: parts[0] || bio, tags };
}

const initials = (name = '') =>
  name
    .replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|er\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export default function TeamDetail() {
  const { slug } = useParams();
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    client
      .get(`/team/${slug}`)
      .then((r) => setM(r.data.item))
      .catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [slug]);

  if (err)
    return (
      <section style={{ padding: '80px 0' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <p className="muted">{err}</p>
          <Link to="/leadership" className="btn btn-primary btn-3d-orange" style={{ marginTop: 16 }}>
            ← Back to Leadership
          </Link>
        </div>
      </section>
    );

  if (!m)
    return (
      <section style={{ padding: '80px 0' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <p className="muted">Loading…</p>
        </div>
      </section>
    );

  const blocks = String(m.details || '')
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const narrativeParagraphs = [];
  let focusItems = [];
  let quoteText = '';

  blocks.forEach((b) => {
    if (/^my\s+focus\b/i.test(b)) {
      focusItems = parseFocusBlock(b);
    } else if (/^[“"'].*[”"']$/.test(b)) {
      quoteText = b.replace(/^[“"']+|[”"']+$/g, '').trim();
    } else {
      narrativeParagraphs.push(b);
    }
  });

  const { tags: bioTags } = parseBioTags(m.bio);

  return (
    <>
      <PageHero media={m} kicker="About Us · Leadership" title={m.name} sub={m.role} />

      <section style={{ padding: '56px 0 90px', background: 'linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%)' }}>
        <div className="wrap" style={{ maxWidth: 1120 }}>
          {/* Breadcrumb */}
          <div className="pd-crumb" style={{ marginBottom: 32 }}>
            <Link to="/leadership" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1351b4', fontWeight: 700 }}>
              <ArrowLeft size={16} /> Our Leadership
            </Link>{' '}
            <span>/</span> <b style={{ color: '#0d2649' }}>{m.name}</b>
          </div>

          {/* CENTERED PROFESSIONAL 3D HEADING BLOCK */}
          <div className="sec-head" style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto 44px' }}>
            <div
              className="sec-kicker"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(244, 123, 32, 0.12)',
                border: '1.5px solid rgba(244, 123, 32, 0.35)',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 800,
                color: '#f47b20',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 14,
                boxShadow: '0 4px 0 rgba(244, 123, 32, 0.2), 0 8px 18px rgba(244, 123, 32, 0.14)',
              }}
            >
              <Sparkles size={15} /> {m.role || 'Executive Leadership'}
            </div>

            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 800,
                color: '#0d2649',
                margin: '0 0 18px',
                lineHeight: 1.15,
              }}
            >
              {m.name}
            </h2>

            {bioTags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 10,
                  marginTop: 14,
                }}
              >
                {bioTags.map((tag, idx) => (
                  <span key={idx} className="cloud-tech-pill" style={{ fontSize: 13.5, padding: '8px 18px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MAIN EXECUTIVE PROFILE GRID */}
          <div className="member-profile-grid">
            {/* LEFT: 3D PHOTO / INITIALS CARD & 3D ACTION BUTTONS */}
            <div className="member-side-3d">
              <div className="member-avatar-box-3d intro-media">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                ) : (
                  <div className="member-initials-3d">
                    <span>{initials(m.name)}</span>
                    <small>{m.role || 'Founder & CEO'}</small>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                {m.linkedin && (
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-3d-orange"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Linkedin size={17} /> Connect on LinkedIn
                  </a>
                )}
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="btn btn-3d-cyan"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Mail size={17} /> Send Direct Email
                  </a>
                )}
                <Link
                  to="/contact"
                  className="btn btn-primary btn-3d-orange"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Send size={16} /> Get in Touch
                </Link>
              </div>
            </div>

            {/* RIGHT: PROFESSIONAL 3D BIOGRAPHY & STRUCTURED FOCUS AREAS */}
            <div className="member-content-3d">
              <div className="sec-head" style={{ textAlign: 'center', margin: '0 0 26px' }}>
                <div className="sec-kicker">Executive Profile &amp; Vision</div>
                <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', color: '#0d2649', marginTop: 6, fontWeight: 800 }}>
                  Engineering Intelligent Systems for Industry
                </h2>
              </div>

              <div className="member-narrative-3d">
                {narrativeParagraphs.map((p, i) => (
                  <p key={i} className="intro-text" style={{ margin: '0 0 18px' }}>
                    {p}
                  </p>
                ))}
              </div>

              {/* MY FOCUS SECTION — CENTERED 3D HEADING + 3D FOCUS CARDS */}
              {focusItems.length > 0 && (
                <div style={{ marginTop: 38 }}>
                  <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 24px' }}>
                    <div className="sec-kicker">Core Engineering Expertise</div>
                    <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', color: '#0d2649', marginTop: 6, fontWeight: 800 }}>
                      My Focus &amp; Technical Domains
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {focusItems.map((item, idx) => (
                      <div key={idx} className="prod-check-3d" style={{ alignItems: 'center', padding: '14px 16px' }}>
                        <CheckCircle2 size={19} color="#f47b20" style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#0d2649',
                            textShadow: '0 1px 0 #ffffff, 0 2px 5px rgba(13,38,73,0.12)',
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3D EXECUTIVE QUOTE CALLOUT */}
              {quoteText && (
                <div
                  className="audit-banner-3d"
                  style={{
                    marginTop: 38,
                    padding: '32px 30px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <Quote size={32} color="#f47b20" style={{ marginBottom: 10, opacity: 0.9 }} />
                    <h3
                      style={{
                        fontSize: 'clamp(19px, 2.4vw, 25px)',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1.45,
                        margin: '0 auto 10px',
                        maxWidth: 680,
                        textShadow: '0 2px 0 #06152d, 0 4px 0 #030b18, 0 10px 22px rgba(0,0,0,0.65)',
                      }}
                    >
                      &ldquo;{quoteText}&rdquo;
                    </h3>
                    <div style={{ color: '#7dd3fc', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      — {m.name}, {m.role || 'Founder & CEO'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
