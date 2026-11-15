import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';

const FAQS = [
  {
    q: 'Does RvmAiTech provide custom software development?',
    a: 'Yes. We engineer bespoke industrial software solutions ranging from edge data ingestion agents, machine vision inspection algorithms, and SCADA/HMI interfaces to full-stack web dashboards, cloud analytics portals, and ERP/MES integrations (including School ERP and Hotel ERP). Every software suite is built to match your operational workflows.',
  },
  {
    q: 'Can you integrate existing PLC systems?',
    a: 'Absolutely. We specialize in non-intrusive integration with all major industrial PLCs—including Siemens (S7-1200/1500/300), Mitsubishi, Delta, Omron, ABB, Schneider, Inovance, and Allen-Bradley. We communicate via Modbus RTU/TCP, Profinet, Ethernet/IP, and serial protocols without altering your machine’s existing operational program.',
  },
  {
    q: 'Do you provide industrial IoT solutions?',
    a: 'Yes. Our end-to-end Industrial IoT (IIoT) ecosystem includes industrial-grade DIN-rail edge dataloggers, secure telemetry gateways, multi-sensor interfacing (temperature, vibration, energy, pressure, digital I/O), and cloud/on-premise MDMS monitoring platforms with automated alerts.',
  },
  {
    q: 'Do you provide installation services?',
    a: 'Yes. Our engineering team handles complete on-site installation, industrial panel wiring, sensor calibration, local network setup, system commissioning, and comprehensive on-site operator training across industrial plants, commercial sites, and residential buildings.',
  },
  {
    q: 'Can you develop custom hardware?',
    a: 'Yes. We design and manufacture custom embedded hardware, microcontroller architectures (STM32, ESP32, ARM Cortex), isolated multi-channel relay modules, smart switch retrofits, and sensor acquisition cards tailored specifically to your physical and electrical requirements.',
  },
  {
    q: 'Do you offer international services?',
    a: 'Yes. We provide remote engineering consulting, custom software development, IoT architecture design, and pre-configured plug-and-play hardware kits for international clients, backed by comprehensive documentation, remote commissioning, and online technical support.',
  },
  {
    q: 'How can I request a quotation?',
    a: 'You can request a quotation directly through our Contact form, by clicking "Get Quote" on any product page, or by reaching out to us via Email (rvmaitech2026@gmail.com) or WhatsApp/Phone (+91 7052050656). Provide a brief summary of your machines or process, and our engineering team will share a detailed technical proposal and estimate within 24 hours.',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section className="faq-section" id="faq" style={{ background: '#f8fbff', borderTop: '1px solid #e1eaf5', borderBottom: '1px solid #e1eaf5', padding: '80px 0' }}>
      <div className="wrap" style={{ maxWidth: 940 }}>
        <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 44px' }}>
          <div className="sec-kicker" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <HelpCircle size={15} /> Frequently Asked Questions
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 8 }}>
            Got Questions? We Have Answers.
          </h2>
          <p style={{ color: '#52637a', fontSize: 17, maxWidth: 620, margin: '12px auto 0' }}>
            Everything you need to know about our automation capabilities, hardware integration, and project lifecycle.
          </p>
        </div>

        <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className={`faq-item faq-item-3d ${isOpen ? 'active' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="faq-btn-3d"
                  aria-expanded={isOpen}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span className="faq-num-3d">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq-q-text">
                      {faq.q}
                    </span>
                  </div>
                  <span className={`faq-arrow-3d ${isOpen ? 'open' : ''}`}>
                    <ChevronDown size={18} />
                  </span>
                </button>
                {isOpen && (
                  <div className="faq-ans-3d">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="faq-cta-3d">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="faq-cta-ico-3d">
              <MessageSquare size={22} />
            </div>
            <div>
              <b style={{ color: '#ffffff', fontSize: 17, display: 'block', marginBottom: 2 }}>Have a specific technical question?</b>
              <div style={{ color: '#cbd5e1', fontSize: 14.5 }}>Talk directly to our automation &amp; robotics engineers.</div>
            </div>
          </div>
          <Link to="/contact" className="btn-3d-orange" style={{ padding: '12px 22px', fontSize: 14.5 }}>
            Ask Our Engineering Team →
          </Link>
        </div>
      </div>
    </section>
  );
}

