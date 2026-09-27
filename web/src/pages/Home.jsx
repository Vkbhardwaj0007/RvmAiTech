import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Seo from '../components/Seo';
import { useSite } from '../api/SiteContext';
import { useLang } from '../api/Lang';
import HeroVideo, { parseHeroVideos } from '../components/HeroVideo';

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
      <section className="hero">
        {heroImg
          ? <div className="hero-video on" aria-hidden="true"><img src={heroImg} alt="" /></div>
          : <HeroVideo sources={heroVideos} />}
        <div className="wrap hero-inner">
          <span className="eyebrow">{t('hero_eyebrow')}</span>
          <h1>{t('hero_l1')}<br /><span className="t2">{t('hero_l2')}</span></h1>
          <p className="lead">{t('hero_lead')}</p>
          <div className="hero-cta">
            <Link to="/contact" className="btn btn-primary">{t('hero_cta1')}</Link>
            <Link to="/services" className="btn btn-ghost">{t('hero_cta2')}</Link>
          </div>
          <div className="hero-pills">
            <div className="hero-pill"><b>Higher</b> accuracy</div>
            <div className="hero-pill"><b>Less</b> downtime</div>
            <div className="hero-pill"><b>Lower</b> cost per unit</div>
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

      {/* SERVICES */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">What we do</div>
            <h2>Three ways we put automation to work</h2>
            <p>From a single machine to a whole plant to your living room — automation that fits how you operate.</p>
          </div>
          <div className="grid-3">
            {services.map((s, i) => (
              <Link className="card link" to={`/services/${s.slug}`} key={s._id || i}>
                <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="card-ico">{iconFor(s.icon)}</div>
                <h3>{s.title}</h3><p>{s.summary}</p>
                {s.features?.length > 0 && <ul className="tick">{s.features.map((f, k) => <li key={k}>{f}</li>)}</ul>}
                <span className="card-link">Learn more →</span>
              </Link>
            ))}
            {services.length === 0 && <p className="muted">Services load nahi hue — backend chalu hai? (port 4000)</p>}
          </div>
        </div>
      </section>

      {/* OUR WORKFLOW */}
      <section className="soft" id="workflow">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">How we work</div>
            <h2>Our Workflow</h2>
            <p>A clear, step-by-step path from your process to a running, optimised automation. Click a step for details.</p>
          </div>
          <div className="flow">
            {flowList.map((w, i) => {
              const inner = (
                <>
                  <div className="flow-node">{i + 1}</div>
                  <h3>{w.title}</h3>
                  <p>{w.summary}</p>
                </>
              );
              return w.slug
                ? <Link className="flow-step link" to={`/workflow/${w.slug}`} key={w._id || i}>{inner}</Link>
                : <div className="flow-step" key={i}>{inner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* TECHNOLOGIES */}
      <section className="dark">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">Our core</div>
            <h2 style={{ color: '#fff' }}>Robotics, vision and intelligence</h2>
            <p style={{ color: '#b6c6de' }}>Every solution draws on the same three strengths — so a machine can see, decide and act on its own.</p>
          </div>
          <div className="grid-3">
            {tech.map((t, i) => (
              <Link className="cap link" to={`/technologies/${t.slug}`} key={t._id || i}>
                <div className="cap-ico">{iconFor(t.icon)}</div>
                <h3>{t.title}</h3><p>{t.summary}</p>
                <span className="card-link" style={{ color: 'var(--orange-soft)' }}>Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS PREVIEW */}
      {products.length > 0 && (
        <section>
          <div className="wrap">
            <div className="sec-head">
              <div className="sec-kicker">Our products</div>
              <h2>Hardware &amp; software, ready to deploy</h2>
            </div>
            <div className="grid-3">
              {products.map((p) => (
                <article className="card" key={p._id}>
                  <div className="prod-cat">{p.category}</div>
                  <h3>{p.name}</h3><p>{p.summary}</p>
                  <Link to="/products" className="card-link">View products →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* CLIENTS */}
      {clients.length > 0 && (
        <section>
          <div className="wrap">
            <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
              <div className="sec-kicker">Trusted by</div>
              <h2>Companies we work with</h2>
            </div>
            <div className="clients">
              {clients.map((c) => (
                c.url
                  ? <a className="client" href={c.url} target="_blank" rel="noreferrer" key={c._id}>{c.logo ? <img src={c.logo} alt={c.name} /> : <span>{c.name}</span>}</a>
                  : <div className="client" key={c._id}>{c.logo ? <img src={c.logo} alt={c.name} /> : <span>{c.name}</span>}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">Client voices</div>
            <h2>Results that speak</h2>
          </div>
          <div className="grid-3">
            {testiList.map((t, i) => (
              <article className="quote" key={t._id || i}>
                <div className="q-mark">“</div>
                <p>{t.quote}</p>
                <div className="q-by">{t.author}{t.role ? ` · ${t.role}` : ''}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2>Ready to automate?</h2>
              <p>Tell us the process you want to improve. We'll propose the right mix of robotics, vision and intelligence — with a clear payback.</p>
            </div>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">Get a quote</Link>
              <Link to="/products" className="btn btn-ghost">See products</Link>
            </div>
          </div>
        </div>
      </section>
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
