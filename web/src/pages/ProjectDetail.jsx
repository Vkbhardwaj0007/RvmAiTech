import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import {
  Cpu, Code2, AlertTriangle, CheckCircle, Video, Image as ImageIcon,
  Calendar, Building, ArrowLeft, Send, ShieldCheck
} from 'lucide-react';

function ytEmbed(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    client.get(`/projects/${slug}`).then((r) => {
      const item = r.data.item;
      // Default fallbacks for EKC project if fields are not yet filled in DB
      if (item && !item.problemStatement && /machine data/i.test(item.title)) {
        item.status = item.status || 'Live in Production';
        item.problemStatement = 'Manual recording of machine cycles, unrecorded downtime, lack of real-time OEE visibility across cylinder manufacturing lines, and delayed maintenance responses during sudden machine stoppages.';
        item.solution = 'Engineered an edge-to-cloud MDMS architecture with non-intrusive PLC datalogging, real-time cycle counting, live shift OEE analytics dashboards, and instant WhatsApp/SMS breakdown alerts for plant maintenance supervisors.';
        item.hardwareUsed = item.hardwareUsed?.length ? item.hardwareUsed : [
          'Siemens S7-1200 PLC',
          'RvmAiTech DIN-Rail Edge Datalogger',
          'Isolated RS485/Modbus Converter',
          'Industrial 24V Opto-Isolated Sensor Interface',
          'Plant Central Gateway'
        ];
        item.softwareUsed = item.softwareUsed?.length ? item.softwareUsed : [
          'MDMS Real-Time Analytics Engine',
          'Node.js & Python Edge Services',
          'React Shop-Floor Live Dashboard',
          'Automated Daily Shift PDF Reports',
          'Telegram & WhatsApp Alert Bot'
        ];
      }
      setP(item);
    }).catch((e) => setErr(e?.response?.data?.message || 'Project not found'));
  }, [slug]);

  if (err) return (
    <section>
      <div className="wrap" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p className="muted" style={{ fontSize: 18 }}>{err}</p>
        <Link to="/projects" className="btn btn-primary" style={{ marginTop: 16 }}>← Back to Projects</Link>
      </div>
    </section>
  );

  if (!p) return (
    <section>
      <div className="wrap" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p className="muted" style={{ fontSize: 18 }}>Loading project details…</p>
      </div>
    </section>
  );

  const embed = p.videoUrl ? ytEmbed(p.videoUrl) : null;
  const statusColor = p.status === 'Completed' ? '#107e44' : '#1351b4';

  const hwList = Array.isArray(p.hardwareUsed)
    ? p.hardwareUsed
    : typeof p.hardwareUsed === 'string' && p.hardwareUsed.trim()
    ? p.hardwareUsed.split(',').map((s) => s.trim())
    : [];

  const swList = Array.isArray(p.softwareUsed)
    ? p.softwareUsed
    : typeof p.softwareUsed === 'string' && p.softwareUsed.trim()
    ? p.softwareUsed.split(',').map((s) => s.trim())
    : [];

  const allPhotos = [
    ...(p.image ? [p.image] : []),
    ...(Array.isArray(p.photos) ? p.photos : typeof p.photos === 'string' && p.photos.trim() ? p.photos.split(',').map((s) => s.trim()) : [])
  ].filter(Boolean);

  return (
    <>
      <PageHero media={p} kicker={p.client || 'Verified Case Study'} title={p.title} sub={p.summary || 'End-to-end industrial automation and machine intelligence deployment.'} />
      
      <section style={{ padding: '60px 0 90px' }}>
        <div className="wrap post-wrap" style={{ maxWidth: 960 }}>
          {/* Breadcrumb + Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 28, borderBottom: '1px solid #e5effa', paddingBottom: 16 }}>
            <div className="pd-crumb" style={{ margin: 0 }}>
              <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={16} /> Projects
              </Link>
              <span>/</span>
              <b>{p.title}</b>
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
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: statusColor,
                  background: `${statusColor}18`,
                  padding: '4px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                {p.status || 'Live Deployed'}
              </span>
            </div>
          </div>

          {/* WORKING DEMO VIDEO */}
          {(p.video || embed || p.videoUrl) && (
            <div style={{ marginBottom: 40, background: '#07172e', borderRadius: 18, overflow: 'hidden', border: '1px solid #1a3c6d', boxShadow: '0 24px 60px -20px rgba(7, 23, 46, 0.4)' }}>
              <div style={{ padding: '14px 20px', background: '#0d2547', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 600 }}>
                <Video size={17} color="#f47b20" /> Working Demo Video
              </div>
              {p.video ? (
                <video
                  style={{ width: '100%', maxHeight: 520, display: 'block', background: '#000' }}
                  src={p.video}
                  controls
                  poster={p.image || undefined}
                />
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

          {/* PROBLEM STATEMENT & SOLUTION CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 38 }}>
            {/* Problem Statement */}
            <div style={{ background: '#fff9f7', border: '1.5px solid #fbd8cd', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d9381e', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
                <AlertTriangle size={20} /> Problem Statement
              </div>
              <p style={{ color: '#4a3834', fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
                {p.problemStatement || p.summary || 'Unmonitored manual operations and lack of real-time machine telemetry leading to unexpected line stops.'}
              </p>
            </div>

            {/* Solution */}
            <div style={{ background: '#f5faf7', border: '1.5px solid #cce8d9', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#107e44', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
                <CheckCircle size={20} /> Solution Delivered
              </div>
              <p style={{ color: '#274435', fontSize: 15.5, lineHeight: 1.7, margin: 0 }}>
                {p.solution || p.description || 'Turnkey hardware and cloud intelligence deployment providing live shop-floor monitoring, automated logs, and predictive maintenance.'}
              </p>
            </div>
          </div>

          {/* HARDWARE USED & SOFTWARE USED */}
          {(hwList.length > 0 || swList.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 38 }}>
              {/* Hardware Used */}
              {hwList.length > 0 && (
                <div style={{ background: '#fcfdfe', border: '1px solid #dce8f8', borderRadius: 16, padding: '24px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
                    <Cpu size={19} color="#1351b4" /> Hardware Used
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {hwList.map((hw, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#eef4ff',
                          color: '#1351b4',
                          border: '1px solid #d0e1f7',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 13.5,
                          fontWeight: 500,
                        }}
                      >
                        {hw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Software Used */}
              {swList.length > 0 && (
                <div style={{ background: '#fcfdfe', border: '1px solid #dce8f8', borderRadius: 16, padding: '24px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
                    <Code2 size={19} color="#f47b20" /> Software &amp; Protocols Used
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {swList.map((sw, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#fff3ea',
                          color: '#d46511',
                          border: '1px solid #fcdbca',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 13.5,
                          fontWeight: 500,
                        }}
                      >
                        {sw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADDITIONAL DESCRIPTION (IF ANY) */}
          {p.description && !p.solution && (
            <div style={{ background: '#ffffff', border: '1px solid #e5effa', borderRadius: 16, padding: '28px', marginBottom: 38 }}>
              <h3 style={{ color: '#0d2649', fontSize: 20, marginBottom: 14 }}>Project Overview</h3>
              <div style={{ color: '#42526e', fontSize: 16, lineHeight: 1.8 }}>
                {String(p.description).split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
          )}

          {/* ACTUAL PROJECT PHOTOS */}
          {allPhotos.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0d2649', fontWeight: 700, fontSize: 19, marginBottom: 16 }}>
                <ImageIcon size={20} color="#1351b4" /> Actual Project Photos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                {allPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePhoto(photo)}
                    style={{
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid #dce8f8',
                      background: '#0a1d37',
                      cursor: 'pointer',
                      aspectRatio: '16/10',
                      position: 'relative',
                      boxShadow: '0 8px 20px -8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <img
                      src={photo}
                      alt={`${p.title} photo ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 4 }}>
                      Click to expand
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lightbox Modal */}
          {activePhoto && (
            <div
              onClick={() => setActivePhoto(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 20,
              }}
            >
              <img
                src={activePhoto}
                alt="Enlarged project"
                style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
              />
            </div>
          )}

          {/* CTA BAR */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d2649 0%, #173d75 100%)',
              borderRadius: 18,
              padding: '36px 32px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <h3 style={{ fontSize: 22, color: '#ffffff', margin: '0 0 6px' }}>Need a similar solution for your machines?</h3>
              <p style={{ color: '#b9d2f3', margin: 0, fontSize: 15 }}>
                Talk directly to our automation team to discuss feasibility, hardware specs, and pricing.
              </p>
            </div>
            <Link
              to={`/contact?subject=${encodeURIComponent('Enquiry regarding project: ' + p.title)}`}
              className="btn btn-primary"
              style={{ padding: '12px 26px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Discuss Your Project <Send size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
