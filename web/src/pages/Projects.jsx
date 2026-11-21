import { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
import DemoRequestModal from '../components/DemoRequestModal';

const SmartParking3DSimulator = lazy(() => import('../components/SmartParking3DSimulator'));
const MdmsFactory3D = lazy(() => import('../components/MdmsFactory3D'));
const SmartConveyor3D = lazy(() => import('../components/SmartConveyor3D'));

export default function Projects() {
  const [items, setItems] = useState([]);
  const [active3dTab, setActive3dTab] = useState('parking'); // 'parking' | 'mdms' | 'conveyor'
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoProduct, setDemoProduct] = useState('Smart Parking System');

  useEffect(() => {
    client.get('/projects').then((r) => setItems(r.data.items || [])).catch(() => {});
  }, []);

  return (
    <>
      <PageHero
        kicker="Verified Deployments & Digital Twins"
        title="Engineering Projects & 3D Simulations"
        sub="Experience our full-scale interactive 3D digital twins alongside real telemetry and live automation deployed on customer shop floors."
      />

      {/* ============================================================== */}
      {/* 3D INTERACTIVE ENGINEERING DIGITAL TWIN SHOWCASE               */}
      {/* ============================================================== */}
      <section style={{ padding: '40px 0 60px', background: 'linear-gradient(180deg, #091728 0%, #060f1b 100%)', color: '#ffffff' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 30px' }}>
            <div className="sec-kicker" style={{ color: '#38bdf8' }}>Interactive 3D Digital Twin Projects</div>
            <h2 style={{ color: '#ffffff', fontSize: '2rem', marginTop: '8px' }}>
              Live 3D Industrial Simulations &amp; Vision Systems
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '10px auto 0' }}>
              Select a project below to interact with real-time 3D telemetry, ANPR vision cameras, moving vehicles, and machine digital twins.
            </p>

            {/* 3D Project Switcher Pills */}
            <div style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              gap: '8px',
              background: 'rgba(15, 29, 52, 0.8)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginTop: '22px',
            }}>
              <button
                type="button"
                onClick={() => setActive3dTab('parking')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active3dTab === 'parking' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active3dTab === 'parking' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                }}
              >
                <span>🚗</span>
                <span>3D AI Smart Parking System</span>
              </button>

              <button
                type="button"
                onClick={() => setActive3dTab('mdms')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active3dTab === 'mdms' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active3dTab === 'mdms' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                }}
              >
                <span>🏭</span>
                <span>3D MDMS Shop-Floor Digital Twin</span>
              </button>

              <button
                type="button"
                onClick={() => setActive3dTab('conveyor')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: active3dTab === 'conveyor' ? '#0284c7' : 'transparent',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: active3dTab === 'conveyor' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                }}
              >
                <span>⚙️</span>
                <span>3D Smart Conveyor &amp; Vision QC</span>
              </button>
            </div>
          </div>

          {/* ACTIVE 3D PROJECT VIEWPORT */}
          <Suspense fallback={
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontSize: '1.1rem', fontWeight: 800 }}>
              Loading Interactive 3D Digital Twin...
            </div>
          }>
            {active3dTab === 'parking' && (
              <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <SmartParking3DSimulator />
              </div>
            )}

            {active3dTab === 'mdms' && (
              <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.4rem', margin: 0 }}>
                    3D Live MDMS Shop-Floor &amp; Machine Telemetry
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '6px 0 0' }}>
                    Click any 3D machine on the floor (CNC, Hydraulic Press, Injection Molding, or Assembly Line) to inspect live OEE %, RPM, power draw, and simulate Run/Idle/Fault states.
                  </p>
                </div>
                <MdmsFactory3D onBookDemo={() => { setDemoProduct('MDMS (Machine Data Monitoring)'); setDemoOpen(true); }} />
              </div>
            )}

            {active3dTab === 'conveyor' && (
              <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.4rem', margin: 0 }}>
                    Smart Conveyor Belt · AI Vision QC &amp; Automated OK / NG Sorting
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '6px 0 0' }}>
                    Aluminum extrusion roller conveyor with AC drive motor, Siemens PLC cabinet, overhead CMOS vision camera scanning packages, and high-speed pneumatic reject pusher for NG defects.
                  </p>
                </div>
                <SmartConveyor3D onBookDemo={() => { setDemoProduct('Smart Conveyor & AI Vision Inspection System'); setDemoOpen(true); }} />
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* ============================================================== */}
      {/* VERIFIED CUSTOMER DEPLOYMENT CASE STUDIES                      */}
      {/* ============================================================== */}
      <section style={{ padding: '70px 0', background: '#f4f7fc' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
            <div className="sec-kicker">Shop-Floor Case Studies</div>
            <h2>Commercial Deployments &amp; Plant Records</h2>
            <p>Explore production data, equipment integration, and verified case studies from live factories.</p>
          </div>

          <div className="grid-3">
            {items.map((p) => {
              const hasVideo = p.video || p.videoUrl;
              const status = p.status || 'Live in Production';
              return (
                <Link className="card link" to={`/projects/${p.slug}`} key={p._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {p.image && <div className="proj-thumb"><img className="card-img" src={p.image} alt="" style={{ height: 200, width: '100%', objectFit: 'cover' }} />{hasVideo && <span className="play">▶</span>}</div>}
                    {!p.image && hasVideo && <div className="proj-thumb novideo" style={{ height: 200 }}><span className="play">▶</span></div>}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
                      <div className="prod-cat" style={{ margin: 0 }}>{p.year || '2026'}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#107e44', background: '#eafaf1', padding: '3px 8px', borderRadius: 4 }}>
                        {status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 20, marginBottom: 6 }}>{p.title}</h3>
                    {p.client && <div style={{ fontSize: 13, fontWeight: 600, color: '#1351b4', marginBottom: 8 }}>Client: {p.client}</div>}
                    <p style={{ fontSize: 14.5, color: '#4a5b73', lineHeight: 1.6 }}>{p.summary || p.problemStatement || 'Automated data monitoring and machine telemetry system.'}</p>
                  </div>

                  <div style={{ marginTop: 16, borderTop: '1px solid #eef3fa', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-link" style={{ margin: 0, fontWeight: 600 }}>{hasVideo ? 'Watch Demo & Case Study →' : 'View Project Details →'}</span>
                  </div>
                </Link>
              );
            })}
            {items.length === 0 && <p className="muted" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No projects added yet.</p>}
          </div>
        </div>
      </section>

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        initialProduct={demoProduct}
      />
    </>
  );
}
