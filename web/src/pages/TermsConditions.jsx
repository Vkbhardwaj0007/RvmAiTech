import { PageHero } from './_hero.jsx';
import Seo from '../components/Seo';
import { FileText, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
  return (
    <>
      <Seo
        title="Terms & Conditions | RvmAiTech"
        description="Terms and conditions of service, hardware warranty, and software licensing for RvmAiTech automation solutions."
      />
      <PageHero kicker="Commercial Terms" title="Terms & Conditions" sub="Clear, transparent terms governing our automation systems, software licensing, and hardware delivery." />

      <section style={{ padding: '70px 0 90px', background: '#ffffff' }}>
        <div className="wrap" style={{ maxWidth: 860, color: '#3f4d63', fontSize: 16, lineHeight: 1.8 }}>
          <div style={{ background: '#f5f9ff', border: '1px solid #d4e3f8', borderRadius: 14, padding: '20px 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
            <FileText size={28} color="#1351b4" style={{ flexShrink: 0 }} />
            <div>
              <b style={{ color: '#0d2649', fontSize: 16 }}>Agreement of Service &amp; Commercial Terms</b>
              <div style={{ fontSize: 14, color: '#5b6c84' }}>By accessing this site, placing purchase orders, or contracting our engineering services, you agree to these terms.</div>
            </div>
          </div>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>1. Quotations &amp; Commercial Proposals</h3>
          <p>
            All commercial quotations provided by RvmAiTech (for MDMS licenses, Edge Dataloggers, Smart Parking systems, ERP suites, or custom robotics cells) are valid for thirty (30) calendar days from issuance, unless explicitly stated otherwise in the written proposal. Quotations reflect agreed project scope, machine count, and electrical interfaces.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>2. Hardware Supply &amp; Installation</h3>
          <ul style={{ paddingLeft: 22, marginBottom: 20 }}>
            <li><b>Pre-Commissioning Readiness:</b> Client must ensure site access, adequate power supply (stabilized 230V AC / 24V DC as specified), network/Ethernet connectivity, and designated machine maintenance windows.</li>
            <li><b>Warranty Terms:</b> All proprietary RvmAiTech hardware (Dataloggers, relay switch controllers, sensor interface boards) carries a standard twelve (12) month manufacturer warranty against manufacturing defects from the date of handover.</li>
            <li><b>Exclusions:</b> Warranty does not cover physical damage, water ingress beyond IP rating, electrical surges exceeding surge-protection limits, or unapproved third-party modifications to the panel wiring.</li>
          </ul>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>3. Software Licensing (MDMS &amp; ERP Platforms)</h3>
          <p>
            RvmAiTech grants the client a non-exclusive, non-transferable license to use the deployed software (MDMS dashboards, School ERP, Hotel ERP, Parking Management Suite) on authorized plant nodes or cloud instances. Intellectual property rights, proprietary algorithms, source code, and underlying microservice architectures remain the sole property of RvmAiTech.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>4. Annual Maintenance Contracts (AMC) &amp; Technical Support</h3>
          <p>
            Following initial warranty expiration, clients may enroll in comprehensive or non-comprehensive Annual Maintenance Contracts (AMCs) providing guaranteed response times, proactive firmware updates, periodic sensor calibration, and 24/7 technical hotline access.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>5. Limitation of Liability</h3>
          <p>
            RvmAiTech shall not be liable for indirect, incidental, or consequential damages resulting from plant-level power outages, operator negligence, third-party internet downtime, or unmaintained legacy machinery outside our direct scope of supply.
          </p>

          <h3 style={{ color: '#0d2649', fontSize: 22, marginTop: 32, marginBottom: 12 }}>6. Governing Law &amp; Jurisdiction</h3>
          <p>
            These terms and all commercial agreements are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in <b>Faridabad, Haryana, India</b>.
          </p>

          <div style={{ marginTop: 40, borderTop: '1px solid #e2edf8', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <span>Have questions regarding commercial contracts or SLA agreements?</span>
            <Link to="/contact" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}>
              Contact Legal &amp; Commercial Team →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

