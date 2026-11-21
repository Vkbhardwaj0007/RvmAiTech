import { useState } from 'react';
import {
  Download, Printer, X, ShieldCheck, CheckCircle2, Cpu, Zap, Wifi,
  Layers, HardDrive, Sliders, FileText, ArrowRight
} from 'lucide-react';

export default function HardwareDatasheetModal({ isOpen, onClose, variant = 'home' }) {
  const [activeTab, setActiveTab] = useState(variant); // 'home' | 'mdms'

  if (!isOpen) return null;

  const isHome = activeTab === 'home';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 24px',
          background: '#0d2649',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #0284c7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={22} color="#38bdf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Technical Specification Datasheet
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                RvmAiTech Commercial Hardware Series · Engineering Reference Manual
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Variant Selector Bar */}
        <div style={{
          padding: '10px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '10px',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'home' ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: activeTab === 'home' ? '#e0f2fe' : '#ffffff',
              color: activeTab === 'home' ? '#0369a1' : '#475569',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🏠 Home Automation Controller (RVM-HA-ESP32-8DI-8RO)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mdms')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: activeTab === 'mdms' ? '2px solid #16a34a' : '1px solid #cbd5e1',
              background: activeTab === 'mdms' ? '#dcfce7' : '#ffffff',
              color: activeTab === 'mdms' ? '#15803d' : '#475569',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🏭 Industrial MDMS Datalogger (RVM-MDMS-ESP32-POE-8DI-8DO)
          </button>
        </div>

        {/* Printable Datasheet Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0d2649', letterSpacing: '-0.02em' }}>
                RvmAiTech
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Robotics, Vision &amp; Machine Intelligence Systems · Faridabad, Haryana, India
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                ISO 9001:2015 Compliant · Industrial IoT Hardware Division
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: isHome ? '#0284c7' : '#16a34a',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontWeight: 900,
                fontSize: '0.82rem',
                display: 'inline-block',
              }}>
                {isHome ? 'MODEL: RVM-HA-ESP32-8DI-8RO' : 'MODEL: RVM-MDMS-ESP32-POE-8DI-8DO'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Revision 4.2 · Document Ref: DS-{isHome ? 'HA-2026' : 'MDMS-2026'}
              </div>
            </div>
          </div>

          {/* Product Overview Summary */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#0d2649', fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px' }}>
              1. System Overview
            </h4>
            <p style={{ color: '#334155', margin: 0 }}>
              {isHome
                ? 'The RvmAiTech RVM-HA-ESP32-8DI-8RO is an enterprise-grade 35mm DIN-rail mount smart building and home automation controller. Engineered with a dual-core ESP32-S3 microcontroller, it integrates 8 heavy-duty 10A electromechanical relays with optocoupled inputs, Modbus RTU RS485, 10/100 Ethernet RJ45, Wi-Fi, and Bluetooth 5.0 for zero-latency local offline execution and cloud voice assistant synchronization.'
                : 'The RvmAiTech RVM-MDMS-ESP32-POE-8DI-8DO is a specialized industrial edge datalogger engineered for non-invasive machine data collection and OEE telemetry. Featuring high-speed hardware pulse counters, isolated RS485 with 15kV ESD surge suppression, CAN 2.0B bus, and IEEE 802.3af PoE (Power over Ethernet), it captures spindle speeds, machine cycles, and fault conditions without modifying existing PLC programs.'}
            </p>
          </div>

          {/* Key Engineering Specifications Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#0d2649', fontSize: '1.05rem', fontWeight: 800, margin: '0 0 10px' }}>
              2. Electrical &amp; Hardware Specifications
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, width: '32%', color: '#475569' }}>Processor Core</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>Espressif ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz, 512KB SRAM, 8MB Flash</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Power Supply Input</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>{isHome ? '7V ~ 36V DC Wide Range (Polarity Protected)' : '7V ~ 36V DC Auxiliary + IEEE 802.3af PoE (37V~57V)'}</td>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Input Channels (DI)</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>
                    {isHome
                      ? '8x Optocoupler-isolated digital inputs (Active Low / Contact Closure, 5V~24V)'
                      : '8x High-speed pulse counter inputs (Up to 50 kHz for Spindle RPM / Sensor pulses)'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Output Channels</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>
                    {isHome
                      ? '8x Form C SPDT Relays (Rating: 10A 250VAC / 10A 30VDC per channel)'
                      : '8x Optocoupled NPN/PNP Digital Outputs (30VDC 500mA per channel for alarms/interlocks)'}
                  </td>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Network &amp; Fieldbus</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>
                    {isHome
                      ? 'RJ45 10/100M Ethernet, 2.4GHz Wi-Fi 802.11 b/g/n, BLE 5.0, Isolated RS485 Modbus RTU'
                      : 'RJ45 PoE Ethernet, CAN 2.0B (ISO 11898-2), Dual Isolated RS485 (Modbus RTU/TCP), Wi-Fi/4G'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Enclosure Dimensions</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>175.00mm × 90.00mm × 40.00mm (Weight: ~280g)</td>
                </tr>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Mounting Mechanism</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>Standard 35mm DIN-Rail (Dual spring latch clips) + 4x M4 Wall Screw Ears (155mm pitch)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Operating Temperature</td>
                  <td style={{ padding: '8px 12px', color: '#0f172a' }}>-20°C to +75°C (Humidity: 5% ~ 95% RH non-condensing)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terminal Pinout Map & Wiring Summary */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#0d2649', fontSize: '1.05rem', fontWeight: 800, margin: '0 0 10px' }}>
              3. Terminal Pinout Configuration
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#0369a1', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>
                  Top Terminal Strip:
                </b>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.78rem' }}>
                  <li><b>RS485:</b> A+ (Data+), B- (Data-), PE (Shield Ground)</li>
                  <li><b>Power:</b> 7~36V DC (+) and GND (-)</li>
                  <li><b>Digital Inputs:</b> DI1 to DI8 optocoupled pins with COM common</li>
                  <li><b>Connectors:</b> SMA Antenna (WiFi/4G), RJ45 Ethernet, USB Type-C</li>
                </ul>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#15803d', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>
                  Bottom Terminal Strip (CH1 - CH8):
                </b>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.78rem' }}>
                  <li><b>CH1 to CH8 Contacts:</b> NO (Normally Open), COM (Common), NC (Normally Closed)</li>
                  <li><b>Wire Gauge Supported:</b> 28 ~ 14 AWG Pluggable Phoenix screw terminals</li>
                  <li><b>Torque Rating:</b> 0.4 Nm (3.5 lb-in)</li>
                  <li><b>Protection:</b> On-board snubber circuit across contacts for inductive motor loads</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Certification & Compliance Footer */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b' }}>
            <div>
              <b>RvmAiTech Engineering Support:</b> +91 7052050656 · support@rvmaitech.com
            </div>
            <div>
              Made with pride in India 🇮🇳 · Faridabad, Haryana
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Need custom firmware or private-label hardware branding?
          </span>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '6px',
              background: '#0d2649',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Download / Print Datasheet PDF
          </button>
        </div>
      </div>
    </div>
  );
}

