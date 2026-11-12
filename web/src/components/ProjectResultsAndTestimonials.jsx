import { Star, TrendingUp, CheckCircle, ShieldCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const METRIC_RESULTS = [
  {
    metric: '34%',
    label: 'Downtime Reduction',
    sub: 'Industrial Cylinder Plant (EKC)',
    desc: 'Unplanned downtime plummeted through automated fault categorization & live shift alerts.',
  },
  {
    metric: '99.6%',
    label: 'Inspection Accuracy',
    sub: 'Textile & Precision Fabric',
    desc: 'Computer vision defect detection at line speed, reducing scrap and customer rejections.',
  },
  {
    metric: '4.2x',
    label: 'Faster Breakdown Response',
    sub: 'Auto Parts & Packaging',
    desc: 'Instant maintenance dispatch via automated WhatsApp & SMS alerts to shift engineers.',
  },
  {
    metric: '< 4 Mo.',
    label: 'Average Payback Period',
    sub: 'Machine ROI Timeline',
    desc: 'Capital recovery achieved through eliminated shift losses and increased line output.',
  },
];

const TESTIMONIALS = [
  {
    author: 'Virender Sharma',
    role: 'Plant Head',
    company: 'EKC (Everest Kanto Cylinder)',
    location: 'Faridabad, Haryana',
    rating: 5,
    quote: 'Downtime dropped by 34% within 60 days of deploying MDMS. We now have real-time visibility into every machine shift, operator cycles, and breakdown causes right from our control room and mobile phones.',
    highlight: '34% Downtime Reduction',
  },
  {
    author: 'Sunil Aggarwal',
    role: 'Operations Director',
    company: 'Precision Auto Components Ltd.',
    location: 'Gurugram / Manesar',
    rating: 5,
    quote: 'Their ability to pull telemetry directly from our legacy Siemens & Mitsubishi PLCs without touching our validated PLC program was exceptional. RvmAiTech is one of the few teams that genuinely understands both industrial electronics and modern software.',
    highlight: 'Zero PLC Code Disruption',
  },
  {
    author: 'Rajiv Mehta',
    role: 'Managing Director',
    company: 'Apex Packaging Industries',
    location: 'Faridabad Industrial Area',
    rating: 5,
    quote: 'The vision inspection system and edge dataloggers paid for themselves in less than four months. Defect leakage dropped to near zero, and our production audits are now 100% automated with zero paperwork.',
    highlight: 'Defect Leakage Dropped to ~0%',
  },
];

export default function ProjectResultsAndTestimonials() {
  return (
    <section className="results-testimonials-section" style={{ padding: '86px 0', background: '#ffffff' }}>
      <div className="wrap">
        {/* SECTION 1: ACTUAL PROJECT RESULTS */}
        <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
          <div className="sec-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Award size={15} /> Verified Shop-Floor Impact
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 8 }}>
            Real Project Results &amp; Measurable ROI
          </h2>
          <p style={{ color: '#52637a', fontSize: 17, maxWidth: 660, margin: '12px auto 0' }}>
            We measure our success by the production hours saved, defect counts eliminated, and profit delivered to factory owners.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 22,
            marginBottom: 64,
          }}
        >
          {METRIC_RESULTS.map((m, i) => (
            <div
              key={i}
              className="metric-card card link"
            >
              <div className="metric-val">
                {m.metric}
              </div>
              <div className="metric-label">
                {m.label}
              </div>
              <div className="metric-sub">
                {m.sub}
              </div>
              <p className="metric-desc">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* SECTION 2: CUSTOMER TESTIMONIALS */}
        <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
          <div className="sec-kicker">Client Trust &amp; Reviews</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 38px)', color: '#0d2649', marginTop: 8 }}>
            What Plant Heads &amp; Operations Leaders Say
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 26,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="quote-card card link"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(t.rating)].map((_, s) => (
                      <Star key={s} size={17} className="star-ico" fill="#f47b20" color="#f47b20" />
                    ))}
                  </div>
                  <span className="quote-tag">
                    {t.highlight}
                  </span>
                </div>

                <p style={{ fontSize: 15.5, lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 24px' }}>
                  “{t.quote}”
                </p>
              </div>

              <div className="quote-author-row" style={{ borderTop: '1px solid #e7effa', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="quote-avatar">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <b style={{ fontSize: 16, display: 'block' }}>{t.author}</b>
                  <span className="quote-meta" style={{ fontSize: 13 }}>
                    {t.role} · <b>{t.company}</b>
                  </span>
                  <div className="quote-loc" style={{ fontSize: 12 }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner under Testimonials */}
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
          }}
        >
          <Link to="/projects" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
            Explore Verified Case Studies &amp; Live Deployments →
          </Link>
        </div>
      </div>
    </section>
  );
}

