import { toPoint } from '../components/SplitSection';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Seo from '../components/Seo';
import { useSite } from '../api/SiteContext';
import { useLang } from '../api/Lang';
import HeroVideo, { parseHeroVideos } from '../components/HeroVideo';
import PageIntro from '../components/PageIntro';
import ClientCard from '../components/ClientCard';
import ProductSolutionsSection from '../components/ProductSolutionsSection';
import WhyChooseSection from '../components/WhyChooseSection';
import ProjectResultsAndTestimonials from '../components/ProjectResultsAndTestimonials';
import FaqSection from '../components/FaqSection';
import DemoRequestModal from '../components/DemoRequestModal';
import { canRun3D } from '../components/heroScene3DSupport';

/**
 * three.js is ~132 KB gzipped — far too much for the main bundle when it only
 * draws a background flourish. Two things keep it from costing anyone:
 *
 *   1. It is a lazy import, so it lands in its own chunk and the page (and the
 *      hero video) renders before any of it is fetched.
 *   2. `canRun3D()` is consulted BEFORE the component is rendered, and
 *      `lazy()` only fetches on render — so a phone, a reduced-motion setting
 *      or a slow connection downloads nothing at all.
 */
const HeroScene3D = lazy(() => import('../components/HeroScene3D'));

const FB_STATS = [
  { value: '50+', label: 'Automation projects' },
  { value: '10+', label: 'Years of expertise' },
  { value: '99%', label: 'System uptime' },
  { value: '24/7', label: 'Support & monitoring' },
];
const FB_FLOW = [
  { title: 'Process Analysis', summary: 'Identify tasks and design the workflow' },
  { title: 'Development', summary: 'Build automation tools and bots' },
  { title: 'Testing', summary: 'Validate the full workflow end-to-end' },
  { title: 'Deployment', summary: 'Deploy to production' },
  { title: 'Monitoring', summary: '24/7 performance tracking' },
  { title: 'Optimization', summary: 'Continuous improvement' },
];
const FB_IND = ['Textile & Fabric', 'Automotive Parts', 'Packaging', 'Cylinders & Gas', 'Electronics', 'Food & Beverage', 'Warehousing', 'Smart Homes'];
const FB_TESTI = [
  { quote: 'Downtime dropped and our quality rejects fell sharply after the vision inspection went live.', author: 'Plant Head, Textile Unit' },
  { quote: 'A clear payback and a team that actually understands the shop floor.', author: 'Operations Manager, Auto Parts' },
  { quote: 'Real-time production data changed how we run every shift.', author: 'Director, Packaging Co.' },
];

export default function Home() {
  const { content } = useSite();
  const { t } = useLang();
  const heroImg = content?.hero?.image;
  // admin-uploaded clips (Settings → hero videos) > external URLs > built-in 3 clips
  const heroVideos = parseHeroVideos(content?.hero?.videos?.length ? content.hero.videos : content?.hero?.video);
  /**
   * Decided after mount, never during render: the checks touch `navigator`
   * and `matchMedia`, and starting false means a server-rendered or
   * hydrating pass never reaches for the chunk.
   */
  const [use3D, setUse3D] = useState(false);
  useEffect(() => { setUse3D(canRun3D()); }, []);

  const [demoOpen, setDemoOpen] = useState(false);
  const [demoProduct, setDemoProduct] = useState('MDMS (Machine Data Monitoring)');

  const [services, setServices] = useState([]);
  const [tech, setTech] = useState([]);
  const [products, setProducts] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [stats, setStats] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    client.get('/services').then((r) => setServices(r.data.items || [])).catch(() => {});
    client.get('/technologies').then((r) => setTech(r.data.items || [])).catch(() => {});
    client.get('/products').then((r) => setProducts((r.data.items || []).slice(0, 3))).catch(() => {});
    client.get('/workflow').then((r) => setWorkflow(r.data.items || [])).catch(() => {});
    client.get('/stats').then((r) => setStats(r.data.items || [])).catch(() => {});
    client.get('/industries').then((r) => setIndustries(r.data.items || [])).catch(() => {});
    client.get('/testimonials').then((r) => setTestimonials(r.data.items || [])).catch(() => {});
    client.get('/clients').then((r) => setClients(r.data.items || [])).catch(() => {});
  }, []);

  const statList = stats.length ? stats : FB_STATS;
  const flowList = workflow.length ? workflow : FB_FLOW;
  const indList = industries.length ? industries.map((i) => i.title) : FB_IND;
  const testiList = testimonials.length ? testimonials : FB_TESTI;

  return (
    <>
      <Seo title="Intelligent Automation" description="RvmAiTech builds intelligent automation — process, home and industrial — with robotics, computer vision and machine intelligence." />
      {/* HERO */}
      <section className="hero" id="hero">
        {heroImg
          ? <div className="hero-video on" aria-hidden="true"><img src={heroImg} alt="" /></div>
          : <HeroVideo sources={heroVideos} />}
        {/* Sits between the video and the text. Not rendered — and therefore
            not downloaded — on devices that opt out. */}
        {use3D && (
          <Suspense fallback={null}>
            <HeroScene3D />
          </Suspense>
        )}
        <div className="wrap hero-inner">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(13, 38, 73, 0.65)', border: '1px solid rgba(244, 123, 32, 0.7)', padding: '7px 18px', borderRadius: 30, fontSize: 13.5, fontWeight: 600, color: '#ffd5ad', marginBottom: 18, backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f47b20', boxShadow: '0 0 10px #f47b20' }}></span>
            <span><b>MDMS Intelligence:</b> Real-Time Machine Telemetry · 30%+ Downtime Reduction · Live OEE</span>
          </div>
          <h1>{t('hero_l1')}<br /><span className="t2">{t('hero_l2')}</span></h1>
          <p className="lead" style={{ maxWidth: '64ch' }}>{t('hero_lead')}</p>
          <div className="hero-cta">
            <button
              type="button"
              onClick={() => { setDemoProduct('MDMS (Machine Data Monitoring)'); setDemoOpen(true); }}
              className="btn btn-primary"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {t('hero_cta1')}
            </button>
            <a href="#solutions" className="btn btn-ghost">{t('hero_cta2')}</a>
          </div>
          <div className="hero-pills">
            <div className="hero-pill"><b>30%+ Less</b> machine downtime (MDMS)</div>
            <div className="hero-pill"><b>Zero Code Change</b> edge datalogging</div>
            <div className="hero-pill"><b>100% Live</b> shop-floor OEE</div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="wrap stats-grid">
          {statList.map((s, i) => (
            <div className="stat-b" key={s._id || i}><b>{s.value}</b><span>{s.label}</span></div>
          ))}
        </div>
      </div>

      {/* ABOUT-THIS-PAGE INTRO (Admin → Pages → Home) */}
      <PageIntro pageKey="home" slot="top" />

      {/* SERVICES */}
      <section>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">What we do</div>
            <h2>Three ways we put automation to work</h2>
            <p style={{ maxWidth: 640, margin: '12px auto 0' }}>From a single machine to a whole plant to your living room — automation that fits how you operate.</p>
          </div>
          <div className="grid-3">
            {services.map((s, i) => (
              <Link className={`card link card-dynamic ${i % 2 === 0 ? 'hover-orange' : 'hover-blue'}`} to={`/services/${s.slug}`} key={s._id || i}>
                <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="card-ico card-icon-wrap">{iconFor(s.icon)}</div>
                <h3>{s.title}</h3><p>{s.summary}</p>
                {s.features?.length > 0 && <ul className="tick">{s.features.map((f, k) => <li key={k}>{toPoint(f).text}</li>)}</ul>}
                <span className="card-link card-action-link">Learn more →</span>
              </Link>
            ))}
            {services.length === 0 && <p className="muted">Services load nahi hue — backend chalu hai? (port 4000)</p>}
          </div>
        </div>
      </section>

      {/* OUR WORKFLOW */}
      <section className="soft" id="workflow">
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">How we work</div>
            <h2>Our Workflow</h2>
            <p style={{ maxWidth: 640, margin: '12px auto 0' }}>A clear, step-by-step path from your process to a running, optimised automation. Click a step for details.</p>
          </div>
          <div className="flow">
            {flowList.map((w, i) => {
              const stepSlug = w.slug || w.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const inner = (
                <>
                  <div className="flow-node">{i + 1}</div>
                  <h3>{w.title}</h3>
                  <p>{w.summary}</p>
                </>
              );
              return (
                <Link className="flow-step link" to={`/workflow/${stepSlug}`} key={w._id || i}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TECHNOLOGIES */}
      <section className="dark">
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">Our core</div>
            <h2 style={{ color: '#fff' }}>Robotics, vision and intelligence</h2>
            <p style={{ color: '#b6c6de', maxWidth: 640, margin: '12px auto 0' }}>Every solution draws on the same three strengths — so a machine can see, decide and act on its own.</p>
          </div>
          <div className="grid-3">
            {tech.map((t, i) => (
              <Link className={`cap link card-dynamic ${i % 2 === 0 ? 'hover-orange' : 'hover-blue'}`} to={`/technologies/${t.slug}`} key={t._id || i}>
                <div className="cap-ico card-icon-wrap">{iconFor(t.icon)}</div>
                <h3>{t.title}</h3><p>{t.summary}</p>
                <span className="card-link card-action-link">Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SOLUTIONS SHOWCASE (MDMS, Datalogger, Home Automation separated) */}
      <ProductSolutionsSection />

      {/* WHY CHOOSE RVMAITECH */}
      <WhyChooseSection />

      {/* CLIENTS — click a company → /clients/<slug> (its video + details) */}
      {clients.length > 0 && (
        <section>
          <div className="wrap">
            <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
              <div className="sec-kicker">Trusted by</div>
              <h2>Companies we work with</h2>
              <p>Click a company to watch the project video and read what we built together.</p>
            </div>
            <div className="clients">
              {clients.map((c) => <ClientCard client={c} key={c._id} />)}
            </div>
            <div className="clients-more"><Link to="/clients" className="card-link">All companies →</Link></div>
          </div>
        </section>
      )}

      {/* ACTUAL PROJECT RESULTS & CUSTOMER TESTIMONIALS */}
      <ProjectResultsAndTestimonials />

      {/* INDUSTRIES */}
      <section className="soft">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">Where we work</div>
            <h2>Industries we automate</h2>
          </div>
          <div className="ind-grid">
            {indList.map((i) => (
              <div className="ind" key={i}><span className="dot"></span>{i}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <FaqSection />

      {/* CTA */}
      <section>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Ready to automate?</h2>
              <p>Tell us the process you want to improve. We'll propose the right mix of robotics, vision and intelligence — with a clear payback.</p>
            </div>
            <div className="cta-actions">
              <button
                type="button"
                onClick={() => { setDemoProduct('MDMS (Machine Data Monitoring)'); setDemoOpen(true); }}
                className="btn btn-primary"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Book a Live Demo
              </button>
              <Link to="/contact" className="btn btn-ghost">Get a quote</Link>
            </div>
          </div>
        </div>
      </section>

      <DemoRequestModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        initialProduct={demoProduct}
      />
    </>
  );
}

function iconFor(key) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (key) {
    case 'process': return <svg viewBox="0 0 24 24" {...p}><path d="M4 7h16M4 12h16M4 17h10" /><circle cx="18" cy="17" r="2.2" /></svg>;
    case 'home': return <svg viewBox="0 0 24 24" {...p}><path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" /><path d="M9 21v-6h6v6" /></svg>;
    case 'industry': return <svg viewBox="0 0 24 24" {...p}><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></svg>;
    case 'robot': return <svg viewBox="0 0 24 24" {...p}><rect x="7" y="10" width="10" height="8" rx="1.5" /><path d="M12 10V6M9 6h6M5 18h14" /></svg>;
    case 'vision': return <svg viewBox="0 0 24 24" {...p}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'ai': return <svg viewBox="0 0 24 24" {...p}><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 1M15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 1V3" /></svg>;
    default: return <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
export { iconFor };
