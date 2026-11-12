import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Cpu, Home as HomeIcon, Car, GraduationCap, Hotel,
  CheckCircle2, ArrowRight, ShieldCheck, Zap, Database, BarChart3, Clock,
} from 'lucide-react';

export default function ProductSolutionsSection() {
  const [activeTab, setActiveTab] = useState('mdms');

  return (
    <section className="product-solutions-section" id="solutions" style={{ padding: '86px 0', background: '#f4f8fd' }}>
      <div className="wrap">
        <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
          <div className="sec-kicker">Engineered Product Lines</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 8 }}>
            Intelligent Products Built for Production &amp; Scale
          </h2>
          <p style={{ color: '#52637a', fontSize: 17, maxWidth: 680, margin: '12px auto 0' }}>
            Distinct, purpose-built platforms for factory intelligence, edge hardware acquisition, and building automation.
          </p>
        </div>

        {/* Product Navigation Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 44,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('mdms')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'mdms' ? '2px solid #1351b4' : '1px solid #d0deef',
              background: activeTab === 'mdms' ? '#1351b4' : '#ffffff',
              color: activeTab === 'mdms' ? '#ffffff' : '#33475b',
              boxShadow: activeTab === 'mdms' ? '0 8px 20px -6px rgba(19, 81, 180, 0.4)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <Activity size={18} /> MDMS (Machine Monitoring)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('datalogger')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'datalogger' ? '2px solid #1351b4' : '1px solid #d0deef',
              background: activeTab === 'datalogger' ? '#1351b4' : '#ffffff',
              color: activeTab === 'datalogger' ? '#ffffff' : '#33475b',
              boxShadow: activeTab === 'datalogger' ? '0 8px 20px -6px rgba(19, 81, 180, 0.4)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <Cpu size={18} /> Industrial Datalogger
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'home' ? '2px solid #1351b4' : '1px solid #d0deef',
              background: activeTab === 'home' ? '#1351b4' : '#ffffff',
              color: activeTab === 'home' ? '#ffffff' : '#33475b',
              boxShadow: activeTab === 'home' ? '0 8px 20px -6px rgba(19, 81, 180, 0.4)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <HomeIcon size={18} /> Smart Home Automation
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enterprise')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'enterprise' ? '2px solid #1351b4' : '1px solid #d0deef',
              background: activeTab === 'enterprise' ? '#1351b4' : '#ffffff',
              color: activeTab === 'enterprise' ? '#ffffff' : '#33475b',
              boxShadow: activeTab === 'enterprise' ? '0 8px 20px -6px rgba(19, 81, 180, 0.4)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <Car size={18} /> Parking &amp; ERP Solutions
          </button>
        </div>

        {/* Tab 1: MDMS */}
        {activeTab === 'mdms' && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cce0f8',
              borderRadius: 20,
              padding: '42px 40px',
              boxShadow: '0 20px 45px -15px rgba(13, 38, 73, 0.08)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eaf2fd', color: '#1351b4', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <Activity size={16} /> FLAGSHIP PLATFORM
                </div>
                <h3 style={{ fontSize: 32, color: '#0d2649', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>
                  MDMS — Machine Data Management System
                </h3>
                <p style={{ color: '#4a5b73', fontSize: 16.5, lineHeight: 1.7, marginBottom: 24 }}>
                  Stop guessing why production lines stop. MDMS transforms raw machine pulses and PLC variables into real-time OEE metrics, automated downtime root causes, and instant shift productivity reports.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#f47b20" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Live OEE Tracking:</b> Availability, Performance, Quality</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#f47b20" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Auto Downtime Logs:</b> Eliminate manual paper logs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#f47b20" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Predictive Health:</b> Temperature, vibration &amp; load alerts</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#f47b20" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>ERP &amp; Cloud API:</b> Push data to SAP, Oracle or custom ERP</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link to="/contact?product=MDMS" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
                    Request MDMS Quotation &amp; Demo
                  </Link>
                  <Link to="/products?category=MDMS" className="btn btn-ghost" style={{ padding: '12px 20px', fontSize: 15 }}>
                    Explore All 6 MDMS Versions →
                  </Link>
                </div>
              </div>

              {/* MDMS Value Box */}
              <div style={{ background: '#f8fbff', border: '1px solid #d4e4f7', borderRadius: 16, padding: '32px 28px' }}>
                <h4 style={{ color: '#0d2649', fontSize: 19, margin: '0 0 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={20} color="#1351b4" /> Quantifiable Business ROI
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2edf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <b style={{ color: '#0d2649', fontSize: 15 }}>Unplanned Downtime Reduction</b>
                      <div style={{ color: '#687b95', fontSize: 13 }}>Average improvement across deployed plants</div>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#1351b4' }}>30% - 40%</span>
                  </div>

                  <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2edf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <b style={{ color: '#0d2649', fontSize: 15 }}>Average Payback Period</b>
                      <div style={{ color: '#687b95', fontSize: 13 }}>Recover system investment in record time</div>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#f47b20' }}>&lt; 4 Months</span>
                  </div>

                  <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2edf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <b style={{ color: '#0d2649', fontSize: 15 }}>Pricing Tier</b>
                      <div style={{ color: '#687b95', fontSize: 13 }}>Modular per machine or plant-wide license</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0d2649', background: '#eaf2fd', padding: '6px 12px', borderRadius: 6 }}>Custom Quote</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Datalogger */}
        {activeTab === 'datalogger' && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cce0f8',
              borderRadius: 20,
              padding: '42px 40px',
              boxShadow: '0 20px 45px -15px rgba(13, 38, 73, 0.08)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff2e8', color: '#f47b20', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <Cpu size={16} /> INDUSTRIAL EDGE HARDWARE
                </div>
                <h3 style={{ fontSize: 32, color: '#0d2649', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>
                  Industrial Datalogger — Edge IoT Gateway
                </h3>
                <p style={{ color: '#4a5b73', fontSize: 16.5, lineHeight: 1.7, marginBottom: 24 }}>
                  Connects directly to machine PLCs, energy meters, analog sensors, and digital counters. Zero modification to your existing PLC ladder logic or machine warranty.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#1351b4" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Multi-PLC Support:</b> Siemens, Mitsubishi, Delta, Omron</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#1351b4" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Non-Intrusive:</b> Reads data without code changes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#1351b4" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Local Buffering:</b> Stores offline data during network drops</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#1351b4" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>DIN-Rail Mount:</b> Rugged IP-rated industrial enclosure</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link to="/contact?product=Industrial%20Datalogger" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
                    Request Hardware Quotation
                  </Link>
                  <Link to="/products?category=Datalogger" className="btn btn-ghost" style={{ padding: '12px 20px', fontSize: 15 }}>
                    View Datalogger Models →
                  </Link>
                </div>
              </div>

              {/* Datalogger Specs Box */}
              <div style={{ background: '#f8fbff', border: '1px solid #d4e4f7', borderRadius: 16, padding: '32px 28px' }}>
                <h4 style={{ color: '#0d2649', fontSize: 19, margin: '0 0 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Database size={20} color="#f47b20" /> Hardware Highlights
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <span style={{ fontSize: 12.5, color: '#687b95', textTransform: 'uppercase', fontWeight: 700 }}>Communication Interfaces</span>
                    <div style={{ color: '#0d2649', fontSize: 15, fontWeight: 600, marginTop: 4 }}>RS485 (Modbus RTU), Ethernet (Modbus TCP/IP), Wi-Fi, 4G LTE</div>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <span style={{ fontSize: 12.5, color: '#687b95', textTransform: 'uppercase', fontWeight: 700 }}>Analog &amp; Digital I/O</span>
                    <div style={{ color: '#0d2649', fontSize: 15, fontWeight: 600, marginTop: 4 }}>Opto-isolated 24V inputs, 4-20mA, 0-10V, thermocouple sensors</div>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <span style={{ fontSize: 12.5, color: '#687b95', textTransform: 'uppercase', fontWeight: 700 }}>Pricing Structure</span>
                    <div style={{ color: '#1351b4', fontSize: 15, fontWeight: 700, marginTop: 4 }}>Direct Manufacturer Pricing · Volume Discounts for OEMs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Home Automation */}
        {activeTab === 'home' && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cce0f8',
              borderRadius: 20,
              padding: '42px 40px',
              boxShadow: '0 20px 45px -15px rgba(13, 38, 73, 0.08)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eafaf1', color: '#107e44', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <HomeIcon size={16} /> RESIDENTIAL &amp; COMMERCIAL AUTOMATION
                </div>
                <h3 style={{ fontSize: 32, color: '#0d2649', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.25 }}>
                  Smart Home Automation — Retrofit to Building Scale
                </h3>
                <p style={{ color: '#4a5b73', fontSize: 16.5, lineHeight: 1.7, marginBottom: 24 }}>
                  Make existing homes smart in 2 hours with compact modules that slip behind your wall switches. No wall breaking, no rewiring, and physical switches continue to work normally.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#107e44" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Retrofit Switches:</b> Fits behind existing switchboards</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#107e44" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Offline Functionality:</b> Operates locally without internet</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#107e44" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Voice &amp; App Control:</b> Alexa, Google Assistant &amp; iOS/Android</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={18} color="#107e44" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14.5, color: '#2a3a52' }}><b>Energy Monitoring:</b> Track appliance power consumption live</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link to="/contact?product=Smart%20Home%20Automation" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
                    Book Free Site Survey &amp; Estimate
                  </Link>
                  <Link to="/products?category=Smart%20Home%20Automation" className="btn btn-ghost" style={{ padding: '12px 20px', fontSize: 15 }}>
                    See Home Automation Kits →
                  </Link>
                </div>
              </div>

              {/* Home Packages Box */}
              <div style={{ background: '#f8fbff', border: '1px solid #d4e4f7', borderRadius: 16, padding: '32px 28px' }}>
                <h4 style={{ color: '#0d2649', fontSize: 19, margin: '0 0 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={20} color="#107e44" /> Package Options
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <b style={{ color: '#0d2649', fontSize: 15 }}>HA-Lite (Retrofit Switch Kit)</b>
                    <div style={{ color: '#687b95', fontSize: 13, marginTop: 3 }}>Ideal for 1–3 BHK flats, rental apartments (lighting &amp; fans)</div>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <b style={{ color: '#0d2649', fontSize: 15 }}>HA-Home (Whole-Home Controller)</b>
                    <div style={{ color: '#687b95', fontSize: 13, marginTop: 3 }}>AC, curtains, scenes, energy telemetry, water tank controller</div>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: '1px solid #e4edf8' }}>
                    <b style={{ color: '#0d2649', fontSize: 15 }}>HA-Building (Commercial &amp; Villa BMS)</b>
                    <div style={{ color: '#687b95', fontSize: 13, marginTop: 3 }}>Multi-floor centralized dashboard, access control, energy reports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Smart Parking & ERP */}
        {activeTab === 'enterprise' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 24,
            }}
          >
            {/* Smart Parking */}
            <div className="sol-card card link card-dynamic hover-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="sol-ico card-icon-wrap">
                  <Car size={24} />
                </div>
                <div className="sol-tag tag-badge">Automated Facility</div>
                <h3 style={{ fontSize: 21, marginBottom: 10 }}>Smart Parking System</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 16 }}>
                  ANPR cameras, automated boom barriers, ultrasonic slot guidance, Fastag/RFID integration, and digital payment billing.
                </p>
                <ul className="sol-list" style={{ padding: 0, margin: '0 0 20px', listStyle: 'none' }}>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> 99.4% ANPR license plate recognition</li>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> Zero queue entry via automated barrier</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/products?category=Smart%20Parking" className="card-link card-action-link" style={{ flex: 1, fontSize: 14 }}>Details →</Link>
                <Link to="/contact?product=Smart%20Parking" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Enquire</Link>
              </div>
            </div>

            {/* School ERP */}
            <div className="sol-card card link card-dynamic hover-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="sol-ico card-icon-wrap">
                  <GraduationCap size={24} />
                </div>
                <div className="sol-tag tag-badge">Education Tech</div>
                <h3 style={{ fontSize: 21, marginBottom: 10 }}>School ERP Suite</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 16 }}>
                  Campus management system for admissions, automated online fee collection, RFID/biometric attendance, report cards, and parent apps.
                </p>
                <ul className="sol-list" style={{ padding: 0, margin: '0 0 20px', listStyle: 'none' }}>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> Automated fee receipts &amp; SMS alerts</li>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> Integrated student GPS transport tracking</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/software-development/school-erp" className="card-link card-action-link" style={{ flex: 1, fontSize: 14 }}>Details →</Link>
                <Link to="/contact?subject=School%20ERP%20Suite%20Enquiry" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Enquire</Link>
              </div>
            </div>

            {/* Hotel ERP */}
            <div className="sol-card card link card-dynamic hover-blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="sol-ico card-icon-wrap">
                  <Hotel size={24} />
                </div>
                <div className="sol-tag tag-badge">Hospitality Tech</div>
                <h3 style={{ fontSize: 21, marginBottom: 10 }}>Hotel &amp; Resort PMS</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 16 }}>
                  All-in-one hospitality PMS: front-desk reservations, express check-in/out, restaurant POS, housekeeping automation, and channel manager sync.
                </p>
                <ul className="sol-list" style={{ padding: 0, margin: '0 0 20px', listStyle: 'none' }}>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> Instant multi-counter restaurant POS</li>
                  <li style={{ fontSize: 13.5, marginBottom: 6, display: 'flex', gap: 6 }}><span>✓</span> Live room inventory &amp; billing sync</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/software-development/hotel-erp" className="card-link card-action-link" style={{ flex: 1, fontSize: 14 }}>Details →</Link>
                <Link to="/contact?subject=Hotel%20PMS%20Enquiry" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Enquire</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

