import { Cpu, Factory, LifeBuoy, CloudCog, Sliders, Wrench, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const REASONS = [
  {
    icon: Cpu,
    title: 'Custom Hardware + Software Development',
    desc: 'We engineer proprietary embedded electronics, industrial DIN-rail dataloggers, and custom firmware paired seamlessly with bespoke web dashboards and local HMI software.',
    badge: 'In-House R&D',
  },
  {
    icon: Factory,
    title: 'Industrial Automation Expertise',
    desc: 'Deep shop-floor engineering experience across Siemens, Mitsubishi, Delta, and Omron PLCs, robotic cell programming, SCADA, and high-speed computer vision inspection.',
    badge: 'Shop-Floor Proven',
  },
  {
    icon: LifeBuoy,
    title: 'End-to-End Project Support',
    desc: 'From initial site visit, process study, and mechanical/electrical design to hardware assembly, field deployment, testing, and comprehensive operator training.',
    badge: 'Turnkey Delivery',
  },
  {
    icon: CloudCog,
    title: 'IoT and Cloud Integration',
    desc: 'Transform legacy standalone machinery into connected assets with real-time cloud sync, live telemetry, predictive anomaly alerts, and ERP/MES integrations.',
    badge: 'Cloud & Edge Sync',
  },
  {
    icon: Sliders,
    title: 'Custom Solutions',
    desc: 'No cookie-cutter setups. Every hardware interface, data protocol, and software view is tailored specifically to your plant’s physical constraints and business metrics.',
    badge: '100% Tailored',
  },
  {
    icon: Wrench,
    title: 'Technical Support & Maintenance',
    desc: 'Rapid-response engineering support, proactive system health monitoring, SLA-backed maintenance contracts, and on-demand spare part availability to ensure maximum uptime.',
    badge: '24/7 Reliability',
  },
];

export default function WhyChooseSection() {
  return (
    <section className="why-choose-section" id="why-choose" style={{ padding: '84px 0', background: '#ffffff' }}>
      <div className="wrap">
        <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
          <div className="sec-kicker">Our Value Advantage</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 8 }}>
            Why Choose RvmAiTech?
          </h2>
          <p style={{ color: '#52637a', fontSize: 17, maxWidth: 660, margin: '12px auto 0' }}>
            We combine shop-floor engineering mastery, custom hardware fabrication, and modern AI software to build automation that actually delivers ROI.
          </p>
        </div>

        <div
          className="why-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 26,
          }}
        >
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className={`why-card card link card-dynamic ${i % 2 === 0 ? 'hover-orange' : 'hover-blue'}`}
              >
                <div className="why-top-bar" />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div className="why-ico card-icon-wrap">
                      <Icon size={26} strokeWidth={1.9} />
                    </div>
                    <span className="why-badge tag-badge">
                      {r.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, lineHeight: 1.35 }}>
                    {r.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                    {r.desc}
                  </p>
                </div>

                <div className="why-foot">
                  <Link
                    to="/contact"
                    className="why-link card-action-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Consult an expert <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

