import { useState } from 'react';
import {
  Zap, Cpu, CheckCircle2, AlertTriangle, HelpCircle, HardDrive,
  Layers, Server, Sliders, ArrowRight
} from 'lucide-react';

export default function HardwareWiringGuide() {
  const [activeTab, setActiveTab] = useState('mdms-plc'); // 'mdms-plc' | 'home-relays' | 'power-poe'

  return (
    <div style={{
      background: '#0a1626',
      borderRadius: '16px',
      border: '1.5px solid rgba(56, 189, 248, 0.25)',
      padding: '28px 24px',
      color: '#ffffff',
      margin: '28px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        <div>
          <div className="sec-kicker" style={{ color: '#38bdf8', fontSize: '0.75rem' }}>Field Technician &amp; Integrator Manual</div>
          <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
            Interactive Hardware Wiring &amp; Pinout Guide
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Standard industrial schematics for connecting RvmAiTech controllers to factory PLCs, machines, and building electrical panels.
          </p>
        </div>

        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('mdms-plc')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'mdms-plc' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🏭 PLC / CNC to MDMS
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('home-relays')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'home-relays' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🏠 Smart Home 8CH Relays
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('power-poe')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'power-poe' ? '#0284c7' : 'transparent',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ⚡ Power &amp; PoE Setup
          </button>
        </div>
      </div>

      {/* Guide Content Panels */}
      {activeTab === 'mdms-plc' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Schematic Diagram Card */}
          <div style={{ background: '#050c18', padding: '20px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', textTransform: 'uppercase' }}>
              Non-Invasive RS485 Modbus &amp; High-Speed Pulse Tap:
            </div>

            <svg viewBox="0 0 460 220" width="100%" height="auto" style={{ display: 'block' }}>
              {/* Siemens / Delta PLC Block */}
              <rect x="20" y="30" width="120" height="150" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
              <text x="80" y="60" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">FACTORY PLC</text>
              <text x="80" y="80" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">Siemens / Delta</text>

              {/* PLC Ports */}
              <circle cx="140" cy="110" r="5" fill="#38bdf8" />
              <text x="110" y="114" fill="#38bdf8" fontSize="10" textAnchor="end">RS485 (A+)</text>
              <circle cx="140" cy="135" r="5" fill="#f59e0b" />
              <text x="110" y="139" fill="#f59e0b" fontSize="10" textAnchor="end">RS485 (B-)</text>
              <circle cx="140" cy="160" r="5" fill="#22c55e" />
              <text x="110" y="164" fill="#22c55e" fontSize="10" textAnchor="end">Spindle Pulse</text>

              {/* RvmAiTech MDMS Module Block */}
              <rect x="290" y="20" width="150" height="170" rx="8" fill="#0f2438" stroke="#16a34a" strokeWidth="2" />
              <text x="365" y="45" fill="#22c55e" fontSize="11" fontWeight="bold" textAnchor="middle">RvmAiTech MDMS</text>
              <text x="365" y="62" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">RVM-MDMS-8DI-8DO</text>

              {/* MDMS Ports */}
              <circle cx="290" cy="110" r="5" fill="#38bdf8" />
              <text x="320" y="114" fill="#38bdf8" fontSize="10">Pin A+ (Data+)</text>
              <circle cx="290" cy="135" r="5" fill="#f59e0b" />
              <text x="320" y="139" fill="#f59e0b" fontSize="10">Pin B- (Data-)</text>
              <circle cx="290" cy="160" r="5" fill="#22c55e" />
              <text x="320" y="164" fill="#22c55e" fontSize="10">DI1 (Pulse In)</text>

              {/* Twisted Pair Connecting Lines */}
              <path d="M 145 110 Q 215 95 285 110" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
              <path d="M 145 135 Q 215 150 285 135" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              <path d="M 145 160 Q 215 175 285 160" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeDasharray="4 4" />

              <rect x="180" y="115" width="70" height="20" rx="4" fill="#0b1728" stroke="#38bdf8" strokeWidth="1" />
              <text x="215" y="129" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">120Ω Term</text>
            </svg>
          </div>

          {/* Wiring Instructions Details */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 10px' }}>
              Step-by-Step PLC Integration Guide
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.7 }}>
              <li>
                <b>1. Zero-Program Modification:</b> Connect the shielded twisted-pair wire from the machine PLC's RS485 communication port (Port 0 / Port 1) directly to RvmAiTech Pin <b>A+</b> and <b>B-</b>. Existing machine ladder logic remains 100% untouched.
              </li>
              <li>
                <b>2. Termination Resistor:</b> For cable runs exceeding 50 meters, bridge a 120Ω 1/4W resistor across A+ and B- to eliminate line reflection and interference.
              </li>
              <li>
                <b>3. Spindle / Cycle Pulse Input:</b> Connect the 24V PNP proximity sensor on the CNC spindle or flywheel to <b>DI1</b> with sensor 0V connected to <b>COM</b>. The hardware counter samples up to 50,000 pulses/second.
              </li>
              <li>
                <b>4. Grounding:</b> Fasten the cable shield foil to <b>PE</b> (Protective Earth) at one end only to prevent ground loops.
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'home-relays' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div style={{ background: '#050c18', padding: '20px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', textTransform: 'uppercase' }}>
              8-Channel Heavy-Duty Relay Contact Wiring:
            </div>

            <svg viewBox="0 0 460 210" width="100%" height="auto" style={{ display: 'block' }}>
              {/* AC Mains Input */}
              <rect x="20" y="40" width="100" height="120" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
              <text x="70" y="75" fill="#fca5a5" fontSize="11" fontWeight="bold" textAnchor="middle">230V AC MAINS</text>
              <text x="70" y="105" fill="#ffffff" fontSize="10" textAnchor="middle">Line (Phase) &amp; N</text>

              {/* RvmAiTech Home Module */}
              <rect x="180" y="30" width="140" height="140" rx="8" fill="#0f2438" stroke="#0284c7" strokeWidth="2" />
              <text x="250" y="60" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">RVM-HA-8RO</text>
              <text x="250" y="80" fill="#ffffff" fontSize="10" textAnchor="middle">CH1 Relay (10A)</text>
              <circle cx="210" cy="120" r="4" fill="#38bdf8" />
              <text x="210" y="136" fill="#94a3b8" fontSize="9" textAnchor="middle">COM</text>
              <circle cx="250" cy="120" r="4" fill="#22c55e" />
              <text x="250" y="136" fill="#94a3b8" fontSize="9" textAnchor="middle">NO</text>
              <circle cx="290" cy="120" r="4" fill="#64748b" />
              <text x="290" y="136" fill="#94a3b8" fontSize="9" textAnchor="middle">NC</text>

              {/* Load (Light / AC Contactor) */}
              <rect x="360" y="40" width="80" height="120" rx="6" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
              <text x="400" y="85" fill="#4ade80" fontSize="11" fontWeight="bold" textAnchor="middle">APPLIANCE</text>
              <text x="400" y="110" fill="#cbd5e1" fontSize="10" textAnchor="middle">AC / Lights</text>

              {/* Wires */}
              <path d="M 120 85 L 206 120" stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d="M 254 120 L 360 85" stroke="#ef4444" strokeWidth="2" fill="none" />
              <path d="M 120 135 L 360 135" stroke="#38bdf8" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 10px' }}>
              Appliance &amp; Lighting Wiring Protocol
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.7 }}>
              <li>
                <b>Lighting &amp; Fan Loads:</b> Feed Phase into <b>COM</b>, and connect the switched return wire to <b>NO</b> (Normally Open).
              </li>
              <li>
                <b>High-Power Air Conditioners &amp; Water Geysers:</b> For loads exceeding 10A, trigger a 25A modular contactor coil via the RvmAiTech relay contact.
              </li>
              <li>
                <b>Existing Wall Switches:</b> Connect standard non-powered mechanical switches between <b>COM</b> and <b>DI1..DI8</b>. Retain manual control even when offline.
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'power-poe' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div style={{ background: '#050c18', padding: '20px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', textTransform: 'uppercase' }}>
              Dual Power Architecture:
            </div>
            <div style={{ background: 'rgba(2, 132, 199, 0.1)', padding: '14px', borderRadius: '8px', border: '1px solid #0284c7', marginBottom: '12px' }}>
              <b style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Option A: IEEE 802.3af PoE (Single Cable)</b>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                Deliver both gigabit network data and 48V DC power through a single standard Cat5e/Cat6 Ethernet cable via any PoE switch or injector.
              </p>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '14px', borderRadius: '8px', border: '1px solid #16a34a' }}>
              <b style={{ color: '#4ade80', display: 'block', marginBottom: '4px' }}>Option B: Wide Voltage Auxiliary Terminal (7~36V DC)</b>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                Connect 12V or 24V industrial SMPS power supply into the <b>7~36V</b> screw terminal block. Features reverse polarity and 2A overcurrent protection.
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 10px' }}>
              Industrial Electrical Protections
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.7 }}>
              <li><b>15kV ESD Surge Suppression:</b> TVS diodes built into RS485 and Ethernet lines to safeguard against industrial motor switching transients.</li>
              <li><b>Flame-Retardant ABS V0 Enclosure:</b> Self-extinguishing DIN-rail casing certified for high-temperature machine control panels up to 85°C.</li>
              <li><b>Optical Galvanic Isolation:</b> 2,500V RMS isolation barrier between high-voltage relay contacts and low-voltage ESP32-S3 microcontroller core.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
