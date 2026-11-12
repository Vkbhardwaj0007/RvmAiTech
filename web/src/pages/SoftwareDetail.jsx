import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import {
  ArrowLeft,
  Video,
  Image as ImageIcon,
  Calendar,
  Building,
  Send,
  CheckCircle2,
  Cpu,
  Layers,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

function ytEmbed(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function SoftwareDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    // 1. Try software-development endpoint
    client
      .get(`/software-development/${slug}`)
      .then((r) => {
        setP({ ...r.data.item, itemType: 'Software Project' });
      })
      .catch(() => {
        // 2. Try capabilities endpoint
        client
          .get(`/capabilities/${slug}`)
          .then((r) => {
            setP({ ...r.data.item, itemType: 'Industrial IoT & Software Capability' });
          })
          .catch(() => {
            // 3. Try erp-cards endpoint
            client
              .get(`/erp-cards/${slug}`)
              .then((r) => {
                setP({ ...r.data.item, itemType: 'Enterprise ERP Suite' });
              })
              .catch(() => {
                // 4. Try process endpoint
                client
                  .get(`/process/${slug}`)
                  .then((r) => {
                    setP({ ...r.data.item, itemType: 'Engineering Process Step' });
                  })
                  .catch((e) => setErr(e?.response?.data?.message || 'Detail page not found'));
              });
          });
      });
  }, [slug]);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello RvmAiTech team! I am interested in discussing your solution: "${p?.title}". Please share technical details and commercial proposal.`
    );
    window.open(`https://wa.me/917052050656?text=${text}`, '_blank');
  };

  if (err)
    return (
      <section>
        <div className="wrap" style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="muted" style={{ fontSize: 18 }}>{err}</p>
          <Link to="/software-development" className="btn btn-primary" style={{ marginTop: 16 }}>
            ← Back to IoT &amp; Software Development
          </Link>
        </div>
      </section>
    );

  if (!p)
    return (
      <section>
        <div className="wrap" style={{ textAlign: 'center', padding: '80px 0' }}>
          <p className="muted" style={{ fontSize: 18 }}>Loading details…</p>
        </div>
      </section>
    );

  const embed = p.videoUrl ? ytEmbed(p.videoUrl) : null;
  const stackList = Array.isArray(p.stack)
    ? p.stack
    : typeof p.stack === 'string' && p.stack.trim()
    ? p.stack.split(',').map((s) => s.trim())
    : Array.isArray(p.softwareUsed)
    ? p.softwareUsed
    : [];

  const hardwareList = Array.isArray(p.hardwareUsed)
    ? p.hardwareUsed
    : typeof p.hardwareUsed === 'string' && p.hardwareUsed.trim()
    ? p.hardwareUsed.split(',').map((s) => s.trim())
    : [];

  const featuresList = Array.isArray(p.features)
    ? p.features
    : Array.isArray(p.highlights)
    ? p.highlights
    : Array.isArray(p.deliverables)
    ? p.deliverables
    : [];

  const allPhotos = [
    ...(p.image ? [p.image] : []),
    ...(Array.isArray(p.photos)
      ? p.photos
      : typeof p.photos === 'string' && p.photos.trim()
      ? p.photos.split(',').map((s) => s.trim())
      : []),
  ].filter(Boolean);

  return (
    <>
      <PageHero
        media={p}
        kicker={p.badge || p.client || p.itemType || 'IoT & Software'}
        title={p.title}
        sub={p.summary || 'Custom industrial IoT, embedded firmware, and enterprise cloud software.'}
      />

      <section style={{ padding: '60px 0 90px', background: '#ffffff' }}>
        <div className="wrap post-wrap" style={{ maxWidth: 960 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 32,
              borderBottom: '1px solid #e5effa',
              paddingBottom: 16,
            }}
          >
            <div className="pd-crumb" style={{ margin: 0 }}>
              <Link to="/software-development" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1351b4', fontWeight: 600 }}>
                <ArrowLeft size={16} /> IoT &amp; Software Development
              </Link>
              <span>/</span>
              <b style={{ color: '#0d2649' }}>{p.title}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {p.year && (
                <span style={{ fontSize: 13, color: '#62758f', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} /> {p.year}
                </span>
              )}
              {p.client && (
                <span style={{ fontSize: 13, color: '#62758f', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building size={14} /> {p.client}
                </span>
              )}
            </div>
          </div>

          {/* Working Video Demo (if available) */}
          {(p.video || embed || p.videoUrl) && (
            <div style={{ marginBottom: 40, background: '#07172e', borderRadius: 18, overflow: 'hidden', border: '1px solid #1a3c6d' }}>
              <div style={{ padding: '14px 20px', background: '#0d2547', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 600 }}>
                <Video size={17} color="#f47b20" /> Working Demo Video
              </div>
              {p.video ? (
                <video style={{ width: '100%', maxHeight: 520, display: 'block', background: '#000' }} src={p.video} controls poster={p.image || undefined} />
              ) : embed ? (
                <div className="proj-embed">
                  <iframe src={embed} title={p.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : (
                <div style={{ padding: 30, textAlign: 'center' }}>
                  <a href={p.videoUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                    ▶ Watch Video Demonstration
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Problem Statement */}
          <div style={{ background: '#fff9f7', border: '1.5px solid #fbd8cd', borderRadius: 18, padding: '28px 24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d9381e', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              Operational Problem Statement
            </div>
            <p style={{ color: '#4a3834', fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
              {p.problemStatement || p.summary || 'Enterprise operations needed automation, real-time telemetry, and reduced human intervention.'}
            </p>
          </div>

          {/* Solution Delivered */}
          <div style={{ background: '#f5faf7', border: '1.5px solid #cce8d9', borderRadius: 18, padding: '28px 24px', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#107e44', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
              Solution &amp; Engineering Delivered
            </div>
            <p style={{ color: '#274435', fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
              {p.solution || p.description || p.summary || 'Custom engineered software and hardware integration delivering high uptime and measurable business value.'}
            </p>
          </div>

          {/* Key Capabilities / Features */}
          {featuresList.length > 0 && (
            <div style={{ background: '#ffffff', border: '1.5px solid #e1ecf8', borderRadius: 18, padding: '28px 24px', marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                <Sparkles size={19} color="#f47b20" /> Key Features &amp; Capabilities
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {featuresList.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: '#314358', lineHeight: 1.6 }}>
                    <CheckCircle2 size={18} color="#107e44" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hardware & Software Stacks */}
          {(hardwareList.length > 0 || stackList.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 36 }}>
              {hardwareList.length > 0 && (
                <div style={{ background: '#fcfdfe', border: '1px solid #dce8f8', borderRadius: 16, padding: '22px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
                    <Cpu size={18} color="#f47b20" /> Hardware Components
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {hardwareList.map((h, i) => (
                      <span key={i} style={{ background: '#fff5ee', color: '#c05621', border: '1px solid #fed7aa', borderRadius: 6, padding: '5px 11px', fontSize: 13, fontWeight: 600 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stackList.length > 0 && (
                <div style={{ background: '#fcfdfe', border: '1px solid #dce8f8', borderRadius: 16, padding: '22px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
                    <Layers size={18} color="#1351b4" /> Software Technologies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {stackList.map((s, i) => (
                      <span key={i} style={{ background: '#eef4ff', color: '#1351b4', border: '1px solid #d0e1f7', borderRadius: 6, padding: '5px 11px', fontSize: 13, fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Photos */}
          {allPhotos.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 19, marginBottom: 16 }}>
                <ImageIcon size={20} color="#1351b4" /> Photos &amp; Screenshots
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                {allPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePhoto(photo)}
                    style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #dce8f8', background: '#0a1d37', cursor: 'pointer', aspectRatio: '16/10', position: 'relative', boxShadow: '0 8px 20px -8px rgba(0,0,0,0.15)' }}
                  >
                    <img src={photo} alt={`${p.title} photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>Click to expand</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePhoto && (
            <div
              onClick={() => setActivePhoto(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
            >
              <img src={activePhoto} alt="Enlarged view" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }} />
            </div>
          )}

          {/* Action Callout with WhatsApp & Quote */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d2649 0%, #173d75 100%)',
              borderRadius: 20,
              padding: '40px 32px',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 20px 50px -15px rgba(13,38,73,0.4)',
            }}
          >
            <div style={{ maxWidth: 500 }}>
              <h3 style={{ fontSize: 23, color: '#fff', margin: '0 0 8px', fontWeight: 800 }}>
                Ready to deploy {p.title}?
              </h3>
              <p style={{ color: '#b9d2f3', margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>
                Speak directly with our technical lead to discuss architecture, timeline, custom sensor interfaces, and live pilot demonstration.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleWhatsApp}
                style={{
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '13px 22px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MessageSquare size={17} /> Instant WhatsApp
              </button>
              <Link
                to={`/contact?subject=${encodeURIComponent('Enquiry regarding: ' + p.title)}`}
                className="btn btn-primary"
                style={{
                  padding: '13px 24px',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Request Quotation <Send size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
