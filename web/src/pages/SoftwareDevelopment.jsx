import { PageHero } from './_hero.jsx';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useState, useEffect } from 'react';
import {
  Code,
  Monitor,
  Smartphone,
  BarChart3,
  Send,
  Laptop,
  Cpu,
  Database,
  Globe,
  ShieldCheck,
  Wand2,
  Activity,
  Server,
  Radio,
  Layers,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Wifi,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Wrench,
  Factory,
  Building,
  Car,
  Warehouse,
  Lightbulb,
  Phone,
  Mail,
} from 'lucide-react';

const ICON_MAP = {
  Code,
  Monitor,
  Smartphone,
  BarChart3,
  Laptop,
  Cpu,
  Database,
  Globe,
  ShieldCheck,
  Wand2,
  Activity,
  Server,
  Radio,
  Layers,
  Wifi,
  Factory,
  Building,
  Car,
  Warehouse,
  Lightbulb,
};

function iconFor(name, size = 26, color = '#f47b20') {
  const Comp = ICON_MAP[name] || Cpu;
  return <Comp size={size} color={color} />;
}

// 03. What We Develop - 8 Core Engineering Disciplines
const DEFAULT_CAPABILITIES = [
  {
    title: 'Custom PCB Design & Development',
    slug: 'custom-pcb-design-development',
    summary: 'Multi-layer PCB layout routing, schematic capture, component selection, rapid prototype fabrication, and hardware validation.',
    description: 'We design production-ready single and multi-layer printed circuit boards optimized for electromagnetic compatibility (EMC), thermal efficiency, and low-cost component sourcing.',
    features: ['Custom PCB Design', 'Schematic Design', 'PCB Layout & Routing', 'Component Selection', 'Prototype PCB Development', 'PCB Testing & Debugging'],
    hardwareUsed: ['KiCad & EasyEDA', 'Altium Designer', 'FR-4 High-TG Substrate', 'SMD & Through-Hole Soldering'],
    softwareUsed: ['Design Rule Checking (DRC)', 'Gerber / Drill Generation', 'BOM Cost Optimization', 'Thermal & Signal Integrity'],
    icon: 'Cpu',
    order: 1,
  },
  {
    title: 'Embedded Systems Development',
    slug: 'embedded-systems-development',
    summary: 'High-reliability microcontroller-based systems with real-time sensor processing and deterministic hardware control.',
    description: 'Custom embedded hardware architectures engineered around ESP32, STM32, and ARM processors designed for 24/7 industrial uptime and harsh shop-floor environments.',
    features: ['ESP32 Development', 'STM32 Microcontrollers', 'Arduino-Based Systems', 'Microcontroller Programming', 'Custom Embedded Controllers', 'Real-Time Data Acquisition'],
    hardwareUsed: ['ESP32-WROOM / S3', 'STM32F4 / G0 ARM Cortex', 'Microchip ATmega', 'Industrial Gateways'],
    softwareUsed: ['FreeRTOS', 'ESP-IDF', 'STM32CubeIDE', 'Embedded C / C++'],
    icon: 'Cpu',
    order: 2,
  },
  {
    title: 'Sensor & Electronics Integration',
    slug: 'sensor-electronics-integration',
    summary: 'Interfacing industrial analog and digital sensors with signal conditioning, optoisolation, and precision telemetry.',
    description: 'Direct hookups for CT current transformers, thermocouples, pressure transmitters, optical cycle counters, and rotary encoders with optoisolated protection circuitry.',
    features: ['Temperature Sensors', 'Proximity Sensors', 'Pressure Sensors', 'Current & Voltage Monitoring', 'Encoder Integration', 'Relay and Digital I/O Systems', 'Analog Signal Processing'],
    hardwareUsed: ['Non-Intrusive CT Sensors', 'PT100 & Type-K Probes', 'Inductive Proximity Sensors', 'Solid-State Relays (SSR)', 'Optoisolated I/O'],
    softwareUsed: ['Kalman Filtering', 'Precision ADC Calibration', 'Debouncing Algorithms', 'Instant Threshold Triggers'],
    icon: 'Activity',
    order: 3,
  },
  {
    title: 'Firmware Development',
    slug: 'firmware-development',
    summary: 'Production-grade embedded firmware with robust hardware peripheral drivers, memory optimization, and over-the-air updates.',
    description: 'Low-level C/C++ firmware engineering implementing peripheral communication, fault-tolerant state machines, hardware watchdogs, and secure dual-bank OTA remote flashing.',
    features: ['Embedded C/C++', 'Device Control Logic', 'Peripheral Communication', 'Firmware Optimization', 'OTA Firmware Updates', 'Device Configuration', 'Hardware Debugging'],
    hardwareUsed: ['JTAG / SWD Debug Adapters', 'Digital Storage Oscilloscopes', 'Logic Analyzers', 'On-Board Flash Memory'],
    softwareUsed: ['UART / SPI / I2C Protocols', 'Dual-Bank Safe OTA', 'Hardware Watchdog Timers', 'Ultra-Low-Power Sleep Modes'],
    icon: 'Code',
    order: 4,
  },
  {
    title: 'IoT & Communication Solutions',
    slug: 'iot-communication-solutions',
    summary: 'Industrial wireless and wired connectivity pipelines transmitting encrypted telemetry to cloud brokers with zero packet loss.',
    description: 'End-to-end industrial connectivity over RS-485 Modbus, MQTT, WebSockets, Wi-Fi, Ethernet, and 4G cellular with local flash buffering for zero data drop during network outages.',
    features: ['Wi-Fi and Bluetooth (BLE)', 'Ethernet Connectivity', 'RS485 Communication', 'Modbus RTU / TCP', 'MQTT Protocol', 'HTTP REST API', 'Cloud Connectivity'],
    hardwareUsed: ['RS-485 Isolated Transceivers', 'W5500 SPI Ethernet', '4G LTE Cellular Modules', 'High-Gain External Antennas'],
    softwareUsed: ['TLS 1.3 Security', 'MQTT QoS 1 / QoS 2', 'Local Flash Queuing', 'Bi-Directional WebSockets'],
    icon: 'Wifi',
    order: 5,
  },
  {
    title: 'Backend & API Development',
    slug: 'backend-api-development',
    summary: 'High-concurrency Node.js and Python microservices handling thousands of edge device connections with persistent time-series ingestion.',
    description: 'Scalable backend engines architected for sub-second query performance, time-series telemetry storage, automated alert triggers, and secure third-party enterprise integrations.',
    features: ['Node.js / Express.js', 'Python Backend', 'REST API Development', 'Database Design', 'Device Data Management', 'Authentication & Security'],
    hardwareUsed: ['AWS & GCP Cloud Compute', 'On-Premises Industrial Servers', 'Dockerized Microservices'],
    softwareUsed: ['PostgreSQL & TimescaleDB', 'MongoDB Atlas', 'Redis Cache', 'JWT & OAuth2 Security'],
    icon: 'Database',
    order: 6,
  },
  {
    title: 'Web & Mobile Application Development',
    slug: 'web-mobile-application-development',
    summary: 'Intuitive, lightning-fast responsive web portals, supervisory control dashboards, and native field mobile apps for plant engineers.',
    description: 'Interactive React.js web platforms and mobile applications providing live OEE telemetry, machine status indicators, supervisor parameter overrides, and automated reporting.',
    features: ['Custom Web Applications', 'Admin Dashboards', 'Real-Time Monitoring UI', 'Android Applications', 'Device Management Panels', 'Reports & Analytics'],
    hardwareUsed: ['Industrial Touchscreen HMIs', 'Android Tablets & Mobiles', 'Control Room Multi-Displays'],
    softwareUsed: ['React.js & Vite', 'Progressive Web Apps (PWA)', 'Tailwind CSS', 'Live Chart.js & D3.js Visualizations'],
    icon: 'Monitor',
    order: 7,
  },
  {
    title: 'Product Prototyping & Integration',
    slug: 'product-prototyping-integration',
    summary: 'Complete product engineering from proof-of-concept (POC) to enclosure assembly, functional verification, and mass deployment.',
    description: 'From rapid 3D prototyping and custom industrial DIN-rail enclosure design to electrical wiring harness assembly, stress testing, and on-site commissioning support.',
    features: ['Electronic Prototype Development', 'Hardware Assembly', 'Enclosure Integration', 'Hardware-Software Testing', 'Functional Validation', 'Product Deployment Support'],
    hardwareUsed: ['Custom 3D Printed Casing', 'Standard IP65 Industrial Boxes', 'DIN-Rail Mountings', 'Automotive-Grade Connectors'],
    softwareUsed: ['Burn-in Stress Testing', 'Thermal Soak Analysis', 'End-to-End Validation Protocols', 'Complete Technical Documentation'],
    icon: 'Layers',
    order: 8,
  },
];

// 04. Featured Technology Pills Cloud (Battle-Tested Stack)
const TECH_PILLS = [
  'Embedded C / C++',
  'FreeRTOS & ESP-IDF',
  'Modbus RTU & Modbus TCP',
  'MQTT & WebSockets',
  'RS-485 / RS-232 DAQ',
  'Node.js & Express',
  'Python (FastAPI & Django)',
  'React.js & Vite',
  'TypeScript',
  'PostgreSQL & TimescaleDB',
  'MongoDB & Redis',
  'Docker & Containerization',
  'OpenCV & Python AI',
  'AWS & Google Cloud IoT',
  'Grafana & Custom Dashboards',
];

// 04. Technical Capabilities - Technology Stack Matrix
const TECH_STACK_MATRIX = [
  { category: 'Microcontrollers', techs: ['ESP32', 'STM32', 'Arduino', 'ARM Cortex-M'], color: 'orange' },
  { category: 'Programming Languages', techs: ['C', 'C++', 'Python', 'JavaScript', 'TypeScript'], color: 'blue' },
  { category: 'PCB Design & CAD', techs: ['KiCad', 'EasyEDA', 'Altium Designer'], color: 'orange' },
  { category: 'Hardware Communication', techs: ['UART', 'SPI', 'I2C', 'RS-485'], color: 'blue' },
  { category: 'Industrial Protocols', techs: ['Modbus RTU / TCP', 'MQTT', 'WebSockets'], color: 'orange' },
  { category: 'Connectivity & Radios', techs: ['Wi-Fi', 'Bluetooth (BLE)', 'Ethernet', '4G LTE'], color: 'blue' },
  { category: 'Backend Architecture', techs: ['Node.js', 'Express.js', 'Python (FastAPI / Django)'], color: 'orange' },
  { category: 'Frontend & Dashboards', techs: ['React.js & Vite', 'HTML5 / CSS3', 'JavaScript'], color: 'blue' },
  { category: 'Database Engines', techs: ['PostgreSQL', 'TimescaleDB', 'MySQL', 'MongoDB', 'Supabase'], color: 'orange' },
  { category: 'Cloud & Telemetry', techs: ['AWS IoT Core', 'Google Cloud IoT', 'Grafana Dashboards'], color: 'blue' },
];

// 05. Development Process - 6 Steps
const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Requirement Analysis',
    summary: 'Evaluating client objectives, machine sensor inputs, physical dimensions, and operational software requirements.',
  },
  {
    step: '02',
    title: 'System Design',
    summary: 'Drafting schematic circuits, component selection, communication protocol definitions, and database/API blueprints.',
  },
  {
    step: '03',
    title: 'Prototype Development',
    summary: 'Rapid POC bench hardware assembly, custom 3D enclosure fabrication, and benchtop functional validation.',
  },
  {
    step: '04',
    title: 'Programming & Integration',
    summary: 'Coding firmware drivers, cloud backend REST APIs, WebSocket streaming, and interactive web/mobile dashboards.',
  },
  {
    step: '05',
    title: 'Testing & Validation',
    summary: 'Stress burn-in verification, electrical noise filtering, fail-safe testing, and end-to-end telemetry audits.',
  },
  {
    step: '06',
    title: 'Final Deployment',
    summary: 'Final product packaging, DIN-rail mounting, documentation handoff, on-site installation, and ongoing engineering SLAs.',
  },
];

// 06. Industries & Applications
const INDUSTRIES_APPLICATIONS = [
  {
    title: 'Manufacturing Industry',
    subtitle: 'Machine Monitoring & Custom Controllers',
    desc: 'Instantaneous cycle counters, OEE analytics gauges, automated downtime alerting, and PLC data acquisition systems.',
    icon: 'Factory',
    tags: ['Cycle Detection', 'OEE Gauges', 'Shift Alerts'],
  },
  {
    title: 'Smart Buildings',
    subtitle: 'Smart Lighting & Building Automation',
    desc: 'Multi-channel relay controllers, energy sub-metering, ambient light triggers, and remote equipment control panels.',
    icon: 'Building',
    tags: ['30A Relays', 'Energy Metering', 'Remote Switching'],
  },
  {
    title: 'Smart Parking',
    subtitle: 'Camera-Based ANPR & Billing Systems',
    desc: 'High-speed number plate recognition cameras, automatic boom barrier actuators, and integrated POS thermal billing.',
    icon: 'Car',
    tags: ['ANPR AI Camera', 'Boom Barriers', 'Thermal POS Print'],
  },
  {
    title: 'Industrial IoT',
    subtitle: 'Connected Sensors & Cloud Monitoring',
    desc: 'Optoisolated current transformers, digital flowmeters, and encrypted MQTT cellular gateways streaming to cloud time-series DBs.',
    icon: 'Activity',
    tags: ['Modbus RS485', 'MQTT TLS', '4G LTE Edge'],
  },
  {
    title: 'Electronics Products',
    subtitle: 'Custom Embedded Product Engineering',
    desc: 'Turnkey electronic hardware productization: from functional bench breadboard to branded commercial enclosures and CE compliance.',
    icon: 'Lightbulb',
    tags: ['Custom PCB', 'Enclosure Design', 'Firmware Handoff'],
  },
  {
    title: 'Warehouse & Logistics',
    subtitle: 'Asset Tracking & Process Automation',
    desc: 'Conveyor package sensing, barcode/OCR verification, automated dispatch routing, and warehouse management software.',
    icon: 'Warehouse',
    tags: ['Barcode Verification', 'Conveyor Gates', 'WMS Integration'],
  },
];

// 07. Featured Projects - Real Working Prototypes & Deployments
const FEATURED_PROJECTS = [
  {
    title: 'Smart Parking Management System',
    status: 'Working Prototype',
    client: 'Commercial Mall & Urban Parking Operator',
    summary: 'Complete automated parking ecosystem uniting edge ANPR cameras, ultrasonic occupancy sensors, automatic boom barrier control, and real-time POS receipt generation with instant WhatsApp PDF billing.',
    highlights: [
      'Camera-Based Number Plate Recognition (ANPR)',
      'Automatic Entry & Exit Boom Barrier Controller',
      'Hourly Parking Fee Calculation & Dynamic Pricing',
      'Automatic Bill Generation & Thermal Receipt Printing',
      'WhatsApp Bill Delivery & UPI/QR Payment Integration',
    ],
    stack: ['ANPR Computer Vision', 'ESP32 Barrier Controller', 'React.js', 'Node.js', 'Thermal POS', 'WhatsApp Cloud API'],
    slug: 'smart-parking-automation',
  },
  {
    title: 'Smart Home Automation Controller',
    status: 'Production Ready',
    client: 'Luxury Residential & Boutique Hospitality',
    summary: 'Industrial-grade dual Wi-Fi + BLE smart automation board engineered with heavy-duty 30A relays, zero-cross switching for fans, and capacitive touch panel integration with offline wall-switch fallback.',
    highlights: [
      'ESP32-Based Industrial Relay Controller (up to 30A heavy loads)',
      'Lights, Fans (speed regulation), AC & TV Control',
      'BLE QR Code One-Touch Mobile Pairing',
      'Android & iOS Mobile Application Control',
      'Dual Wi-Fi & Offline Independent Manual Switch Operation',
    ],
    stack: ['ESP32-WROOM', 'FreeRTOS', 'Capacitive Touch', 'BLE 5.0', 'React Native', 'MQTT Broker'],
    slug: 'smart-home-automation',
  },
  {
    title: 'Industrial Machine Data Monitoring (MDMS)',
    status: 'Live Deployment',
    client: 'Automotive Precision Forging & Stamping Plant',
    summary: 'Non-invasive edge telemetry logger interfacing directly with Siemens and Delta PLCs over Modbus RS-485, streaming instantaneous cycle counts, temperature alerts, and shift OEE to enterprise cloud dashboards.',
    highlights: [
      'Direct RS-485 Modbus Telemetry with Siemens, Delta, & Omron PLCs',
      'Machine Temperature, Current Draw & Spindle Speed Logging',
      'Local Flash Memory Buffering (Zero Data Loss on Network Drop)',
      'Live Multi-Screen SCADA Web Dashboard with Gauge Visualizations',
      'Instant Downtime WhatsApp Alerts to Floor Supervisors',
    ],
    stack: ['STM32 & ESP32 Edge', 'Modbus RTU', 'TimescaleDB', 'Node.js', 'React.js Live Dashboard', '4G LTE Gateway'],
    slug: 'industrial-machine-monitoring',
  },
];

// 08. Why Choose RvmAiTech?
const WHY_CHOOSE_POINTS = [
  {
    title: 'Hardware + Software Under One Roof',
    desc: 'Electronics design, PCB layout, embedded firmware, backend APIs, and frontend dashboards engineered by one unified, agile team.',
    icon: 'Layers',
  },
  {
    title: 'Custom Engineering',
    desc: 'Every circuit, pinout, protocol, and cloud interface is architected around your exact technical constraints — zero generic compromises.',
    icon: 'Wrench',
  },
  {
    title: 'Practical Prototyping',
    desc: 'We transform whiteboard concepts into working hardware prototypes (POC -> EVT -> DVT) quickly, saving expensive manufacturing revisions.',
    icon: 'Cpu',
  },
  {
    title: 'Industrial Connectivity',
    desc: 'Deep specialization in mission-critical field protocols including RS-485 Modbus, MQTT over TLS, CAN bus, 4G LTE, and WebSockets.',
    icon: 'Wifi',
  },
  {
    title: 'Scalable Architecture',
    desc: 'From a single proof-of-concept bench unit to thousands of deployed devices with centralized remote OTA updates and secure device keys.',
    icon: 'Database',
  },
  {
    title: 'Dedicated Technical Support',
    desc: 'Comprehensive engineering schematics, full firmware source code handoff, testing documentation, and guaranteed on-site engineering support.',
    icon: 'ShieldCheck',
  },
];

// 09. Frequently Asked Questions
const FAQ_ITEMS = [
  {
    q: 'Does RvmAiTech develop custom electronic hardware?',
    a: 'Yes. We develop customized electronic circuits, multi-layer PCB designs, embedded controllers, and hardware prototypes engineered specifically around your project requirements and physical enclosure constraints.',
  },
  {
    q: 'Can you develop both hardware and software for one project?',
    a: 'Yes. Our core advantage is unified engineering: we handle the full stack covering electronic schematic design, firmware programming, backend APIs, time-series databases, web dashboards, and mobile applications.',
  },
  {
    q: 'Do you work with ESP32 and STM32 microcontrollers?',
    a: 'Yes. We build embedded controllers utilizing ESP32 (Wi-Fi/BLE), STM32 (ARM Cortex-M), Arduino, and other industrial microcontrollers based on your processing, memory, and power requirements.',
  },
  {
    q: 'Can you convert an existing idea into a working prototype?',
    a: 'Yes. We guide you through requirement analysis, hardware architecture, component selection, rapid PCB prototyping, firmware programming, and physical bench testing to deliver a working demonstration model.',
  },
  {
    q: 'Do you provide industrial communication solutions?',
    a: 'Yes. We specialize in industrial communications including RS485, Modbus RTU/TCP, MQTT, HTTP REST APIs, Wi-Fi, Bluetooth (BLE), Ethernet, and 4G cellular IoT connectivity with local flash queuing.',
  },
  {
    q: 'Do you provide support after project delivery?',
    a: 'Yes. Comprehensive technical support, firmware bug fixes, remote OTA updates, documentation handoff, and ongoing maintenance agreements are provided based on your operational needs.',
  },
];

export default function SoftwareDevelopment() {
  const [capabilities, setCapabilities] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    client
      .get('/capabilities')
      .then((r) => {
        const items = (r.data.items || []).filter((x) => x.published !== false);
        if (items.length > 0) setCapabilities(items);
        else setCapabilities(DEFAULT_CAPABILITIES);
      })
      .catch(() => setCapabilities(DEFAULT_CAPABILITIES));
  }, []);

  const activeCapabilities = capabilities.length > 0 ? capabilities : DEFAULT_CAPABILITIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      company: fd.get('company'),
      subject: `[${fd.get('projectCategory') || 'Custom Development'}] Project Inquiry`,
      budget: fd.get('budget'),
      timeline: fd.get('timeline'),
      message: fd.get('message'),
    };

    if (!body.name || !body.phone) {
      setMsg({ text: 'Please provide both your full name and WhatsApp / phone number.', type: 'err' });
      return;
    }

    setBusy(true);
    setMsg({ text: '', type: '' });
    try {
      await client.post('/contact', body);
      setMsg({
        text: 'Thank you! Your project inquiry has been received directly by our engineering team. We will review your technical specifications and connect with you within 24 hours.',
        type: 'ok',
      });
      e.target.reset();
    } catch (ex) {
      setMsg({
        text: ex?.response?.data?.message || 'Could not submit inquiry right now. Please reach us directly on WhatsApp at +91 70520 50656.',
        type: 'err',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsApp = (topic = 'Custom Hardware & Software Project') => {
    const text = encodeURIComponent(
      `Hello RvmAiTech Team! I would like to discuss my project requirements for: "${topic}". Please connect with me.`
    );
    window.open(`https://wa.me/917052050656?text=${text}`, '_blank');
  };

  return (
    <>
      {/* 01. HERO SECTION */}
      <section
        style={{
          background: 'radial-gradient(120% 120% at 85% 0%, #1a4a8f 0%, #081a36 60%, #050e1f 100%)',
          color: '#ffffff',
          padding: '90px 0 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 960 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(244, 123, 32, 0.16)',
              border: '1px solid rgba(244, 123, 32, 0.4)',
              padding: '6px 16px',
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 700,
              color: '#ff9d52',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            <Sparkles size={15} /> End-to-End Product Engineering
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: '0 auto 20px',
              maxWidth: 880,
            }}
          >
            Custom Hardware &amp; Software Development
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: '#c2d4ec',
              lineHeight: 1.6,
              maxWidth: 760,
              margin: '0 auto 36px',
            }}
          >
            From electronic circuit design to intelligent software, we engineer complete technology solutions tailored to your requirements.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 46 }}>
            <Link
              to="/contact?subject=Custom%20Hardware%20%26%20Software%20Development%20Project"
              className="btn btn-primary"
              style={{
                background: '#f47b20',
                borderColor: '#f47b20',
                color: '#ffffff',
                padding: '14px 34px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                boxShadow: '0 12px 30px -8px rgba(244, 123, 32, 0.65)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Discuss Your Project <ArrowRight size={17} />
            </Link>

            <a
              href="#categories"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '14px 30px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Explore Our Capabilities
            </a>
          </div>

          {/* 4 Proof Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              padding: '24px 20px',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f47b20' }}>Unified</div>
              <div style={{ color: '#b6c6de', fontSize: 13, marginTop: 4 }}>Hardware + Software Under One Roof</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>Custom</div>
              <div style={{ color: '#b6c6de', fontSize: 13, marginTop: 4 }}>PCB &amp; Embedded Firmware</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>Real-Time</div>
              <div style={{ color: '#b6c6de', fontSize: 13, marginTop: 4 }}>Cloud Telemetry &amp; SCADA UI</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#facc15' }}>Working</div>
              <div style={{ color: '#b6c6de', fontSize: 13, marginTop: 4 }}>Bench Prototypes &amp; SLAs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 02. ABOUT THIS SERVICE */}
      <section style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">02. About This Service</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 38px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Bridging Electronics Engineering &amp; Modern Software
            </h2>
            <p
              style={{
                color: '#4a5b73',
                fontSize: 17,
                lineHeight: 1.7,
                maxWidth: 820,
                margin: '16px auto 0',
                fontWeight: 500,
              }}
            >
              RvmAiTech designs and develops custom electronic hardware, embedded systems, firmware, and software applications. We combine electronics engineering with modern software technologies to build reliable, scalable, and application-specific solutions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="card card-dynamic hover-orange" style={{ background: '#f8fbff', border: '1.5px solid #dce8f8', borderRadius: 16, padding: '30px 26px', cursor: 'pointer' }}>
              <div className="card-icon-wrap" style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(244,123,32,0.12)', border: '1px solid rgba(244,123,32,0.25)', color: '#f47b20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'all 0.3s ease' }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: 20, color: '#0d2649', marginBottom: 10, fontWeight: 700 }}>Circuit-to-Cloud Integration</h3>
              <p style={{ color: '#52637a', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                From physical sensor signal conditioning, optoisolation, and multi-layer PCB routing directly to cloud databases and WebSocket real-time visualizers.
              </p>
            </div>

            <div className="card card-dynamic hover-blue" style={{ background: '#f8fbff', border: '1.5px solid #dce8f8', borderRadius: 16, padding: '30px 26px', cursor: 'pointer' }}>
              <div className="card-icon-wrap" style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(19,81,180,0.12)', border: '1px solid rgba(19,81,180,0.25)', color: '#1351b4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'all 0.3s ease' }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: 20, color: '#0d2649', marginBottom: 10, fontWeight: 700 }}>Rapid Product Prototyping</h3>
              <p style={{ color: '#52637a', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                Structured POC (Proof of Concept) and EVT bench testing to validate mechanics, ergonomics, and circuits before initiating expensive tooling and mass production.
              </p>
            </div>

            <div className="card card-dynamic hover-orange" style={{ background: '#f8fbff', border: '1.5px solid #dce8f8', borderRadius: 16, padding: '30px 26px', cursor: 'pointer' }}>
              <div className="card-icon-wrap" style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(244,123,32,0.12)', border: '1px solid rgba(244,123,32,0.25)', color: '#f47b20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'all 0.3s ease' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: 20, color: '#0d2649', marginBottom: 10, fontWeight: 700 }}>Industrial Reliability &amp; Uptime</h3>
              <p style={{ color: '#52637a', fontSize: 15, lineHeight: 1.65, margin: 0 }}>
                Engineered with hardware watchdogs, noise debouncing, surge protection, local flash buffering, and secure dual-bank over-the-air (OTA) updates for zero downtime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03. WHAT WE DEVELOP - 8 CATEGORIES */}
      <section id="categories" style={{ padding: '80px 0', background: '#f4f8fc', borderTop: '1px solid #e3e9f2', borderBottom: '1px solid #e3e9f2' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 50px' }}>
            <div className="sec-kicker">03. What We Develop</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Development Disciplines &amp; Categories
            </h2>
            <p style={{ color: '#55657d', fontSize: 16.5, maxWidth: 720, margin: '12px auto 0', lineHeight: 1.6 }}>
              Eight specialized disciplines covering custom electronic circuits, embedded firmware, communication protocols, and enterprise software platforms.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 26,
            }}
          >
            {[...activeCapabilities]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((c, i) => {
                const isOrange = i % 2 === 0;
                const hoverClass = isOrange ? 'hover-orange' : 'hover-blue';
                const targetSlug = c.slug || `capability-${i + 1}`;
                return (
                  <Link
                    key={c.slug || i}
                    to={`/software-development/${targetSlug}`}
                    className={`card link card-dynamic ${hoverClass}`}
                    style={{
                      padding: '32px 28px',
                      border: '1.5px solid #dce8f8',
                      borderRadius: 18,
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div
                        className="card-icon-wrap"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: isOrange ? 'rgba(244,123,32,0.1)' : 'rgba(19,81,180,0.1)',
                          border: isOrange ? '1px solid rgba(244,123,32,0.25)' : '1px solid rgba(19,81,180,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {iconFor(c.icon, 26, isOrange ? '#f47b20' : '#1351b4')}
                      </div>
                      <span
                        className="step-badge"
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: isOrange ? '#f47b20' : '#1351b4',
                          background: isOrange ? 'rgba(244,123,32,0.08)' : 'rgba(19,81,180,0.08)',
                          padding: '4px 10px',
                          borderRadius: 20,
                          border: isOrange ? '1px solid rgba(244,123,32,0.2)' : '1px solid rgba(19,81,180,0.2)',
                        }}
                      >
                        Category 0{i + 1}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 20, color: '#0d2649', margin: '0 0 10px', fontWeight: 700 }}>{c.title}</h3>
                    <p style={{ color: '#52637a', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 16px' }}>{c.summary}</p>

                    {/* Feature Checklist */}
                    {c.features && c.features.length > 0 && (
                      <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {c.features.slice(0, 5).map((f, fIdx) => (
                          <li key={fIdx} style={{ fontSize: 13.5, color: '#384d68', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <CheckCircle2 size={15} color="#107e44" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Hardware & Software Tags */}
                    {c.hardwareUsed && c.hardwareUsed.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto', marginBottom: 14 }}>
                        {c.hardwareUsed.slice(0, 3).map((hw, hIdx) => (
                          <span key={hIdx} className="card-tech-tag">{hw}</span>
                        ))}
                      </div>
                    )}

                    <span
                      className="card-action-link"
                      style={{
                        paddingTop: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        color: isOrange ? '#f47b20' : '#1351b4',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderTop: '1px solid #edf2f9',
                      }}
                    >
                      Explore category details <ArrowRight size={15} />
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* 04. TECHNICAL CAPABILITIES - TECHNOLOGY STACK */}
      <section id="stack" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 36px' }}>
            <div className="sec-kicker">04. Technical Capabilities</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Our Technology Stack
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, maxWidth: 680, margin: '12px auto 0' }}>
              Battle-tested tools and frameworks for industrial reliability and sub-second data execution.
            </p>
          </div>

          {/* Featured Technology Pills Cloud (Image 2 style) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
              maxWidth: 980,
              margin: '0 auto 48px',
            }}
          >
            {TECH_PILLS.map((pill, pIdx) => (
              <span key={pIdx} className="cloud-tech-pill">
                {pill}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {TECH_STACK_MATRIX.map((item, idx) => {
              const isOrange = idx % 2 === 0;
              const hoverClass = isOrange ? 'hover-orange' : 'hover-blue';
              return (
                <div
                  key={idx}
                  className={`card card-dynamic ${hoverClass}`}
                  style={{
                    background: '#f8fbff',
                    border: '1.5px solid #dce8f8',
                    borderRadius: 16,
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: isOrange ? '#f47b20' : '#1351b4',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {item.category}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {item.techs.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="card-tech-tag"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 05. OUR DEVELOPMENT PROCESS - 6 STEPS (TIMELINE STYLE) */}
      <section id="process" style={{ padding: '80px 0', background: '#f5f9fe', borderTop: '1px solid #e3e9f2' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            <div className="sec-kicker">05. Our Development Process</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              How We Deliver Projects
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, maxWidth: 660, margin: '12px auto 0', lineHeight: 1.6 }}>
              A structured 6-stage engineering roadmap turning your technical requirements into verified production hardware and software.
            </p>
          </div>

          <div className="flow">
            {PROCESS_STEPS.map((s, i) => (
              <div className="flow-step" key={i}>
                <div className="flow-node">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06. INDUSTRIES & APPLICATIONS */}
      <section id="industries" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            <div className="sec-kicker">06. Industries &amp; Applications</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Tailored Across Mission-Critical Domains
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, maxWidth: 660, margin: '12px auto 0' }}>
              Solving real industrial and commercial problems through custom electronic controllers and integrated software.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {INDUSTRIES_APPLICATIONS.map((ind, i) => {
              const isOrange = i % 2 === 0;
              const hoverClass = isOrange ? 'hover-orange' : 'hover-blue';
              return (
                <div
                  key={i}
                  className={`card card-dynamic ${hoverClass}`}
                  style={{
                    background: '#fcfdfe',
                    border: '1.5px solid #dce8f8',
                    borderRadius: 16,
                    padding: '28px 24px',
                  }}
                >
                  <div
                    className="card-icon-wrap"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: isOrange ? 'rgba(244,123,32,0.1)' : 'rgba(19,81,180,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                    }}
                  >
                    {iconFor(ind.icon, 24, isOrange ? '#f47b20' : '#1351b4')}
                  </div>
                  <h3 style={{ fontSize: 20, color: '#0d2649', margin: '0 0 6px', fontWeight: 700 }}>{ind.title}</h3>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isOrange ? '#f47b20' : '#1351b4', marginBottom: 10 }}>
                    {ind.subtitle}
                  </div>
                  <p style={{ color: '#52637a', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 16px' }}>{ind.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                    {ind.tags.map((tg, tgIdx) => (
                      <span key={tgIdx} className="card-tech-tag">{tg}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 07. FEATURED PROJECTS - REAL PROTOTYPES & STATUS */}
      <section id="projects" style={{ padding: '80px 0', background: '#f8fafc', borderTop: '1px solid #e3e9f2' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 50px' }}>
            <div className="sec-kicker">07. Featured Projects</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Real Projects &amp; Verified Prototypes
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, maxWidth: 660, margin: '12px auto 0' }}>
              Real hardware, deployed firmware, and live software systems engineered by RvmAiTech.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 28,
            }}
          >
            {FEATURED_PROJECTS.map((p, idx) => {
              const isOrange = idx % 2 === 0;
              const hoverClass = isOrange ? 'hover-orange' : 'hover-blue';
              return (
                <Link
                  key={p.slug || idx}
                  to={`/software-development/${p.slug}`}
                  className={`card link card-dynamic ${hoverClass}`}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #dce8f8',
                    borderRadius: 18,
                    padding: '30px 26px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isOrange ? '#f47b20' : '#1351b4', textTransform: 'uppercase' }}>
                      {p.client}
                    </span>
                    <span
                      className="static-badge"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 800,
                        background: '#eafaf1',
                        color: '#107e44',
                        border: '1px solid #bbf7d0',
                        padding: '3px 9px',
                        borderRadius: 12,
                      }}
                    >
                      ● {p.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 20, color: '#0d2649', margin: '0 0 10px', fontWeight: 700 }}>{p.title}</h3>
                  <p style={{ color: '#52637a', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 16px' }}>{p.summary}</p>

                  <ul style={{ margin: '0 0 18px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {p.highlights.map((h, hIdx) => (
                      <li key={hIdx} style={{ fontSize: 13.5, color: '#384d68', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <CheckCircle2 size={15} color="#107e44" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', marginBottom: 16 }}>
                    {p.stack.map((item, sIdx) => (
                      <span key={sIdx} className="card-tech-tag">{item}</span>
                    ))}
                  </div>

                  <span
                    className="card-action-link"
                    style={{
                      paddingTop: 12,
                      fontSize: 14,
                      fontWeight: 700,
                      color: isOrange ? '#f47b20' : '#1351b4',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderTop: '1px solid #edf2f9',
                    }}
                  >
                    View Project Case Study &amp; Architecture →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 08. WHY CHOOSE RVMAITECH */}
      <section id="why-us" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="wrap">
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 48px' }}>
            <div className="sec-kicker">08. Why Choose RvmAiTech?</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              The RvmAiTech Advantage
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, maxWidth: 660, margin: '12px auto 0' }}>
              We eliminate finger-pointing between hardware designers and software coders by executing the full product in-house.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            {WHY_CHOOSE_POINTS.map((pt, i) => {
              const isOrange = i % 2 === 0;
              const hoverClass = isOrange ? 'hover-orange' : 'hover-blue';
              return (
                <div
                  key={i}
                  className={`card card-dynamic ${hoverClass}`}
                  style={{
                    background: '#f8fbff',
                    border: '1.5px solid #dce8f8',
                    borderRadius: 16,
                    padding: '28px 24px',
                    display: 'flex',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="card-icon-wrap"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: isOrange ? 'rgba(244,123,32,0.12)' : 'rgba(19,81,180,0.12)',
                      border: isOrange ? '1px solid rgba(244,123,32,0.25)' : '1px solid rgba(19,81,180,0.25)',
                      color: isOrange ? '#f47b20' : '#1351b4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {iconFor(pt.icon, 24, isOrange ? '#f47b20' : '#1351b4')}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 19, color: '#0d2649', margin: '0 0 8px', fontWeight: 700 }}>{pt.title}</h3>
                    <p style={{ color: '#52637a', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{pt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 09. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" style={{ padding: '80px 0', background: '#f5f9fe', borderTop: '1px solid #e3e9f2' }}>
        <div className="wrap" style={{ maxWidth: 880 }}>
          <div className="sec-head" style={{ textAlign: 'center', margin: '0 auto 46px' }}>
            <div className="sec-kicker">09. Frequently Asked Questions</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#0d2649', marginTop: 10, fontWeight: 800 }}>
              Questions &amp; Technical Clarifications
            </h2>
            <p style={{ color: '#55657d', fontSize: 16, margin: '12px auto 0' }}>
              Common questions clients ask before starting a custom hardware or software development engagement.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: isOpen ? '1.5px solid #f47b20' : '1.5px solid #dce8f8',
                    borderRadius: 14,
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    boxShadow: isOpen ? '0 8px 24px -10px rgba(244,123,32,0.25)' : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: 14,
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 700, color: isOpen ? '#f47b20' : '#0d2649' }}>
                      {item.q}
                    </span>
                    <span style={{ color: isOpen ? '#f47b20' : '#718096', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 24px 22px', color: '#4a5b73', fontSize: 15.5, lineHeight: 1.7, borderTop: '1px solid #f0f5fa', paddingTop: 14 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. PROJECT INQUIRY FORM */}
      <section id="inquiry" style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="wrap" style={{ maxWidth: 960 }}>
          <div
            style={{
              borderRadius: 24,
              background: 'linear-gradient(135deg, #0d2649 0%, #153c6d 100%)',
              color: '#ffffff',
              padding: '48px 36px',
              boxShadow: '0 24px 60px -15px rgba(13,38,73,0.4)',
            }}
          >
            <div style={{ maxWidth: 680, marginBottom: 32 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(244, 123, 32, 0.2)',
                  border: '1px solid rgba(244, 123, 32, 0.4)',
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#ff9d52',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                <Sparkles size={15} /> 10. Start Your Project Consultation
              </div>

              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#ffffff', margin: '0 0 10px', fontWeight: 800 }}>
                Request a Proposal &amp; Technical Consultation
              </h2>
              <p style={{ color: '#b6c6de', fontSize: 16, lineHeight: 1.6, margin: 0 }}>
                Tell us about your machine signals, application requirements, or prototype goals. Our lead system architect will review your technical specifications and share a tailored engineering proposal within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Full Name <span style={{ color: '#f47b20' }}>*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Vivek Bhardwaj"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  WhatsApp / Phone Number <span style={{ color: '#f47b20' }}>*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 70520 50656"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Business Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="rahul@company.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Company Name / Organization
                </label>
                <input
                  name="company"
                  placeholder="e.g. Apex Engineering Ltd."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Project Category
                </label>
                <select
                  name="projectCategory"
                  defaultValue="Custom PCB Design & Development"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                >
                  <option value="Custom PCB Design & Development">A. Custom PCB Design &amp; Development</option>
                  <option value="Embedded Systems Development">B. Embedded Systems Development (ESP32 / STM32)</option>
                  <option value="Sensor & Electronics Integration">C. Sensor &amp; Electronics Integration (CT / Encoders / Relays)</option>
                  <option value="Firmware Development">D. Firmware Development (Embedded C/C++ / OTA)</option>
                  <option value="IoT & Communication Solutions">E. IoT &amp; Communication Solutions (Modbus / MQTT / 4G)</option>
                  <option value="Backend & API Development">F. Backend &amp; API Development (Node.js / Python / SQL)</option>
                  <option value="Web & Mobile Application Development">G. Web &amp; Mobile Application Development (React / Dashboards)</option>
                  <option value="Product Prototyping & Integration">H. Product Prototyping &amp; Integration (Enclosure / POC)</option>
                  <option value="Complete Hardware + Software">Complete Turnkey Hardware + Software Solution</option>
                  <option value="Other Technical Requirement">Other Technical Requirement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Expected Budget Range
                </label>
                <select
                  name="budget"
                  defaultValue="₹50,000 – ₹1,50,000"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                >
                  <option value="Under ₹50,000">Under ₹50,000 (Small Prototype / Diagnostic)</option>
                  <option value="₹50,000 – ₹1,50,000">₹50,000 – ₹1,50,000 (POC / Controller)</option>
                  <option value="₹1,50,000 – ₹5,00,000">₹1,50,000 – ₹5,00,000 (Complete System / Board)</option>
                  <option value="₹5,00,000 – ₹15,00,000">₹5,00,000 – ₹15,00,000 (Multi-Unit Deployment)</option>
                  <option value="₹15,00,000+">₹15,00,000+ (Large Enterprise Automation)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Project Timeline
                </label>
                <select
                  name="timeline"
                  defaultValue="1 to 3 Months"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                >
                  <option value="Immediate (< 1 Month)">Immediate (&lt; 1 Month - Urgent Prototype)</option>
                  <option value="1 to 3 Months">1 to 3 Months (Standard Engineering Cycle)</option>
                  <option value="3 to 6 Months">3 to 6 Months (Multi-Stage Custom Product)</option>
                  <option value="Planning Phase / Flexible">Planning Phase / Flexible</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#c9d6e8', marginBottom: 6, fontWeight: 600 }}>
                  Project Description &amp; Technical Requirements
                </label>
                <textarea
                  name="message"
                  rows="4"
                  required
                  placeholder="Please describe sensor inputs, communication protocols, number of units, dimensions, or cloud software features needed..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', color: '#0d2649', fontSize: 14.5 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 34px',
                    fontSize: 15.5,
                    background: '#f47b20',
                    borderColor: '#f47b20',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 10,
                  }}
                >
                  <Send size={17} /> {busy ? 'Submitting Proposal Request…' : 'Submit Project Inquiry'}
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsApp('Complete Custom Hardware & Software Project')}
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px 24px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MessageSquare size={17} /> Instant WhatsApp Consultation
                </button>
              </div>

              {msg.text && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: msg.type === 'ok' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                    border: msg.type === 'ok' ? '1px solid #22c55e' : '1px solid #ef4444',
                    color: '#ffffff',
                    fontSize: 14.5,
                    marginTop: 10,
                  }}
                >
                  {msg.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* 11. FINAL CALL TO ACTION */}
      <section style={{ padding: '60px 0', background: '#0a1d37', color: '#ffffff', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="wrap" style={{ textAlign: 'center', maxWidth: 860 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#ffffff', fontWeight: 800, marginBottom: 14 }}>
            Have an Idea? Let's Engineer It.
          </h2>
          <p style={{ color: '#b6c6de', fontSize: 17, lineHeight: 1.6, maxWidth: 680, margin: '0 auto 30px' }}>
            From custom electronic hardware to intelligent software applications, RvmAiTech helps turn your technical requirements into working solutions.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="mailto:rvmaitech2026@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.1)',
                padding: '10px 20px',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Mail size={16} color="#f47b20" /> rvmaitech2026@gmail.com
            </a>
            <a
              href="tel:+917052050656"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.1)',
                padding: '10px 20px',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Phone size={16} color="#38bdf8" /> +91 7052050656
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
