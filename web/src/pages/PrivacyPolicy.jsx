import { PageHero } from './_hero.jsx';
import Seo from '../components/Seo';
import { ShieldCheck, Lock, FileText, Mail, MapPin } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <>
      <Seo
        title="Privacy Policy | RvmAiTech"
        description="Privacy policy of RvmAiTech. Learn how we collect, handle and safeguard your business and contact data."
      />
      <PageHero kicker="Legal & Compliance" title="Privacy Policy" sub="Your trust and data security are fundamental to our engineering partnerships." />

      <section style={{ padding: '70px 0 90px', background: '#ffffff' }}>
        <div className="wrap" style={{ maxWidth: 860, color: '#3f4d63', fontSize: 16, lineHeight: 1.8 }}>
          <div style={{ background: '#f5f9ff', border: '1px solid #d4e3f8', borderRadius: 14, padding: '20px 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
            <ShieldCheck size={28} color="#1351b4" style={{ flexShrink: 0 }} />
            <div>
              <b style={{ color: '#0d2649', fontSize: 16 }}>Last Updated: November 2026</b>
              <div style={{ fontSize: 14, color: '#5b6c84' }}>Effective for all clients, visitors, and commercial partners interacting with RvmAiTech.</div>
            </div>
          </div>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>1. Information We Collect</h3>
          <p>
            When you interact with <b>RvmAiTech</b> (through our website, quotation requests, product demo forms, or direct email/WhatsApp communication), we collect only the necessary operational data, including:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 20 }}>
            <li><b>Contact Details:</b> Name, business email, telephone/WhatsApp number, designation, and company/plant name.</li>
            <li><b>Technical &amp; Project Requirements:</b> Information regarding your machinery, PLCs, production lines, or home premises shared for solution scoping and quotations.</li>
            <li><b>Usage Telemetry &amp; Analytics:</b> Anonymized site interaction metrics via Google Analytics (browser type, device resolution, pages viewed) to improve user experience.</li>
          </ul>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Data</h3>
          <p>
            We process your information strictly for legitimate commercial and technical engineering purposes:
          </p>
          <ul style={{ paddingLeft: 22, marginBottom: 20 }}>
            <li>To evaluate your automation requirements and deliver customized technical proposals and commercial quotations.</li>
            <li>To schedule and conduct live demonstrations of MDMS, Industrial Dataloggers, Smart Parking, and ERP platforms.</li>
            <li>To deliver on-site commissioning, customer support, and system maintenance.</li>
            <li>We <b>never</b> sell, rent, or trade your personal or industrial data to third-party marketing brokers.</li>
          </ul>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>3. Industrial Data Confidentiality (MDMS &amp; Edge Hardware)</h3>
          <p>
            We adhere to strict confidentiality regarding your plant’s operational telemetry, cycle counts, machine architectures, and proprietary production data. All customer installations use secure, encrypted data channels (TLS/SSL, authenticated MQTT, isolated RS485 loops) with strict role-based access control.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>4. Data Protection &amp; Security</h3>
          <p>
            We implement industry-standard technical measures, including HTTPS SSL encryption, secure credential hashing (Argon2 / Bcrypt), firewalled server infrastructure, and strict HTTP security headers (Helmet, CSRF protection, Content Security Policies) to safeguard your data against unauthorized access.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>5. Contact &amp; Grievance Redressal</h3>
          <p>
            If you have questions, corrections, or concerns regarding your data privacy, please contact our compliance desk:
          </p>
          <div style={{ background: '#f8fbff', border: '1px solid #dce8f8', borderRadius: 12, padding: '20px 24px', marginTop: 16 }}>
            <b style={{ color: '#0d2649', fontSize: 16 }}>RvmAiTech Automation Private Solutions</b>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><MapPin size={16} color="#f47b20" /> Sharmik Vihar, Sector 31, Faridabad, Haryana — 121003, India</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><Mail size={16} color="#f47b20" /> rvmaitech2026@gmail.com</div>
          </div>
        </div>
      </section>
    </>
  );
}

